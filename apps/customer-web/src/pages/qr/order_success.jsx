import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, ArrowLeft } from 'lucide-react';

const QROrderSuccessPage = () => {
    const { restaurantSlug } = useParams();
    const navigate = useNavigate();
    const [tableNumber, setTableNumber] = useState('');

    useEffect(() => {
        const savedTable = sessionStorage.getItem('qr_table');
        if (savedTable) setTableNumber(savedTable);
    }, []);

    // Generate random order number
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

    const goBack = () => {
        navigate(`/r/${restaurantSlug}${tableNumber ? `/table/${tableNumber}` : ''}`);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#1a1a2e',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            textAlign: 'center'
        }}>
            {/* Success Icon */}
            <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                animation: 'pulse 2s infinite'
            }}>
                <CheckCircle size={56} color="#22c55e" />
            </div>

            <h1 style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '8px'
            }}>
                Order Placed!
            </h1>

            <p style={{
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '32px',
                fontSize: '16px'
            }}>
                Your order has been sent to the kitchen
            </p>

            {/* Order Number */}
            <div style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '20px 40px',
                borderRadius: '16px',
                marginBottom: '32px'
            }}>
                <p style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    Order Number
                </p>
                <p style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#d9b550'
                }}>
                    {orderNumber}
                </p>
            </div>

            {/* Table Info */}
            {tableNumber && (
                <div style={{
                    background: 'rgba(217, 181, 80, 0.1)',
                    border: '1px solid rgba(217, 181, 80, 0.3)',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    marginBottom: '32px'
                }}>
                    <p style={{ color: '#d9b550', fontSize: '14px' }}>
                        🍽️ Your food will be served at Table {tableNumber}
                    </p>
                </div>
            )}

            {/* Estimated Time */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '48px'
            }}>
                <Clock size={20} />
                <span>Estimated preparation time: 15-20 mins</span>
            </div>

            {/* Back to Menu Button */}
            <button
                onClick={goBack}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#d9b550',
                    color: '#1a1a2e',
                    border: 'none',
                    padding: '16px 32px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer'
                }}
            >
                <ArrowLeft size={20} />
                Order More
            </button>

            {/* Powered by */}
            <p style={{
                marginTop: '48px',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.3)'
            }}>
                Powered by <span style={{ color: '#d9b550' }}>Restaurant SaaS</span>
            </p>

            <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
        </div>
    );
};

export default QROrderSuccessPage;
