import { useState, useRef } from 'react';

export default function UploadZone({ onUploadComplete }) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);
    const dragCounter = useRef(0);

    const handleFiles = async (files) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        for (const file of files) {
            formData.append('files', file);
        }

        try {
            const xhr = new XMLHttpRequest();
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    setProgress(Math.round((e.loaded / e.total) * 100));
                }
            });

            await new Promise((resolve, reject) => {
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) resolve();
                    else reject(new Error('Upload failed'));
                };
                xhr.onerror = () => reject(new Error('Upload failed'));
                xhr.open('POST', '/api/upload');
                xhr.send(formData);
            });

            onUploadComplete?.();
        } catch (err) {
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const onDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        setIsDragging(true);
    };

    const onDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) setIsDragging(false);
    };

    const onDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const onDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;
        handleFiles(e.dataTransfer.files);
    };

    const onFileSelect = (e) => {
        handleFiles(e.target.files);
        e.target.value = '';
    };

    return (
        <div
            className={`upload-zone ${isDragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
        >
            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={onFileSelect}
                className="upload-input"
            />

            {uploading ? (
                <div className="upload-progress">
                    <div className="upload-spinner" />
                    <p>Uploading… {progress}%</p>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            ) : (
                <div className="upload-prompt">
                    <div className="upload-icon">
                        {isDragging ? '📥' : '☁️'}
                    </div>
                    <p className="upload-text">
                        {isDragging ? 'Drop files here!' : 'Tap to select files or drag & drop'}
                    </p>
                    <p className="upload-hint">Supports any file type · Max 500 MB per file</p>
                </div>
            )}
        </div>
    );
}
