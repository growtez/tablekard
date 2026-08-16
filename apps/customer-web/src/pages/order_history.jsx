import React, { useState, useEffect, useCallback, useRef } from 'react';
import { formatDateTimeShort, formatDayMonth } from '@restaurant-saas/types';
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
import { useRestaurant } from '../context/RestaurantContext';
import { getOrderHistory, getMenuItems } from '../services/supabaseService';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { jsPDF } from 'jspdf';
import './order_history.css';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
const STATUS_MAP = {
    placed:    { label: 'Placed',    cls: 'pending',   icon: <Clock3 size={10} /> },
    preparing: { label: 'Preparing', cls: 'preparing', icon: <ChefHat size={10} /> },
    ready:     { label: 'Ready',     cls: 'ready',     icon: <Clock3 size={10} /> },
    completed: { label: 'Completed', cls: 'completed', icon: <CheckCircle2 size={10} /> }, // Derived state for Paid Ready orders
    cancelled: { label: 'Cancelled', cls: 'cancelled', icon: <XCircle size={10} /> },
    CANCELLED: { label: 'Cancelled', cls: 'cancelled', icon: <XCircle size={10} /> },
};

const UI_STATUS = (order) => {
    const s = (order.status || '').toLowerCase();
    if (s === 'ready' && order.payment_status === 'paid') return 'completed';
    if (s === 'ready') return 'ready';
    if (s === 'cancelled') return 'cancelled';
    if (s === 'preparing') return 'preparing';
    return 'placed';
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
    return formatDateTimeShort(iso);
};

const formatDateShort = (iso) => {
    return formatDayMonth(iso);
};

const groupLabel = (iso) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return formatDateShort(iso);
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

const getBase64ImageFromUrl = async (imageUrl) => {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => resolve(reader.result), false);
        reader.addEventListener("error", () => reject());
        reader.readAsDataURL(blob);
    });
};

const downloadInvoice = async (order) => {
    const doc = new jsPDF();

    // Set colors
    const primaryColor = [139, 58, 30]; // #8B3A1E
    const darkGray = [50, 50, 50];
    const lightGray = [240, 240, 240];

    // Header Background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    // Header Content
    try {
        const logoBase64 = await getBase64ImageFromUrl('/assets/tablekard-logo.png');
        const logoWidth = 40;
        const logoHeight = 12;
        doc.addImage(logoBase64, 'PNG', 20, 14, logoWidth, logoHeight);
    } catch (e) {
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('TABLEKARD', 20, 25);
    }
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text('INVOICE', 190, 25, { align: 'right' });

    // Normalize order data between my_order and order_history
    const invoiceNo = order.id || order.order_number || 'N/A';
    
    let dateStr = '';
    let timeStr = '';
    if (order.rawDate) {
        const dateObj = new Date(order.rawDate);
        dateStr = dateObj.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
        timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } else if (order.fullDate || order.orderDate) {
        dateStr = order.fullDate || '';
        timeStr = order.orderDate || '';
    } else if (order.date) {
        dateStr = order.date;
        timeStr = '';
    }

    const orderType = (order.rawOrder?.type || order.type || 'Dine In').replace('_', ' ').toUpperCase();
    const payment = order.paymentStatus || order.paymentMethod || 'Pending';
    
    // Invoice Details
    doc.setTextColor(...darkGray);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Invoice No:', 20, 55);
    doc.setFont(undefined, 'normal');
    doc.text(invoiceNo, 45, 55);
    
    doc.setFont(undefined, 'bold');
    doc.text('Date:', 20, 62);
    doc.setFont(undefined, 'normal');
    doc.text(dateStr, 45, 62);
    
    if (timeStr) {
        doc.setFont(undefined, 'bold');
        doc.text('Time:', 20, 69);
        doc.setFont(undefined, 'normal');
        doc.text(timeStr, 45, 69);
    }
    
    doc.setFont(undefined, 'bold');
    doc.text('Order Type:', 130, 55);
    doc.setFont(undefined, 'normal');
    doc.text(orderType, 155, 55);

    doc.setFont(undefined, 'bold');
    doc.text('Payment:', 130, 62);
    doc.setFont(undefined, 'normal');
    doc.text(payment, 155, 62);

    // Table Header Background
    let tableY = timeStr ? 75 : 75;
    doc.setFillColor(...lightGray);
    doc.rect(20, tableY, 170, 10, 'F');

    // Table Headers
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Item Description', 25, tableY + 7);
    doc.text('Qty', 130, tableY + 7, { align: 'center' });
    doc.text('Price', 150, tableY + 7, { align: 'right' });
    doc.text('Total', 185, tableY + 7, { align: 'right' });

    // Table Items
    let y = tableY + 17;
    doc.setFont(undefined, 'normal');
    
    (order.items || []).forEach(item => {
      // Add page if needed
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.setFont(undefined, 'bold');
      doc.setTextColor(...darkGray);
      doc.text(item.name, 25, y);
      doc.setFont(undefined, 'normal');
      doc.text(String(item.quantity), 130, y, { align: 'center' });
      doc.text(`Rs. ${item.price}`, 150, y, { align: 'right' });
      
      const baseItemTotal = item.price * item.quantity;
      doc.text(`Rs. ${baseItemTotal}`, 185, y, { align: 'right' });
      y += 5;

      // Variant and Addons
      if (item.variant || (item.addons && item.addons.length > 0)) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        
        if (item.variant) {
          if (item.quantity > 1) {
            doc.text(`- Variant: ${item.variant.name} (Rs. ${item.variant.price} x ${item.quantity})`, 28, y);
          } else {
            doc.text(`- Variant: ${item.variant.name}`, 28, y);
          }
          doc.text(`Rs. ${item.variant.price * item.quantity}`, 185, y, { align: 'right' });
          y += 5;
        }
        
        if (item.addons && item.addons.length > 0) {
          const addonCounts = {};
          item.addons.forEach(a => {
              const key = a.name;
              if (!addonCounts[key]) addonCounts[key] = { ...a, count: 0, totalPrice: 0 };
              addonCounts[key].count += 1;
              addonCounts[key].totalPrice += a.price;
          });
          
          Object.values(addonCounts).forEach(a => {
              let addonLabel = `- Add-on: ${a.name}`;
              if (a.count > 1) addonLabel += ` x${a.count}`;
              
              if (item.quantity > 1) {
                doc.text(`${addonLabel} (Rs. ${a.totalPrice} x ${item.quantity})`, 28, y);
              } else {
                doc.text(`${addonLabel}`, 28, y);
              }
              doc.text(`Rs. ${a.totalPrice * item.quantity}`, 185, y, { align: 'right' });
              y += 5;
          });
        }
        doc.setFontSize(10);
        doc.setTextColor(...darkGray);
      }
      
      // Draw line under item
      y += 3;
      doc.setDrawColor(230, 230, 230);
      doc.line(20, y, 190, y);
      y += 7;
    });

    // Summary Box
    y += 5;
    if (y > 230) { doc.addPage(); y = 30; }
    
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(120, y, 190, y);
    y += 8;

    // Total Background
    doc.setFillColor(...lightGray);
    doc.rect(125, y, 65, 10, 'F');
    
    y += 7;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('SUBTOTAL:', 140, y);
    doc.text(`Rs. ${order.total}`, 185, y, { align: 'right' });

    // Footer
    y += 30;
    if (y > 270) { doc.addPage(); y = 30; }
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for dining with us!', 105, y, { align: 'center' });
    doc.text('This is a computer generated invoice.', 105, y + 6, { align: 'center' });

    doc.save(`Invoice_${invoiceNo.replace('#', '')}.pdf`);
};

