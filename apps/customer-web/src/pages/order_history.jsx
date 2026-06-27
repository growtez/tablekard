import React, { useState, useEffect, useCallback } from 'react';
import {
    ArrowLeft,
    RotateCcw,
    ShoppingBag,
    CheckCircle2,
    XCircle,
    Clock3,
    CreditCard,
    Banknote,
    Smartphone,
    UtensilsCrossed,
    ChefHat,
    TrendingUp,
    Calendar,
    ChevronDown,
    ChevronUp,
    Loader2,
    Wifi,
    WifiOff,
    Star,
    MapPin,
    Download,
    Utensils
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getOrderHistory, getMenuItems } from '../services/supabaseService';
import { jsPDF } from 'jspdf';
import './order_history.css';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
const STATUS_MAP = {
    pending:    { label: 'Pending',    cls: 'pending',   icon: <Clock3 size={10} /> },
    confirmed:  { label: 'Confirmed',  cls: 'confirmed', icon: <Clock3 size={10} /> },
    preparing:  { label: 'Preparing', cls: 'preparing', icon: <ChefHat size={10} /> },
    ready:      { label: 'Ready',      cls: 'ready',     icon: <Clock3 size={10} /> },
    SERVED:     { label: 'Served',     cls: 'completed', icon: <CheckCircle2 size={10} /> },
    served:     { label: 'Served',     cls: 'completed', icon: <CheckCircle2 size={10} /> },
    completed:  { label: 'Completed',  cls: 'completed', icon: <CheckCircle2 size={10} /> },
    cancelled:  { label: 'Cancelled', cls: 'cancelled', icon: <XCircle size={10} /> },
    CANCELLED:  { label: 'Cancelled', cls: 'cancelled', icon: <XCircle size={10} /> },
};

const UI_STATUS = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'served' || s === 'completed') return 'completed';
    if (s === 'cancelled') return 'cancelled';
    return 'pending';
};

const PAYMENT_ICON = {
    cash:       <Banknote size={10} />,
    card:       <CreditCard size={10} />,
    upi:        <Smartphone size={10} />,
    online:     <Smartphone size={10} />,
    wallet:     <Smartphone size={10} />,
    netbanking: <CreditCard size={10} />,
};

const ORDER_TYPE_ICON = {
    dine_in: <Utensils size={10} />,
    takeaway: <ShoppingBag size={10} />,
    delivery: <ShoppingBag size={10} />, // Fallback for delivery
};

const ORDER_TYPE_LABEL = {
    dine_in: 'Dine In',
    takeaway: 'Takeaway',
    delivery: 'Delivery',
};

const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
};

const groupLabel = (iso) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
};

