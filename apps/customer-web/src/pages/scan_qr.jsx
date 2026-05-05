import React, { useState } from 'react';
import { QrCode, Smartphone, ArrowRight, MapPin, X, Camera } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useNavigate } from 'react-router-dom';
import './scan_qr.css';

const ScanQRPage = () => {
    const [showScanner, setShowScanner] = useState(false);
    const [scanError, setScanError] = useState('');
    const navigate = useNavigate();

    const handleScan = (result) => {
        // Handle both array-based results (v2+) and potential single-string results
        const rawValue = Array.isArray(result) ? result[0]?.rawValue : result?.rawValue || result;
        
        if (!rawValue || typeof rawValue !== 'string') return;

        console.log('Scanned Value Detected:', rawValue);

        let targetPath = '';

        try {
            // Case 1: Handle full URLs (e.g., https://tablekard.com/order/rest/table)
            if (rawValue.toLowerCase().startsWith('http')) {
                const url = new URL(rawValue);
                targetPath = url.pathname + url.search;
            } 
            // Case 2: Handle domain-only URLs (e.g., tablekard.com/order/rest/table)
            else if (rawValue.toLowerCase().includes('tablekard.com') || rawValue.toLowerCase().includes('vercel.app')) {
                // Prepend protocol to help URL parser
                const url = new URL('https://' + rawValue);
                targetPath = url.pathname + url.search;
            }
            // Case 3: Handle relative paths or just table IDs
            else {
                targetPath = rawValue.startsWith('/') ? rawValue : '/' + rawValue;
            }

            console.log('Parsed Target Path:', targetPath);

            // Validation: Ensure we are navigating to a valid order route
            // We look for /order/ case-insensitively
            const lowerPath = targetPath.toLowerCase();
            const orderIndex = lowerPath.indexOf('/order/');

            if (orderIndex !== -1) {
                // Extract everything from /order/ onwards
                const cleanPath = targetPath.substring(orderIndex);
                
                setScanError('');
                setShowScanner(false);
                // Subtle feedback before navigation
                setTimeout(() => {
                    navigate(cleanPath);
                }, 150);
            } else {
                console.warn('Scanned QR does not contain a valid /order/ path:', targetPath);
                setScanError('Invalid QR code. Please scan a Tablekard QR code.');
            }
        } catch (err) {
            console.error('Error processing scanned QR:', err);
        }
    };

    const toggleScanner = (show) => {
        setScanError('');
        setShowScanner(show);
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
                    <button className="scan-now-btn" onClick={() => toggleScanner(true)}>
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
                        <button className="close-scanner" onClick={() => toggleScanner(false)}>
                            <X size={24} />
                        </button>
                        <div className="scanner-frame">
                            <Scanner
                                onScan={handleScan}
                                onError={(err) => {
                                    console.error(err);
                                    setScanError('Camera error. Please ensure permissions are granted.');
                                }}
                                components={{
                                    audio: true,
                                    torch: true,
                                }}
                                allowMultiple={false}
                                scanDelay={2000}
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
                        {scanError && <p className="scanner-error-msg">{scanError}</p>}
                        <p className="scanner-hint">Align QR code within the frame</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScanQRPage;

