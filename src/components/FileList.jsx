import { useState, useEffect } from 'react';
import FileItem from './FileItem';

export default function FileList({ refreshKey, onDelete }) {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFiles = async () => {
        try {
            const res = await fetch('/api/files');
            const data = await res.json();
            setFiles(data.files || []);
        } catch {
            setFiles([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [refreshKey]);

    if (loading) {
        return <div className="file-list-empty"><div className="loader" /></div>;
    }

    if (files.length === 0) {
        return (
            <div className="file-list-empty">
                <span className="empty-icon">📂</span>
                <p>No files shared yet</p>
                <p className="empty-hint">Upload a file above to get started</p>
            </div>
        );
    }

    return (
        <div className="file-list">
            {files.map((file) => (
                <FileItem key={file.name} file={file} onDelete={onDelete} />
            ))}
        </div>
    );
}
