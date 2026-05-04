import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, View } from 'lucide-react';
import './ar_viewer.css';

const ARViewerPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const viewerRef = useRef(null);

    const handleARActivation = () => {
        if (viewerRef.current) {
            viewerRef.current.activateAR();
        }
    };

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
                src="/assets/model.glb" 
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
