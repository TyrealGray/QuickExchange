import { useState } from 'react';

export default function FileItem({ file, onDelete }) {
    const [expanded, setExpanded] = useState(false);
    const [textContent, setTextContent] = useState(null);
    const [loadingText, setLoadingText] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const isImage = file.type?.startsWith('image/');
    const isVideo = file.type?.startsWith('video/');
    const isAudio = file.type?.startsWith('audio/');
    const isText =
        file.type?.startsWith('text/') ||
        file.type === 'application/json' ||
        file.type === 'application/javascript' ||
        file.type === 'application/xml' ||
        file.type === 'application/x-yaml' ||
        /\.(md|log|csv|ini|cfg|conf|yaml|yml|toml|env|sh|bat|cmd|ps1|py|js|ts|jsx|tsx|html|css|scss|less|sql|xml|json|txt)$/i.test(file.name);
    const isPreviewable = isImage || isVideo || isAudio || isText;

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    };

    const formatDate = (d) => {
        return new Date(d).toLocaleString();
    };

    const getFileIcon = () => {
        if (isImage) return '🖼️';
        if (isVideo) return '🎬';
        if (isAudio) return '🎵';
        if (isText) return '📄';
        if (file.type?.includes('pdf')) return '📕';
        if (file.type?.includes('zip') || file.type?.includes('rar') || file.type?.includes('7z') || file.type?.includes('tar')) return '📦';
        return '📎';
    };

    const handleToggle = async () => {
        const willExpand = !expanded;
        setExpanded(willExpand);

        if (willExpand && isText && textContent === null) {
            setLoadingText(true);
            try {
                const res = await fetch(`/api/files/${encodeURIComponent(file.name)}/text`);
                const data = await res.json();
                setTextContent(data.content);
            } catch {
                setTextContent('[Failed to load preview]');
            } finally {
                setLoadingText(false);
            }
        }
    };

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (deleting) return;
        setDeleting(true);
        try {
            await fetch(`/api/files/${encodeURIComponent(file.name)}`, { method: 'DELETE' });
            onDelete?.();
        } catch {
            setDeleting(false);
        }
    };

    const handleDownload = (e) => {
        e.stopPropagation();
        const a = document.createElement('a');
        a.href = `/api/files/${encodeURIComponent(file.name)}?download`;
        a.download = file.name;
        a.click();
    };

    return (
        <div className={`file-item ${expanded ? 'expanded' : ''}`}>
            <div className="file-item-header" onClick={handleToggle}>
                <div className="file-info">
                    <span className="file-icon">{getFileIcon()}</span>
                    <div className="file-details">
                        <span className="file-name">{file.name}</span>
                        <span className="file-meta">
                            {formatSize(file.size)} · {formatDate(file.modified)}
                        </span>
                    </div>
                </div>
                <div className="file-actions">
                    <button className="btn-icon btn-download" onClick={handleDownload} title="Download">
                        ⬇️
                    </button>
                    <button className="btn-icon btn-delete" onClick={handleDelete} title="Delete" disabled={deleting}>
                        🗑️
                    </button>
                    {isPreviewable && (
                        <span className={`expand-arrow ${expanded ? 'rotated' : ''}`}>▼</span>
                    )}
                </div>
            </div>

            {expanded && isPreviewable && (
                <div className="file-preview">
                    {isImage && (
                        <img
                            src={`/api/files/${encodeURIComponent(file.name)}`}
                            alt={file.name}
                            className="preview-image"
                            loading="lazy"
                        />
                    )}
                    {isVideo && (
                        <video
                            src={`/api/files/${encodeURIComponent(file.name)}`}
                            controls
                            className="preview-video"
                            preload="metadata"
                        />
                    )}
                    {isAudio && (
                        <audio
                            src={`/api/files/${encodeURIComponent(file.name)}`}
                            controls
                            className="preview-audio"
                        />
                    )}
                    {isText && (
                        <div className="preview-text">
                            {loadingText ? (
                                <div className="loader" />
                            ) : (
                                <pre>{textContent}</pre>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