const OrderCard = ({ order, onReorder }) => {
    const [expanded, setExpanded] = useState(false);
    const statusInfo = STATUS_MAP[order.realStatus] || STATUS_MAP[order.status] || STATUS_MAP.placed;
    const uiStatus = UI_STATUS(order);

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
    const { restaurant } = useRestaurant();
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
            const history = await getOrderHistory(user.id, restaurant?.id);

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
                status: UI_STATUS(order),
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
    }, [isAuthenticated, user, restaurant?.id]);

    useEffect(() => {
        if (authLoading) return;
        fetchHistory();
    }, [authLoading, fetchHistory]);

    /* ── Computed stats ──────────────────────────────────────────── */
    const completedOrders = orders.filter(o => o.status === 'completed'); // UI_STATUS sets to completed
    const nonCancelledOrders = orders.filter(o => o.status !== 'cancelled');
    const cancelledOrders = orders.filter(o => o.status === 'cancelled');
    const pendingOrders   = orders.filter(o => o.status === 'placed' || o.status === 'preparing' || o.status === 'ready');

    const totalSpent = nonCancelledOrders.reduce((s, o) => s + o.total, 0);
    const avgOrder   = nonCancelledOrders.length
        ? Math.round(totalSpent / nonCancelledOrders.length)
        : 0;

    /* ── Filter logic ────────────────────────────────────────────── */
    const filters = [
        { id: 'all',       label: 'All',       count: orders.length,          icon: <ShoppingBag size={13} /> },
        { id: 'completed', label: 'Completed',  count: completedOrders.length, icon: <CheckCircle2 size={13} /> },
        { id: 'placed',    label: 'In Progress',count: pendingOrders.length,   icon: <Clock3 size={13} /> },
        { id: 'cancelled', label: 'Cancelled',  count: cancelledOrders.length, icon: <XCircle size={13} /> },
    ];

    const filtered = activeFilter === 'all'
        ? orders
        : activeFilter === 'placed' 
            ? pendingOrders
            : orders.filter(o => o.status === activeFilter);

    const { visibleItems, loaderRef, hasMore } = useInfiniteScroll(filtered, 10);

    /* ── Date groups ─────────────────────────────────────────────── */
    const groupedOrders = visibleItems.reduce((acc, order) => {
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
                    ratingCount: currentItem?.ratingCount || 0,
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
                        
                        {/* Progressive Rendering Loader */}
                        <div ref={loaderRef} style={{ height: '20px', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                            {hasMore && <Loader2 className="oh-spinner" size={20} color="#888" />}
                        </div>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
};

export default OrderHistoryPage;
