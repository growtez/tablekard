import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { Download, RefreshCw, QrCode, Table2, CheckCircle, AlertCircle } from 'lucide-react';
import Sidebar from '../components/sidebar';
import { useAuth } from '../context/AuthContext';
import { useRestaurantTables } from '../hooks/useSupabaseQuery';
import { paintQrTemplate } from '../utils/qrTemplatePainter';
import './qrcode.css';

// The base URL of the customer web app (e.g., http://192.168.1.16:3003)
const CUSTOMER_APP_URL = (import.meta.env.VITE_CUSTOMER_APP_URL || 'https://tablekard.com').replace(/\/$/, '');

const QRCodePage: React.FC = () => {
    const { activeRestaurantId, activeRestaurantName } = useAuth();
    const [qrSize, setQrSize] = useState(200);

    // React Query: cached, auto-retries, refetches on tab focus
    const { data: tables = [], isLoading: loading, error: queryError, refetch } = useRestaurantTables(activeRestaurantId);
    const error = queryError ? 'Failed to load tables. Please try again.' : null;

    const buildQrUrl = (_tableId: string, tableNumber: number) =>
        `${CUSTOMER_APP_URL}/order/${activeRestaurantId}/${tableNumber}`;

    const downloadQR = async (tableId: string, tableNumber: number) => {
        try {
            const canvas = await paintQrTemplate({
                qrSvgElementId: `qr-svg-${tableId}`,
                restaurantName: activeRestaurantName,
                tableNumber,
                qrSize
            });

            const link = document.createElement('a');
            link.download = `${activeRestaurantName.replace(/\s+/g, '-')}-table-${tableNumber}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
        } catch (err) {
            console.error('Failed to generate QR:', err);
            alert('Failed to generate QR image');
        }
    };

    const downloadPDF = async (tableId: string, tableNumber: number) => {
        try {
            const canvas = await paintQrTemplate({
                qrSvgElementId: `qr-svg-${tableId}`,
                restaurantName: activeRestaurantName,
                tableNumber,
                qrSize: 300 // High resolution for PDF
            });

            const imgData = canvas.toDataURL('image/png', 1.0);
            
            // Dimensions from qrTemplatePainter (W: 420, H: 540)
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [420, 540]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, 420, 540);
            pdf.save(`${activeRestaurantName.replace(/\s+/g, '-')}-table-${tableNumber}.pdf`);
        } catch (err) {
            console.error('Failed to generate PDF:', err);
            alert('Failed to generate PDF');
        }
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
                        <button className="qr-refresh-btn" onClick={() => refetch()} disabled={loading}>
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
                        <button className="qr-refresh-btn" onClick={() => refetch()}>Try Again</button>
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
                                        <div className="qr-card-meta">
                                            <span className="qr-capacity">👥 Capacity: {table.capacity}</span>
                                        </div>
                                        <div className="qr-action-buttons">
                                            <button
                                                className="qr-download-btn secondary"
                                                onClick={() => downloadQR(table.id, table.table_number)}
                                                title="Download as PNG Image"
                                            >
                                                <Download size={14} />
                                                PNG
                                            </button>
                                            <button
                                                className="qr-download-btn primary"
                                                onClick={() => downloadPDF(table.id, table.table_number)}
                                                title="Generate PDF for Printing"
                                            >
                                                <Download size={14} />
                                                PDF
                                            </button>
                                        </div>
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
