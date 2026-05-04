import React, { useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, View } from 'lucide-react';
import './ar_viewer.css';

const ARViewerPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const viewerRef = useRef(null);

    // Model URL passed via route state from the item detail modal
    const modelUrl = location.state?.modelUrl;

    const handleARActivation = () => {
        if (viewerRef.current) {
            viewerRef.current.activateAR();
        }
    };

    if (!modelUrl) {
        return (
            <div className="ar-viewer-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="ar-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={24} />
                    </button>
                    <h2>View in AR</h2>
                </div>
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                    <View size={48} style={{ marginBottom: '16px', color: '#ccc' }} />
                    <h3 style={{ color: '#333', marginBottom: '8px' }}>No 3D Model Available</h3>
                    <p>This item doesn't have an AR model yet.</p>
                    <button 
                        onClick={() => navigate(-1)} 
                        style={{
                            marginTop: '24px', padding: '12px 24px',
                            background: '#8B3A1E', color: 'white', border: 'none',
                            borderRadius: '12px', fontSize: '15px', fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="ar-viewer-container">
            <div className="ar-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h2>View in AR</h2>
            </div>
            
            <model-viewer 
                ref={viewerRef}
                id="viewer" 
                src={modelUrl}
                ar 
                ar-modes="webxr scene-viewer quick-look" 
                camera-controls 
                auto-rotate
                style={{ width: '100%', height: '100vh', background: '#f5f5f5' }}
            >
            </model-viewer>

            <button id="custom-ar-btn" className="custom-ar-btn" onClick={handleARActivation}>
                <View size={18} style={{ marginRight: '8px' }} />
                View on table
            </button>
        </div>
    );
};

export default ARViewerPage;
