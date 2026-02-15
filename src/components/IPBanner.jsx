import { useState, useEffect } from 'react';

export default function IPBanner() {
    const [addresses, setAddresses] = useState([]);
    const [port, setPort] = useState(null);
    const [copied, setCopied] = useState(null);

    useEffect(() => {
        fetch('/api/ip')
            .then((r) => r.json())
            .then((data) => {
                setAddresses(data.addresses || []);
                setPort(data.port);
            })
            .catch(() => { });
    }, []);

    const copyToClipboard = (url, idx) => {
        navigator.clipboard.writeText(url).then(() => {
            setCopied(idx);
            setTimeout(() => setCopied(null), 2000);
        });
    };

    if (addresses.length === 0) return null;

    return (
        <div className="ip-banner">
            <div className="ip-banner-icon">📡</div>
            <div className="ip-banner-content">
                <span className="ip-banner-label">Connect from other devices:</span>
                <div className="ip-list">
                    {addresses.map((a, i) => {
                        const url = `http://${a.address}:${port}`;
                        return (
                            <button
                                key={i}
                                className={`ip-chip ${copied === i ? 'copied' : ''}`}
                                onClick={() => copyToClipboard(url, i)}
                                title="Click to copy"
                            >
                                <span className="ip-url">{url}</span>
                                <span className="ip-copy-icon">{copied === i ? '✓' : '📋'}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
