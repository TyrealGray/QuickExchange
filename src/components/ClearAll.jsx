import { useState } from 'react';

export default function ClearAll({ onCleared }) {
    const [confirming, setConfirming] = useState(false);
    const [clearing, setClearing] = useState(false);

    const handleClear = async () => {
        if (!confirming) {
            setConfirming(true);
            return;
        }

        setClearing(true);
        try {
            await fetch('/api/files', { method: 'DELETE' });
            onCleared?.();
        } catch (err) {
            console.error('Clear failed:', err);
        } finally {
            setClearing(false);
            setConfirming(false);
        }
    };

    const handleCancel = (e) => {
        e.stopPropagation();
        setConfirming(false);
    };

    return (
        <div className="clear-all-wrapper">
            {confirming && (
                <button className="btn btn-cancel" onClick={handleCancel}>
                    Cancel
                </button>
            )}
            <button
                className={`btn btn-danger ${confirming ? 'confirming' : ''}`}
                onClick={handleClear}
                disabled={clearing}
            >
                {clearing ? 'Clearing…' : confirming ? 'Confirm Delete All?' : '🗑️ Clear All'}
            </button>
        </div>
    );
}
