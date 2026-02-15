import { useState } from 'react';

export default function ShutdownButton() {
    const [confirming, setConfirming] = useState(false);
    const [shuttingDown, setShuttingDown] = useState(false);
    const [done, setDone] = useState(false);

    const handleShutdown = async () => {
        if (!confirming) {
            setConfirming(true);
            return;
        }

        setShuttingDown(true);
        try {
            await fetch('/api/shutdown', { method: 'POST' });
            setDone(true);
        } catch {
            // Connection will drop since the server is stopping — that's expected
            setDone(true);
        }
    };

    const handleCancel = (e) => {
        e.stopPropagation();
        setConfirming(false);
    };

    if (done) {
        return (
            <div className="shutdown-section">
                <p className="shutdown-done">🛑 Server has been shut down</p>
            </div>
        );
    }

    return (
        <div className="shutdown-section">
            <span className="shutdown-label">Server Controls</span>
            <div className="shutdown-actions">
                {confirming && (
                    <button className="btn btn-cancel" onClick={handleCancel}>
                        Cancel
                    </button>
                )}
                <button
                    className={`btn btn-danger ${confirming ? 'confirming' : ''}`}
                    onClick={handleShutdown}
                    disabled={shuttingDown}
                >
                    {shuttingDown
                        ? 'Shutting down…'
                        : confirming
                            ? 'Confirm Shutdown?'
                            : '⏻ Shutdown Server'}
                </button>
            </div>
        </div>
    );
}
