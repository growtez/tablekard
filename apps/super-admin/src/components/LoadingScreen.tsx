import React from 'react';

const LoadingScreen: React.FC = () => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100vw',
            background: '#0f0c29',
            color: '#fff',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <div className="animate-spin" style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(255,255,255,0.1)',
                borderTopColor: '#6366f1',
                borderRadius: '50%',
                marginBottom: '1rem'
            }}></div>
            <p style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                letterSpacing: '0.025em',
                opacity: 0.8
            }}>
                Loading Super Admin...
            </p>

            {/* Simple inline animation for the spinner since we are making things better */}
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default LoadingScreen;
