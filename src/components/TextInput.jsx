import { useState } from 'react';

export default function TextInput({ onTextSaved }) {
    const [text, setText] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed || saving) return;

        setSaving(true);
        try {
            const res = await fetch('/api/text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            if (!res.ok) throw new Error('Failed to save text');

            setText('');
            onTextSaved?.();
        } catch (err) {
            console.error('Save text failed:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="text-input" onSubmit={handleSubmit}>
            <div className="text-input-header">
                <h3>Share Text</h3>
                <button className="btn" type="submit" disabled={saving || !text.trim()}>
                    {saving ? 'Saving...' : 'Add Text'}
                </button>
            </div>
            <textarea
                className="text-input-field"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste text here, then click Add Text"
                rows={5}
                maxLength={50000}
            />
            <p className="text-input-hint">Added text appears in the shared list and can be copied or deleted.</p>
        </form>
    );
}

