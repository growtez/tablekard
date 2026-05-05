import React, { useState } from 'react';
import { QrCode, MapPin, X, Camera } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import './scan_qr.css';

const ScanQRPage = () => {
    const [showScanner, setShowScanner] = useState(false);

    // Extract the raw string from whatever shape the scanner library returns
    const extractRawValue = (result) => {
        if (!result) return null;
        if (Array.isArray(result) && result[0]?.rawValue) return result[0].rawValue;
        if (Array.isArray(result) && result[0]?.text)     return result[0].text;
        if (typeof result === 'string')                    return result;
        if (result?.rawValue)                              return result.rawValue;
        if (result?.text)                                  return result.text;
        return null;
    };

    const handleScan = (result) => {
        const scannedValue = extractRawValue(result);
        if (!scannedValue) return;

        console.log('[QR] scanned:', scannedValue);

        let targetPath = '';
        let restaurantId = null;
        let tableId = null;

        if (scannedValue.startsWith('http')) {
            try {
                const url = new URL(scannedValue);
                targetPath = url.pathname + url.search;

                // ── Format 1: query-string params (?restaurant_id=&table_id=) ──
                const rId = url.searchParams.get('restaurant_id');
                const tId = url.searchParams.get('table_id');
                if (rId && tId) {
                    restaurantId = rId;
                    tableId      = tId;
                }
            } catch (e) {
                console.error('[QR] URL parse error:', e);
                return;
            }
        } else {
            targetPath = scannedValue.startsWith('/') ? scannedValue : '/' + scannedValue;
        }

        // ── Format 2: /order/:restaurantId/:tableId path ──
        if (!restaurantId) {
            const orderMatch = targetPath.match(/^\/order\/([^/?#]+)\/([^/?#]+)/);
            if (orderMatch) {
                restaurantId = orderMatch[1];
                tableId      = orderMatch[2];
            }
        }

        // ── Format 3: query-string in relative path ──
        if (!restaurantId && targetPath.includes('restaurant_id')) {
            const qs = new URLSearchParams(targetPath.split('?')[1] || '');
            restaurantId = qs.get('restaurant_id');
            tableId      = qs.get('table_id');
        }

        if (restaurantId && tableId) {
            // Pre-seed sessionStorage so RestaurantContext initialises correctly
            sessionStorage.setItem('tablekard_restaurant_id', restaurantId);
            sessionStorage.setItem('tablekard_table_id', tableId);

            setShowScanner(false);

            // Full-page navigation so RestaurantContext re-mounts fresh
            setTimeout(() => {
                window.location.href = targetPath;
            }, 150);
        } else {
            console.warn('[QR] Could not extract restaurant/table IDs from:', scannedValue);
        }
    };

    return (
        <div className="scan-qr-container">
            <div className="scan-qr-content">
                <div className="icon-showcase">
                    <div className="glow-circle"></div>
                    <div className="main-icon-wrapper">
                        <QrCode size={60} className="qr-icon" />
                        <div className="scanner-line"></div>
                    </div>
                </div>

                <div className="text-content">
                    <h1>Ready to <span className="highlight">Order?</span></h1>
                    <p>Please scan the QR code at your table to view the menu and start your experience.</p>
                </div>

                <div className="main-action">
                    <button className="scan-now-btn" onClick={() => setShowScanner(true)}>
                        <Camera size={20} />
                        <span>Open QR Scanner</span>
                    </button>
                </div>

                <div className="steps-container">
                    <div className="step-item">
                        <div className="step-number">1</div>
                        <div className="step-text">Click on QR scanner</div>
                    </div>
                    <div className="step-item">
                        <div className="step-number">2</div>
                        <div className="step-text">Focus on the table QR</div>
                    </div>
                    <div className="step-item">
                        <div className="step-number">3</div>
                        <div className="step-text">Enjoy your meal!</div>
                    </div>
                </div>

                <div className="footer-info">
                    <MapPin size={16} />
                    <span>Tablekard Smart Dining</span>
                </div>
            </div>

            {/* Scanner Overlay */}
            {showScanner && (
                <div className="scanner-overlay-modal">
                    <div className="scanner-modal-content">
                        <button className="close-scanner" onClick={() => setShowScanner(false)}>
                            <X size={24} />
                        </button>
                        <div className="scanner-frame">
                            <Scanner
                                onScan={handleScan}
                                onError={(err) => console.error(err)}
                                components={{
                                    audio: false,
                                    torch: true,
                                }}
                                styles={{
                                    container: {
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '24px',
                                        overflow: 'hidden'
                                    }
                                }}
                            />
                            <div className="scan-target-box">
                                <div className="corner top-left"></div>
                                <div className="corner top-right"></div>
                                <div className="corner bottom-left"></div>
                                <div className="corner bottom-right"></div>
                            </div>
                        </div>
                        <p className="scanner-hint">Align QR code within the frame</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScanQRPage;

