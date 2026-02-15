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
const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
let lastActivityTime = Date.now();

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());

// Track activity - reset idle timer on every request
app.use((_req, _res, next) => {
    lastActivityTime = Date.now();
    next();
});

if (isProduction) {
    const distPath = path.join(__dirname, '..', 'dist');
    app.use(express.static(distPath));
    app.use((req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

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
    limits: { fileSize: 500 * 1024 * 1024 },
});

function getUniqueFilename(baseName, extension = '.txt') {
    let finalName = `${baseName}${extension}`;
    let counter = 1;
    while (fs.existsSync(path.join(UPLOADS_DIR, finalName))) {
        finalName = `${baseName} (${counter})${extension}`;
        counter++;
    }
    return finalName;
}

// Get LAN IP addresses
app.get('/api/ip', (_req, res) => {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
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

// Save text directly from UI as a shareable text file
app.post('/api/text', (req, res) => {
    const rawText = typeof req.body?.text === 'string' ? req.body.text : '';
    if (!rawText.trim()) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = getUniqueFilename(`note-${stamp}`);
    const filePath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(filePath, rawText, 'utf-8');
    const stat = fs.statSync(filePath);

    res.status(201).json({
        file: {
            name: filename,
            size: stat.size,
            modified: stat.mtime,
            type: 'text/plain',
        },
    });
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
    if (stat.size > 100 * 1024) {
        return res.json({ content: '[File too large to preview - download it instead]', truncated: true });
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

// Shutdown the server
app.post('/api/shutdown', (_req, res) => {
    res.json({ success: true, message: 'Server shutting down...' });
    console.log('\nShutdown requested via web UI.');
    setTimeout(() => {
        server.close(() => process.exit(0));
    }, 100);
});

function shutdownServer(reason) {
    console.log(`\n${reason}`);
    server.close(() => process.exit(0));
}

const idleChecker = setInterval(() => {
    if (Date.now() - lastActivityTime >= IDLE_TIMEOUT_MS) {
        clearInterval(idleChecker);
        shutdownServer('Server idle for 10 minutes - shutting down automatically.');
    }
}, 60_000);

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nQuickExchange server running on port ${PORT}`);
    console.log('   Auto-shutdown after 10 min idle');
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`   LAN: http://${iface.address}:${PORT}`);
            }
        }
    }
    console.log(`   Local: http://localhost:${PORT}\n`);
});


