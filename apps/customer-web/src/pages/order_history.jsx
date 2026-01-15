import React, { useState } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './order_history.css';

const OrderHistoryPage = () => {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState('all');

    const orders = [
        {
            id: '#ORD-9901',
            date: '10 Jan / 02:30 PM',
            items: ['Margherita Pizza', 'Caesar Salad'],
            total: 3568,
            status: 'completed'
        },
        {
            id: '#ORD-9844',
            date: '08 Jan / 12:15 PM',
            items: ['Grilled Salmon', 'Orange Juice'],
            total: 728,
            status: 'completed'
        },
        {
            id: '#ORD-9801',
            date: '05 Jan / 07:45 PM',
            items: ['Chef Special Omakase'],
            total: 4500,
            status: 'completed'
        },
        {
            id: '#ORD-9755',
            date: '02 Jan / 01:00 PM',
            items: ['Vegan Burger', 'Lava Cake'],
            total: 856,
            status: 'cancelled'
        },
        {
            id: '#ORD-9722',
            date: '28 Dec / 08:30 PM',
            items: ['Tikka Masala', 'Naan'],
            total: 1456,
            status: 'completed'
        },
    ];

    const filters = [
        { id: 'all', label: 'All History' },
        { id: 'completed', label: 'Completed' },
        { id: 'cancelled', label: 'Cancelled' }
    ];

    const filteredOrders = activeFilter === 'all'
        ? orders
        : orders.filter(o => o.status === activeFilter);

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
                <span className="bubble-value">₹11,098</span>

                <div className="bubble-grid">
                    <div className="bubble-stat">
                        <span className="bubble-stat-val">24</span>
                        <span className="bubble-stat-label">Visits</span>
                    </div>
                    <div className="bubble-stat">
                        <span className="bubble-stat-val">12</span>
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
                {filteredOrders.length === 0 ? (
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
                                    {order.status}
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
                                <button className="action-btn">
                                    <RotateCcw size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default OrderHistoryPage;
