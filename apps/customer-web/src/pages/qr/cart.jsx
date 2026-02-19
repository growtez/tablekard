import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const QRCartPage = () => {
    const { restaurantSlug } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [cart, setCart] = useState([]);
    const [restaurant, setRestaurant] = useState({ name: '' });
    const [tableNumber, setTableNumber] = useState('');

    useEffect(() => {
        // Get cart from sessionStorage
        const savedCart = sessionStorage.getItem('qr_cart');
        const savedRestaurant = sessionStorage.getItem('qr_restaurant');
        const savedTable = sessionStorage.getItem('qr_table');

        if (savedCart) setCart(JSON.parse(savedCart));
        if (savedRestaurant) setRestaurant(JSON.parse(savedRestaurant));
        if (savedTable) setTableNumber(savedTable);
    }, []);

    const updateQuantity = (itemId, delta) => {
        setCart(prev => {
            const updated = prev
                .map(item =>
                    item.id === itemId
                        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
                        : item
                )
                .filter(item => item.quantity > 0);

            // Save to sessionStorage
            sessionStorage.setItem('qr_cart', JSON.stringify(updated));
            return updated;
        });
    };

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxes = Math.round(subtotal * 0.05);
    const total = subtotal + taxes;

    const handlePlaceOrder = () => {
        if (!isAuthenticated) {
            const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
            navigate(`/login?redirect=${currentPath}`);
            return;
        }

        // Clear cart after order
        sessionStorage.removeItem('qr_cart');
        navigate(`/r/${restaurantSlug}/order-success`);
    };


    const goBack = () => {
        navigate(`/r/${restaurantSlug}${tableNumber ? `/table/${tableNumber}` : ''}`);
    };

    return (
        <div className="menu-container" style={{ background: '#1a1a2e', minHeight: '100vh' }}>
            {/* Header */}
            <header style={{
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <button
                    onClick={goBack}
                    style={{
                        background: 'rgba(217, 181, 80, 0.2)',
                        border: 'none',
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                >
                    <ArrowLeft size={20} color="#d9b550" />
                </button>
                <div>
                    <h1 style={{ fontSize: '20px', color: '#fff', margin: 0 }}>Your Order</h1>
                    {tableNumber && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            color: '#d9b550',
                            marginTop: '2px'
                        }}>
                            <MapPin size={12} />
                            Table {tableNumber}
                        </div>
                    )}
                </div>
            </header>

            {/* Cart Items */}
            <div style={{ padding: '20px', paddingBottom: cart.length > 0 ? '200px' : '20px' }}>
                {cart.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: 'rgba(255,255,255,0.6)'
                    }}>
                        <p style={{ marginBottom: '20px' }}>Your cart is empty</p>
                        <button
                            onClick={goBack}
                            style={{
                                background: '#d9b550',
                                color: '#1a1a2e',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Browse Menu
                        </button>
                    </div>
                ) : (
                    cart.map(item => (
                        <div key={item.id} style={{
                            display: 'flex',
                            gap: '16px',
                            padding: '16px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            marginBottom: '12px'
                        }}>
                            <img
                                src={item.image}
                                alt={item.name}
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '10px',
                                    objectFit: 'cover'
                                }}
                            />
                            <div style={{ flex: 1 }}>
                                <h3 style={{
                                    fontSize: '16px',
                                    color: '#fff',
                                    margin: '0 0 4px 0'
                                }}>
                                    {item.name}
                                </h3>
                                <p style={{
                                    fontSize: '12px',
                                    color: 'rgba(255,255,255,0.5)',
                                    margin: '0 0 8px 0'
                                }}>
                                    ₹{item.price} each
                                </p>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <p style={{
                                        fontSize: '16px',
                                        color: '#d9b550',
                                        fontWeight: 600,
                                        margin: 0
                                    }}>
                                        ₹{item.price * item.quantity}
                                    </p>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        background: '#d9b550',
                                        borderRadius: '8px',
                                        padding: '4px'
                                    }}>
                                        <button
                                            onClick={() => updateQuantity(item.id, -1)}
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: 'rgba(0,0,0,0.2)',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {item.quantity === 1 ?
                                                <Trash2 size={14} color="#1a1a2e" /> :
                                                <Minus size={14} color="#1a1a2e" />
                                            }
                                        </button>
                                        <span style={{
                                            color: '#1a1a2e',
                                            fontWeight: 600,
                                            minWidth: '20px',
                                            textAlign: 'center'
                                        }}>
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.id, 1)}
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: 'rgba(0,0,0,0.2)',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Plus size={14} color="#1a1a2e" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Bill Summary & Place Order */}
            {cart.length > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: '#1a1a2e',
                    padding: '20px',
                    borderTop: '1px solid rgba(255,255,255,0.1)'
                }}>
                    {/* Bill Summary */}
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '16px'
                    }}>
                        <h3 style={{
                            fontSize: '14px',
                            color: '#fff',
                            marginBottom: '12px',
                            fontWeight: 600
                        }}>
                            Bill Summary
                        </h3>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: '14px',
                            marginBottom: '8px'
                        }}>
                            <span>Subtotal</span>
                            <span>₹{subtotal}</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: '14px',
                            marginBottom: '12px'
                        }}>
                            <span>GST (5%)</span>
                            <span>₹{taxes}</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: '#fff',
                            fontSize: '18px',
                            fontWeight: 700,
                            paddingTop: '12px',
                            borderTop: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <span>Total</span>
                            <span>₹{total}</span>
                        </div>
                    </div>

                    {/* Place Order Button */}
                    <button
                        onClick={handlePlaceOrder}
                        style={{
                            width: '100%',
                            background: '#d9b550',
                            color: '#1a1a2e',
                            border: 'none',
                            padding: '16px',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        Place Order • ₹{total}
                    </button>
                </div>
            )}
        </div>
    );
};

export default QRCartPage;
