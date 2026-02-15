# ⚡ QuickExchange

**Instant file sharing on your local network.** No cloud, no sign-up, no fuss.

QuickExchange spins up a lightweight web server that lets any device on your LAN upload, download, and preview files through a sleek browser UI. Perfect for quickly moving files between your phone, laptop, and desktop — or sharing with friends on the same Wi-Fi.

---

## ✨ Features

- 📡 **LAN Discovery** — Shows your local IP address right on the page so other devices know where to connect
- 📤 **Drag & Drop Upload** — Drop files onto the page or tap to select (supports multiple files, up to 500 MB each)
- 📥 **One-Click Download** — Download any shared file instantly
- 👁️ **Inline Preview** — Expand files to preview images, videos, audio, and text/code without downloading
- 📱 **Mobile-Friendly** — Fully responsive UI with large touch targets, works great on phones and tablets
- 🗑️ **Clear All** — One button to wipe all shared files (with confirmation)

---

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/TyrealGray/QuickExchange.git
cd QuickExchange

# Install dependencies
npm install

# Start in development mode (hot-reload)
npm run dev
```

Open **http://localhost:5173** (if port 5173 is in use, it will try another one) in your browser. The IP banner at the top shows the address other devices should visit (e.g. `http://192.168.x.x:3001`).

### Production Mode

```bash
npm run build
npm start
```

Everything is served from a single Express server at **http://localhost:3001**.

---

## 📁 Project Structure

```
QuickExchange/
├── server/
│   ├── index.js           # Express API (upload, download, delete, IP detection)
│   └── uploads/           # Uploaded files stored here at runtime
├── src/
│   ├── main.jsx           # React entry point
│   ├── App.jsx            # App shell
│   ├── index.css          # Styling (dark theme, responsive)
│   └── components/
│       ├── IPBanner.jsx   # LAN IP display with click-to-copy
│       ├── UploadZone.jsx # Drag & drop + file picker
│       ├── FileList.jsx   # File listing
│       ├── FileItem.jsx   # Expandable file with preview
│       └── ClearAll.jsx   # Delete-all button with confirmation
├── index.html
├── vite.config.js
└── package.json
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 · Vite 6 · Vanilla CSS |
| Backend | Express · Multer · Node.js |
| Design | Dark glassmorphism · Inter font · Mobile-first responsive |

---

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/ip` | Returns LAN IP addresses and port |
| `GET` | `/api/files` | Lists all uploaded files |
| `GET` | `/api/files/:name` | Serves a file (add `?download` to force download) |
| `GET` | `/api/files/:name/text` | Returns text content for preview (max 100 KB) |
| `POST` | `/api/upload` | Upload files (multipart, field name: `files`) |
| `DELETE` | `/api/files/:name` | Delete a single file |
| `DELETE` | `/api/files` | Delete all files |
