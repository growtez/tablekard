import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, RefreshCw, QrCode, Table2, CheckCircle, AlertCircle } from 'lucide-react';
import Sidebar from '../components/sidebar';
import { useAuth } from '../context/AuthContext';
import { getRestaurantTables } from '../services/supabaseService';
import type { RestaurantTable } from '../services/supabaseService';
import './qrcode.css';

const BASE_URL = 'https://tablekard.com/menu';

const QRCodePage: React.FC = () => {
    const { activeRestaurantId } = useAuth();
    const [tables, setTables] = useState<RestaurantTable[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [qrSize, setQrSize] = useState(160);

    useEffect(() => {
        if (activeRestaurantId) {
            fetchTables();
        }
    }, [activeRestaurantId]);

    const fetchTables = async () => {
        if (!activeRestaurantId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getRestaurantTables(activeRestaurantId);
            setTables(data);
        } catch (err: any) {
            console.error('Failed to fetch tables:', err);
            setError('Failed to load tables. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const buildQrUrl = (_tableId: string, tableNumber: number) =>
        `${BASE_URL}?restaurant_id=${activeRestaurantId}&table_id=${tableNumber}`;

    const downloadQR = (tableId: string, tableNumber: number) => {
        const svgEl = document.getElementById(`qr-svg-${tableId}`) as SVGElement | null;
        if (!svgEl) return;

        const svgData = new XMLSerializer().serializeToString(svgEl);
        const canvas = document.createElement('canvas');
        const size = qrSize + 40;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const img = new Image();
        img.onload = () => {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, size, size);
            ctx.drawImage(img, 20, 20, qrSize, qrSize);
            const link = document.createElement('a');
            link.download = `table-${tableNumber}-qr.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    const downloadAll = () => {
        tables.forEach((t, i) => {
            setTimeout(() => downloadQR(t.id, t.table_number), i * 300);
        });
    };

    return (
        <div className="qr-container">
            <Sidebar />

            <div className="qr-main-content">
                {/* Header */}
                <div className="qr-header">
                    <div>
                        <h1 className="qr-page-title">QR Code Generator</h1>
                        <p className="qr-page-subtitle">
                            Generate QR codes for your tables. Customers scan to open the menu.
                        </p>
                    </div>
                    <div className="qr-header-actions">
                        <button className="qr-refresh-btn" onClick={fetchTables} disabled={loading}>
                            <RefreshCw size={16} className={loading ? 'spin' : ''} />
                            Refresh
                        </button>
                        {tables.length > 0 && (
                            <button className="qr-download-all-btn" onClick={downloadAll}>
                                <Download size={16} />
                                Download All
                            </button>
                        )}
                    </div>
                </div>

                {/* Size Control */}
                <div className="qr-controls">
                    <div className="qr-size-control">
                        <label className="qr-size-label">QR Size: {qrSize}px</label>
                        <input
                            type="range"
                            min={100}
                            max={250}
                            step={10}
                            value={qrSize}
                            onChange={(e) => setQrSize(parseInt(e.target.value))}
                            className="qr-size-slider"
                        />
                    </div>
                    <div className="qr-count-badge">
                        <Table2 size={16} />
                        {loading ? '...' : `${tables.length} Tables`}
                    </div>
                </div>

                {/* States */}
                {loading && (
                    <div className="qr-state-center">
                        <div className="qr-spinner"></div>
                        <p>Loading tables...</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="qr-error-state">
                        <AlertCircle size={40} color="#E53E3E" />
                        <p>{error}</p>
                        <button className="qr-refresh-btn" onClick={fetchTables}>Try Again</button>
                    </div>
                )}

                {!loading && !error && tables.length === 0 && (
                    <div className="qr-state-center">
                        <QrCode size={64} color="#CBD5E0" />
                        <p className="qr-empty-title">No tables found</p>
                        <p className="qr-empty-sub">Add tables to your restaurant to generate QR codes.</p>
                    </div>
                )}

                {/* QR Grid */}
                {!loading && !error && tables.length > 0 && (
                    <div className="qr-grid">
                        {tables.map((table) => {
                            const url = buildQrUrl(table.id, table.table_number);
                            return (
                                <div key={table.id} className={`qr-card ${!table.active ? 'qr-card-inactive' : ''}`}>
                                    <div className="qr-card-header">
                                        <span className="qr-table-label">Table {table.table_number}</span>
                                        <span className={`qr-status-badge ${table.active ? 'active' : 'inactive'}`}>
                                            {table.active ? (
                                                <><CheckCircle size={12} /> Active</>
                                            ) : (
                                                <><AlertCircle size={12} /> Inactive</>
                                            )}
                                        </span>
                                    </div>

                                    <div className="qr-code-wrapper">
                                        <QRCodeSVG
                                            id={`qr-svg-${table.id}`}
                                            value={url}
                                            size={qrSize}
                                            bgColor="#ffffff"
                                            fgColor="#1A202C"
                                            level="H"
                                            includeMargin
                                        />
                                    </div>

                                    <div className="qr-card-footer">
                                        <p className="qr-url-text" title={url}>{url}</p>
                                        <div className="qr-card-meta">
                                            <span className="qr-capacity">👥 Capacity: {table.capacity}</span>
                                        </div>
                                        <button
                                            className="qr-download-btn"
                                            onClick={() => downloadQR(table.id, table.table_number)}
                                        >
                                            <Download size={14} />
                                            Download QR
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRCodePage;
