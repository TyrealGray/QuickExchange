import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import os from 'os';
import mime from 'mime-types';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const isProduction = process.argv.includes('--production');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());

// ─── Serve frontend in production ────────────────────────
if (isProduction) {
    const distPath = path.join(__dirname, '..', 'dist');
    app.use(express.static(distPath));
    // Catch-all: serve index.html for any non-API route (SPA fallback)
    // This is registered after static but before API routes are checked,
    // however we need the API routes to take priority, so we use a
    // middleware that only serves index.html if the request doesn't start with /api
    app.use((req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

// Multer storage configuration — preserve original filename with dedup
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext);
        let finalName = file.originalname;
        let counter = 1;
        while (fs.existsSync(path.join(UPLOADS_DIR, finalName))) {
            finalName = `${base} (${counter})${ext}`;
            counter++;
        }
        cb(null, finalName);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB limit
});

// ─── API Routes ──────────────────────────────────────────

// Get LAN IP addresses
app.get('/api/ip', (_req, res) => {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push({ name, address: iface.address });
            }
        }
    }
    res.json({ addresses, port: PORT });
});

// Upload files (multiple)
app.post('/api/upload', upload.array('files', 20), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    const uploaded = req.files.map((f) => ({
        name: f.filename,
        size: f.size,
        type: f.mimetype,
    }));
    res.json({ files: uploaded });
});

// List uploaded files
app.get('/api/files', (_req, res) => {
    try {
        const entries = fs.readdirSync(UPLOADS_DIR);
        const files = entries
            .map((name) => {
                const filePath = path.join(UPLOADS_DIR, name);
                const stat = fs.statSync(filePath);
                if (!stat.isFile()) return null;
                return {
                    name,
                    size: stat.size,
                    modified: stat.mtime,
                    type: mime.lookup(name) || 'application/octet-stream',
                };
            })
            .filter(Boolean)
            .sort((a, b) => new Date(b.modified) - new Date(a.modified));
        res.json({ files });
    } catch {
        res.json({ files: [] });
    }
});

// Serve / download a specific file
app.get('/api/files/:filename', (req, res) => {
    const filePath = path.join(UPLOADS_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }
    // If ?download query param, force download
    if (req.query.download !== undefined) {
        return res.download(filePath, req.params.filename);
    }
    const mimeType = mime.lookup(req.params.filename) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    fs.createReadStream(filePath).pipe(res);
});

// Get text content of a file (for preview)
app.get('/api/files/:filename/text', (req, res) => {
    const filePath = path.join(UPLOADS_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }
    const stat = fs.statSync(filePath);
    // Limit preview to 100 KB
    if (stat.size > 100 * 1024) {
        return res.json({ content: '[File too large to preview — download it instead]', truncated: true });
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ content, truncated: false });
});

// Delete a single file
app.delete('/api/files/:filename', (req, res) => {
    const filePath = path.join(UPLOADS_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }
    fs.unlinkSync(filePath);
    res.json({ success: true });
});

// Delete ALL files
app.delete('/api/files', (_req, res) => {
    const entries = fs.readdirSync(UPLOADS_DIR);
    for (const name of entries) {
        const fp = path.join(UPLOADS_DIR, name);
        if (fs.statSync(fp).isFile()) fs.unlinkSync(fp);
    }
    res.json({ success: true, deleted: entries.length });
});



// ─── Start ───────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 QuickExchange server running on port ${PORT}`);
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`   LAN: http://${iface.address}:${PORT}`);
            }
        }
    }
    console.log(`   Local: http://localhost:${PORT}\n`);
});
