import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOrderHistory } from '../services/supabaseService';
import './order_history.css';

const OrderHistoryPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [activeFilter, setActiveFilter] = useState('all');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!isAuthenticated || !user) {
                setLoading(false);
                return;
            }
            try {
                const history = await getOrderHistory(user.id);
                // Map database statuses to UI classes
                const mappedOrders = history.map(order => ({
                    id: `#${order.order_number || order.id.substring(0, 8).toUpperCase()}`,
                    date: new Date(order.created_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    }),
                    items: order.order_items.map(item => item.name),
                    total: order.total,
                    status: order.status === 'SERVED' ? 'completed' : order.status === 'CANCELLED' ? 'cancelled' : 'pending',
                    realStatus: order.status
                }));
                setOrders(mappedOrders);
            } catch (err) {
                console.error('Failed to fetch order history:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user, isAuthenticated]);

    const filters = [
        { id: 'all', label: 'All History' },
        { id: 'completed', label: 'Completed' },
        { id: 'cancelled', label: 'Cancelled' }
    ];

    const filteredOrders = activeFilter === 'all'
        ? orders
        : orders.filter(o => o.status === activeFilter);

    // Calculate sum of completed orders
    const totalSpent = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.total, 0);

    const completedCount = orders.filter(o => o.status === 'completed').length;

    if (!isAuthenticated) {
        return (
            <div className="order-history-page-container">
                <header className="order-history-page-header">
                    <button className="order-history-page-back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={22} />
                    </button>
                    <h1>Order History</h1>
                    <div style={{ width: 44 }}></div>
                </header>
                <div className="history-empty">
                    <div className="empty-art">🔐</div>
                    <h3>Login Required</h3>
                    <p>Please log in to see your order history.</p>
                    <button className="filter-pill active" style={{ marginTop: 20 }} onClick={() => navigate('/login')}>Login Now</button>
                </div>
            </div>
        );
    }

    return (
        <div className="order-history-page-container">
            {/* Header */}
            <header className="order-history-page-header">
                <button className="order-history-page-back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={22} />
                </button>
                <h1>Order History</h1>
                <div style={{ width: 44 }}></div>
            </header>

            {/* Stats Bubble */}
            <div className="order-history-stats-bubble">
                <span className="bubble-label">Dining Summary</span>
                <span className="bubble-value">₹{totalSpent.toLocaleString()}</span>

                <div className="bubble-grid">
                    <div className="bubble-stat">
                        <span className="bubble-stat-val">{completedCount}</span>
                        <span className="bubble-stat-label">Visits</span>
                    </div>
                    <div className="bubble-stat">
                        <span className="bubble-stat-val">⭐</span>
                        <span className="bubble-stat-label">Favourite</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="order-history-filters">
                {filters.map(filter => (
                    <button
                        key={filter.id}
                        className={`filter-pill ${activeFilter === filter.id ? 'active' : ''}`}
                        onClick={() => setActiveFilter(filter.id)}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="order-history-list">
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                        <Loader2 className="animate-spin" size={32} color="#8B3A1E" />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="history-empty">
                        <div className="empty-art">🍽️</div>
                        <h3>Empty Plate</h3>
                        <p>No orders found for this selection.</p>
                    </div>
                ) : (
                    filteredOrders.map(order => (
                        <div key={order.id} className={`history-card ${order.status}`}>
                            <div className="card-header">
                                <div className="order-ref">
                                    <span className="order-id">{order.id}</span>
                                    <span className="order-timestamp">{order.date}</span>
                                </div>
                                <span className={`status-badge ${order.status}`}>
                                    {order.status === 'pending' ? order.realStatus : order.status}
                                </span>
                            </div>

                            <div className="items-preview">
                                {order.items.map((item, idx) => (
                                    <span key={idx} className="item-chip">{item}</span>
                                ))}
                            </div>

                            <div className="card-footer">
                                <div className="price-block">
                                    <span className="price-label">Transaction</span>
                                    <span className="price-amount">₹{order.total.toLocaleString()}</span>
                                </div>
                                <button className="action-btn" onClick={() => navigate('/menu')}>
                                    <RotateCcw size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <style>{`
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default OrderHistoryPage;
