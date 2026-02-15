import { useState, useCallback } from 'react';
import IPBanner from './components/IPBanner';
import UploadZone from './components/UploadZone';
import TextInput from './components/TextInput';
import FileList from './components/FileList';
import ClearAll from './components/ClearAll';
import ShutdownButton from './components/ShutdownButton';

export default function App() {
    const [refreshKey, setRefreshKey] = useState(0);

    const triggerRefresh = useCallback(() => {
        setRefreshKey((k) => k + 1);
    }, []);

    return (
        <div className="app-container">
            <header className="app-header">
                <div className="logo">
                    <h1>QuickExchange</h1>
                </div>
                <p className="tagline">Instant file sharing on your local network</p>
            </header>

            <div className="top-controls">
                <ShutdownButton />
            </div>

            <IPBanner />

            <main className="app-main">
                <UploadZone onUploadComplete={triggerRefresh} />
                <TextInput onTextSaved={triggerRefresh} />

                <div className="files-section">
                    <div className="files-header">
                        <h2>Shared Items</h2>
                        <ClearAll onCleared={triggerRefresh} />
                    </div>
                    <FileList refreshKey={refreshKey} onDelete={triggerRefresh} />
                </div>
            </main>

            <footer className="app-footer">
                <p>QuickExchange &middot; Files are stored temporarily and only accessible on this network</p>
            </footer>
        </div>
    );
}

