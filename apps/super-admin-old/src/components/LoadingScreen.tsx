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
            background: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-family)'
        }}>
            <div className="custom-spinner" style={{
                width: '40px',
                height: '40px',
                border: '3px solid var(--color-border)',
                borderTopColor: 'var(--color-accent-primary)',
                borderRadius: '50%',
                marginBottom: 'var(--spacing-md)'
            }}></div>
            <p style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
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
                .custom-spinner {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default LoadingScreen;
