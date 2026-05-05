import React, { useState } from 'react';
import { QrCode, MapPin, X, Camera } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import './scan_qr.css';

const ScanQRPage = () => {
    const [showScanner, setShowScanner] = useState(false);

    const handleScan = (result) => {
        if (result?.[0]?.rawValue) {
            const scannedValue = result[0].rawValue;
            console.log('Scanned Value:', scannedValue);

            let targetPath = '';

            // Handle full URLs
            if (scannedValue.startsWith('http')) {
                try {
                    const url = new URL(scannedValue);
                    targetPath = url.pathname + url.search;
                } catch (e) {
                    console.error('URL Parsing Error:', e);
                }
            }
            // Handle relative paths or URLs without protocol
            else {
                targetPath = scannedValue.startsWith('/') ? scannedValue : '/' + scannedValue;
            }

            // Match /order/:restaurantId/:tableId pattern
            const orderMatch = targetPath.match(/^\/order\/([^/?#]+)\/([^/?#]+)/);

            if (orderMatch) {
                const restaurantId = orderMatch[1];
                const tableId = orderMatch[2];

                // ✅ Pre-seed sessionStorage so RestaurantContext initializes
                // correctly on the next render — without this, RequireRestaurant
                // still sees restaurantId=null and re-renders ScanQRPage instead
                // of MenuPage after navigate().
                sessionStorage.setItem('tablekard_restaurant_id', restaurantId);
                sessionStorage.setItem('tablekard_table_id', tableId);

                setShowScanner(false);

                // Use a full page navigation so RestaurantContext re-mounts fresh
                // with the IDs already in sessionStorage + the matched URL params.
                setTimeout(() => {
                    window.location.href = targetPath;
                }, 150);
            } else {
                console.warn('Scanned value does not contain a valid order path:', targetPath);
            }
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

