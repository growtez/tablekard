import React from 'react';
import { QrCode, Smartphone, ArrowRight, MapPin } from 'lucide-react';
import './scan_qr.css';

const ScanQRPage = () => {
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

                <div className="steps-container">
                    <div className="step-item">
                        <div className="step-number">1</div>
                        <div className="step-text">Open your camera</div>
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
        </div>
    );
};

export default ScanQRPage;