/* ─── Sub-components ────────────────────────────────────────────────────────── */
const SkeletonCard = () => (
    <div className="oh-skeleton-card">
        <div className="oh-skeleton-accent" />
        <div className="oh-skeleton-body">
            <div className="oh-skeleton-row">
                <div className="oh-skeleton-block" style={{ width: '38%', height: 14, borderRadius: 6 }} />
                <div className="oh-skeleton-block" style={{ width: 72, height: 24, borderRadius: 50 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <div className="oh-skeleton-block" style={{ width: 70, height: 28, borderRadius: 10 }} />
                <div className="oh-skeleton-block" style={{ width: 90, height: 28, borderRadius: 10 }} />
                <div className="oh-skeleton-block" style={{ width: 60, height: 28, borderRadius: 10 }} />
            </div>
            <div className="oh-skeleton-row" style={{ paddingTop: 16, borderTop: '1px solid #F5F5F5' }}>
                <div className="oh-skeleton-block" style={{ width: 80, height: 20, borderRadius: 6 }} />
                <div className="oh-skeleton-block" style={{ width: 90, height: 40, borderRadius: 14 }} />
            </div>
        </div>
    </div>
);

const downloadInvoice = (order) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(139, 58, 30);
    doc.text('TABLEKARD', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Powered by Tablekard · tablekard.com', 105, 27, { align: 'center' });

    doc.setDrawColor(220, 220, 220);
    doc.line(20, 32, 190, 32);

    // Invoice Details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice: ${order.id}`, 20, 42);
    doc.text(`Date: ${order.date}`, 20, 50);
    if (order.tableNumber) {
        doc.text(`Table: ${order.tableNumber}`, 20, 58);
    }
    const orderTypeLabel = { dine_in: 'Dine In', takeaway: 'Takeaway', delivery: 'Delivery' };
    doc.text(`Type: ${orderTypeLabel[order.type] || order.type || 'Dine In'}`, 120, 42);
    doc.text(`Payment: ${order.paymentMethod || 'Cash'}`, 120, 50);

    doc.line(20, 64, 190, 64);

    // Items Table Header
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('Item', 20, 73);
    doc.text('Qty', 140, 73);
    doc.text('Amount', 165, 73);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);

    let y = 82;
    order.items.forEach(item => {
        const itemName = item.name.length > 35 ? item.name.substring(0, 33) + '...' : item.name;
        doc.text(itemName, 20, y);
        doc.text(`x${item.quantity}`, 140, y);
        doc.text(`Rs.${(item.price * item.quantity).toFixed(2)}`, 165, y);
        y += 8;
    });

    doc.line(20, y + 2, 190, y + 2);
    y += 12;

    // Tax breakdown (inclusive model)
    const tax18 = Math.round(order.total * 0.18);
    const tax5 = Math.round(order.total * 0.05);
    const subtotal = order.total - tax18 - tax5;

    doc.setFontSize(10);
    doc.text('Subtotal (excl. taxes):', 120, y);
    doc.text(`Rs.${subtotal}`, 175, y, { align: 'right' });
    y += 8;
    doc.setTextColor(100, 100, 100);
    doc.text('GST (18%):', 120, y);
    doc.text(`Rs.${tax18}`, 175, y, { align: 'right' });
    y += 8;
    doc.text('Service Charge (5%):', 120, y);
    doc.text(`Rs.${tax5}`, 175, y, { align: 'right' });
    y += 10;

    doc.setTextColor(139, 58, 30);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(13);
    doc.text('TOTAL PAID:', 120, y);
    doc.text(`Rs.${order.total}`, 175, y, { align: 'right' });

    // Footer
    y += 20;
    doc.setFontSize(9);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('Prices are inclusive of all applicable taxes.', 105, y, { align: 'center' });
    y += 8;
    doc.text('Thank you for dining with us! — Tablekard', 105, y, { align: 'center' });

    doc.save(`Invoice_${order.id.replace('#', '')}.pdf`);
};

const OrderCard = ({ order, onReorder }) => {
    const [expanded, setExpanded] = useState(false);
    const statusInfo = STATUS_MAP[order.realStatus] || STATUS_MAP[order.status] || STATUS_MAP.pending;
    const uiStatus = UI_STATUS(order.realStatus);

    const MAX_VISIBLE = 3;
    const visibleItems = expanded ? order.items : order.items.slice(0, MAX_VISIBLE);
    const hasMore = order.items.length > MAX_VISIBLE;

    return (
        <div className="oh-card">
            <div className={`oh-card-accent ${uiStatus}`} />
            <div className="oh-card-body">
                {/* Header */}
                <div className="oh-card-header">
                    <div className="oh-card-ref">
                        <span className="oh-order-num">{order.id}</span>
                        <span className="oh-order-date">
                            <Calendar size={10} />
                            {order.date}
                        </span>
                        {order.tableNumber && (
                            <span className="oh-table-chip">
                                <MapPin size={9} />
                                Table {order.tableNumber}
                            </span>
                        )}
                        {order.type && (
                            <span className="oh-order-type-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                {ORDER_TYPE_ICON[order.type]}
                                {ORDER_TYPE_LABEL[order.type] || order.type}
                            </span>
                        )}
                        {order.rating && (
                            <div className="oh-rating-pill">
                                <Star size={10} fill="#FFB800" color="#FFB800" />
                                <span>{order.rating}</span>
                            </div>
                        )}
                    </div>
                    <div className={`oh-status-badge ${uiStatus}`}>
                        <span className="oh-status-dot" />
                        {statusInfo.label}
                    </div>
                </div>

                {/* Items */}
                <div className="oh-items-section">
                    <div className="oh-items-label">Items Ordered</div>
                    <div className="oh-items-chips">
                        {visibleItems.map((item, idx) => (
                            <span key={idx} className="oh-item-chip">
                                {item.name}
                                {item.quantity > 1 && (
                                    <span className="oh-item-qty">×{item.quantity}</span>
                                )}
                            </span>
                        ))}
                        {!expanded && hasMore && (
                            <span className="oh-items-more">
                                +{order.items.length - MAX_VISIBLE} more
                            </span>
                        )}
                    </div>
                    {hasMore && (
                        <button
                            className="oh-expand-btn"
                            onClick={() => setExpanded(prev => !prev)}
                        >
                            {expanded ? (
                                <><ChevronUp size={13} /> Show less</>
                            ) : (
                                <><ChevronDown size={13} /> View all {order.items.length} items</>
                            )}
                        </button>
                    )}
                </div>

                {/* Footer */}
                <div className="oh-card-footer">
                    <div className="oh-price-block">
                        <span className="oh-price-label">Total Paid</span>
                        <span className="oh-price-amount">₹{order.total.toLocaleString('en-IN')}</span>
                        <div className="oh-payment-info">
                            {PAYMENT_ICON[order.paymentMethod] || <Banknote size={10} />}
                            <span style={{ textTransform: 'capitalize' }}>
                                {order.paymentMethod || 'cash'}
                            </span>
                            {order.paymentStatus === 'paid' && (
                                <>
                                    <span>·</span>
                                    <span style={{ color: '#27AE60', fontWeight: 600 }}>Paid</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="oh-action-buttons">
                        <button
                            className="oh-download-invoice-btn"
                            onClick={() => downloadInvoice(order)}
                            title="Download Invoice"
                        >
                            <Download size={13} />
                            Invoice
                        </button>
                        <button
                            className="oh-reorder-btn"
                            onClick={() => onReorder(order)}
                        >
                            <RotateCcw size={14} />
                            Reorder
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
const OrderHistoryPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [activeFilter, setActiveFilter] = useState('all');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchHistory = useCallback(async () => {
        if (!isAuthenticated || !user) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const history = await getOrderHistory(user.id);

            const mapped = history.map(order => ({
                id: `#${order.order_number || order.id.substring(0, 8).toUpperCase()}`,
                rawId: order.id,
                restaurantId: order.restaurant_id,
                date: formatDate(order.created_at),
                rawDate: order.created_at,
                items: (order.order_items || []).map(item => ({
                    id: item.menu_item_id,
                    name: item.name,
                    quantity: item.quantity || 1,
                    price: item.price,
                    total: item.total,
                })),
                total: parseFloat(order.total) || 0,
                subtotal: parseFloat(order.subtotal) || 0,
                taxes: parseFloat(order.taxes) || 0,
                status: UI_STATUS(order.status),
                realStatus: order.status,
                paymentMethod: order.payment_method,
                paymentStatus: order.payment_status?.toLowerCase(),
                type: order.type,
                tableNumber: order.table_number ?? null,
                rating: order.rating,
                comment: order.comment
            }));

            setOrders(mapped);
        } catch (err) {
            console.error('Failed to fetch order history:', err);
            setError('Failed to load your order history. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        if (authLoading) return;
        fetchHistory();
    }, [authLoading, fetchHistory]);

    /* ── Computed stats ──────────────────────────────────────────── */
    const completedOrders = orders.filter(o => o.status === 'completed');
    const nonCancelledOrders = orders.filter(o => o.status !== 'cancelled');
    const cancelledOrders = orders.filter(o => o.status === 'cancelled');
    const pendingOrders   = orders.filter(o => o.status === 'pending');

    const totalSpent = nonCancelledOrders.reduce((s, o) => s + o.total, 0);
    const avgOrder   = nonCancelledOrders.length
        ? Math.round(totalSpent / nonCancelledOrders.length)
        : 0;

    /* ── Filter logic ────────────────────────────────────────────── */
    const filters = [
        { id: 'all',       label: 'All',       count: orders.length,          icon: <ShoppingBag size={13} /> },
        { id: 'completed', label: 'Completed',  count: completedOrders.length, icon: <CheckCircle2 size={13} /> },
        { id: 'pending',   label: 'In Progress',count: pendingOrders.length,   icon: <Clock3 size={13} /> },
        { id: 'cancelled', label: 'Cancelled',  count: cancelledOrders.length, icon: <XCircle size={13} /> },
    ];

    const filtered = activeFilter === 'all'
        ? orders
        : orders.filter(o => o.status === activeFilter);

    /* ── Date groups ─────────────────────────────────────────────── */
    const groupedOrders = filtered.reduce((acc, order) => {
        const lbl = groupLabel(order.rawDate);
        if (!acc[lbl]) acc[lbl] = [];
        acc[lbl].push(order);
        return acc;
    }, {});

    const { setCartItems } = useCart();

    const handleReorder = async (order) => {
        try {
            setLoading(true);
            // Fetch current menu items to check availability
            const currentMenu = await getMenuItems(order.restaurantId);
            const currentMenuMap = {};
            currentMenu.forEach(m => {
                currentMenuMap[m.id] = m;
            });

            // Map old order items to new cart items
            const newCart = order.items.map(item => {
                const currentItem = currentMenuMap[item.id];
                const isAvailable = currentItem && currentItem.is_available;
                
                return {
                    id: item.id,
                    name: currentItem ? currentItem.name : item.name,
                    price: currentItem ? (currentItem.discount_price || currentItem.price) : item.price,
                    image: currentItem?.menu_item_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
                    rating: currentItem?.rating || '4.5',
                    serves: currentItem?.serves || '1',
                    quantity: item.quantity,
                    outOfStock: !isAvailable
                };
            });

            setCartItems(prev => {
                const combined = [...prev];
                newCart.forEach(newItem => {
                    const existing = combined.find(i => i.id === newItem.id);
                    if (existing) {
                        existing.quantity += newItem.quantity;
                    } else {
                        combined.push(newItem);
                    }
                });
                return combined;
            });
            navigate('/orders');
        } catch (err) {
            console.error("Reorder failed:", err);
            setError("Failed to process reorder.");
        } finally {
            setLoading(false);
        }
    };

    /* ── Login gate ──────────────────────────────────────────────── */
    if (!authLoading && !isAuthenticated) {
        return (
            <div className="oh-login-prompt">
                <div className="oh-login-icon">🔐</div>
                <h2>Login Required</h2>
                <p>Sign in to view your complete order history and dining insights.</p>
                <button className="oh-login-btn" onClick={() => navigate('/login')}>
                    Sign In Now
                </button>
            </div>
        );
    }

    return (
        <div className="order-history-page-container">
            {/* ── Hero Header ────────────────────────────────────────── */}
            <div className="oh-hero">
                <div className="oh-hero-blob oh-hero-blob-1" />
                <div className="oh-hero-blob oh-hero-blob-2" />
                <div className="oh-hero-blob oh-hero-blob-3" />

                <div className="oh-topnav">
                    <button className="oh-back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </button>
                    <span className="oh-topnav-title">Order History</span>
                    <div className="oh-topnav-spacer" />
                </div>

                {/* Stats Card */}
                <div className="oh-stats-card">
                    <div className="oh-stats-top">
                        <div className="oh-stats-eyebrow">Total Spent</div>
                        <div className="oh-stats-amount">
                            <span className="currency">₹</span>
                            {loading ? '—' : totalSpent.toLocaleString('en-IN')}
                        </div>
                        <div className="oh-stats-subtitle">
                            Across all your dining experiences
                        </div>
                    </div>

                    <div className="oh-stats-divider" />

                    <div className="oh-stats-grid">
                        <div className="oh-stat-item">
                            <div className="oh-stat-icon">
                                <ShoppingBag size={16} />
                            </div>
                            <span className="oh-stat-val">
                                {loading ? '—' : orders.length}
                            </span>
                            <span className="oh-stat-label">Total Orders</span>
                        </div>
                        <div className="oh-stat-item">
                            <div className="oh-stat-icon">
                                <CheckCircle2 size={16} />
                            </div>
                            <span className="oh-stat-val">
                                {loading ? '—' : completedOrders.length}
                            </span>
                            <span className="oh-stat-label">Completed</span>
                        </div>
                        <div className="oh-stat-item">
                            <div className="oh-stat-icon">
                                <TrendingUp size={16} />
                            </div>
                            <span className="oh-stat-val">
                                {loading ? '—' : avgOrder > 0 ? `₹${avgOrder.toLocaleString('en-IN')}` : '—'}
                            </span>
                            <span className="oh-stat-label">Avg Order</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Content ─────────────────────────────────────────────── */}
            <div className="oh-content">
                {/* Filter Tabs */}
                <div className="oh-filter-tabs">
                    {filters.map(f => (
                        <button
                            key={f.id}
                            className={`oh-tab ${activeFilter === f.id ? `active active-${f.id}` : ''}`}
                            onClick={() => setActiveFilter(f.id)}
                        >
                            {f.icon}
                            {f.label}
                            <span className="oh-tab-count">{f.count}</span>
                        </button>
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <div style={{
                        background: '#FFF5F5',
                        border: '1px solid #FED7D7',
                        borderRadius: 16,
                        padding: '16px 20px',
                        marginBottom: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        color: '#C53030',
                        fontSize: 13,
                        fontWeight: 500
                    }}>
                        <WifiOff size={18} />
                        <span>{error}</span>
                        <button
                            onClick={fetchHistory}
                            style={{
                                marginLeft: 'auto',
                                background: '#C53030',
                                color: '#FFF',
                                border: 'none',
                                borderRadius: 8,
                                padding: '6px 12px',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'Outfit, sans-serif'
                            }}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Skeletons */}
                {loading && (
                    <div className="oh-skeleton-list">
                        {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && filtered.length === 0 && (
                    <div className="oh-empty">
                        <div className="oh-empty-art">
                            {activeFilter === 'cancelled' ? '😢' : '🍽️'}
                        </div>
                        <h3>
                            {activeFilter === 'all'
                                ? 'No Orders Yet'
                                : activeFilter === 'completed'
                                ? 'No Completed Orders'
                                : activeFilter === 'cancelled'
                                ? 'No Cancelled Orders'
                                : 'No Active Orders'}
                        </h3>
                        <p>
                            {activeFilter === 'all'
                                ? "Your dining journey begins with your first order. Let's get started!"
                                : "Nothing here yet. Try a different filter or place a new order."}
                        </p>
                        {activeFilter === 'all' && (
                            <button
                                className="oh-empty-btn"
                                onClick={() => navigate('/menu')}
                            >
                                Browse Menu
                            </button>
                        )}
                    </div>
                )}

                {/* Order List (grouped by date) */}
                {!loading && !error && filtered.length > 0 && (
                    <div className="oh-list">
                        {Object.entries(groupedOrders).map(([dateLabel, dayOrders]) => (
                            <React.Fragment key={dateLabel}>
                                <div className="oh-date-group-label">{dateLabel}</div>
                                {dayOrders.map(order => (
                                    <OrderCard
                                        key={order.rawId}
                                        order={order}
                                        onReorder={handleReorder}
                                    />
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
};

export default OrderHistoryPage;
