import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import {
    Download, Calendar, Loader2, ChevronLeft, ChevronRight, X,
    Eye, ShoppingCart, Hash, User, CreditCard, CheckCircle, IndianRupee
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';

/* ─────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────── */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
const HOUR_LABELS = ['6a', '7a', '8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p', '10p', '11p'];
const PAGE_SIZE = 20;

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
const heatColor = (count, max) => {
    if (max === 0 || count === 0) return '#F0F4F8';
    const intensity = count / max;
    if (intensity < 0.25) return '#C3DAFE';
    if (intensity < 0.5)  return '#7F9CF5';
    if (intensity < 0.75) return '#4C51BF';
    return '#312E81';
};

const fmtCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Returns a YYYY-MM-DD string in IST (UTC+5:30) so day boundaries match the database trigger
const toISTDateKey = (isoString) => {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const d = new Date(new Date(isoString).getTime() + IST_OFFSET_MS);
    return d.toISOString().split('T')[0];
};

const methodLabel = (m) => {
    const map = { cash: 'Cash', card: 'Card', upi: 'UPI', netbanking: 'Netbanking', wallet: 'Wallet', online: 'Online', razorpay: 'Razorpay' };
    return map[m?.toLowerCase()] ?? m ?? '—';
};

const payStatusStyle = {
    paid:     { bg: 'rgba(104,211,145,0.15)', color: '#38A169' },
    pending:  { bg: 'rgba(237,137,54,0.15)',  color: '#C05621' },
    failed:   { bg: 'rgba(252,129,129,0.15)', color: '#C53030' },
    refunded: { bg: 'rgba(160,174,192,0.15)', color: '#4A5568' },
};

/* ─────────────────────────────────────────────────────────────
   Inline styles (scoped chart styles, exact match to reports.css)
───────────────────────────────────────────────────────────── */
const chartContainerStyle = {
    height: '250px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    paddingBottom: '30px',
    position: 'relative',
    borderBottom: '1px solid var(--color-border, #E2E8F0)',
};

const chartBarGroupStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    position: 'relative',
    cursor: 'pointer',
};

const chartBarBaseStyle = {
    width: '100%',
    maxWidth: '40px',
    background: 'linear-gradient(180deg, #4C51BF 0%, #434190 100%)',
    borderRadius: '4px 4px 0 0',
    minHeight: '5%',
    transition: 'all 0.3s ease',
};

const chartLabelStyle = {
    position: 'absolute',
    bottom: '-25px',
    fontSize: '11px',
    color: '#718096',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
    textAlign: 'center',
};

const chartTooltipStyle = {
    position: 'absolute',
    top: '-38px',
    background: '#1A202C',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: 500,
    opacity: 0,
    transition: 'opacity 0.2s',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    zIndex: 10,
    fontFamily: 'inherit',
};

/* ─────────────────────────────────────────────────────────────
   Orders Modal (mirrors RevenueOrdersModal)
───────────────────────────────────────────────────────────── */
function OrdersModal({ restaurantId, startDate, endDate, periodLabel, onClose }) {
    const [modalOrders, setModalOrders] = useState([]);
    const [totalCount, setTotalCount]   = useState(0);
    const [page, setPage]               = useState(1);
    const [loadingModal, setLoadingModal] = useState(true);

    const totalPages  = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const pageRevenue = modalOrders.reduce((s, o) => {
        const st = o.payment_status?.toLowerCase();
        return st === 'failed' || st === 'refunded' ? s : s + Number(o.total || 0);
    }, 0);

    const fetchPage = useCallback(async (p) => {
        setLoadingModal(true);
        try {
            const from = (p - 1) * PAGE_SIZE;
            const to   = from + PAGE_SIZE - 1;
            const { data, error, count } = await supabase
                .from('orders')
                .select(
                    `id, order_number, created_at, payment_method, payment_status, total,
                     profiles(name),
                     order_items(name, quantity)`,
                    { count: 'exact' }
                )
                .eq('restaurant_id', restaurantId)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
                .order('created_at', { ascending: false })
                .range(from, to);

            if (!error) {
                const mapped = (data || []).map(row => {
                    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
                    const items   = Array.isArray(row.order_items) ? row.order_items : [];
                    return {
                        id: row.id,
                        orderNumber:   row.order_number,
                        createdAt:     row.created_at,
                        customerName:  profile?.name || 'Guest',
                        paymentMethod: row.payment_method || '—',
                        payment_status: row.payment_status || '—',
                        total:         Number(row.total) || 0,
                        items:         items.map(i => `${i.name} x${i.quantity}`).join(', ') || '—',
                    };
                });
                setModalOrders(mapped);
                setTotalCount(count || 0);
            }
        } finally {
            setLoadingModal(false);
        }
    }, [restaurantId, startDate, endDate]);

    useEffect(() => { setPage(1); fetchPage(1); }, [fetchPage]);

    const goToPage = (p) => { if (p < 1 || p > totalPages) return; setPage(p); fetchPage(p); };

    // Page numbers to show (with ellipsis logic)
    const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
        .reduce((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
            acc.push(p);
            return acc;
        }, []);

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 9000,
                background: 'rgba(0,0,0,0.50)',
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'fadeInOverlay 0.2s ease',
                padding: '16px',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--color-surface, #fff)',
                    borderRadius: '24px',
                    width: '92%',
                    maxWidth: '1080px',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 32px 64px -12px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.04)',
                    animation: 'slideUpModal 0.3s cubic-bezier(0.16,1,0.3,1)',
                    overflow: 'hidden',
                    fontFamily: 'inherit',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px 20px', borderBottom: '1px solid var(--color-border, #F1F5F9)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <ShoppingCart size={20} style={{ color: '#4C51BF' }} />
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-main, #1A202C)', margin: 0, lineHeight: 1.2 }}>Order Details</h2>
                            <p style={{ fontSize: '13px', color: 'var(--color-text-muted, #718096)', margin: '2px 0 0' }}>{periodLabel}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ width: 36, height: 36, border: 'none', borderRadius: '10px', background: 'var(--color-surface-hover, #F1F5F9)', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Stats bar */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '14px 28px', background: 'linear-gradient(135deg, #667eea08, #764ba208)', borderBottom: '1px solid var(--color-border, #F1F5F9)', flexShrink: 0, gap: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#A0AEC0', fontWeight: 500 }}>Total Orders</span>
                        <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-main, #1A202C)', lineHeight: 1 }}>{totalCount.toLocaleString()}</span>
                    </div>
                    <div style={{ width: 1, height: 36, background: 'var(--color-border, #E2E8F0)', margin: '0 28px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#A0AEC0', fontWeight: 500 }}>Page Revenue</span>
                        <span style={{ fontSize: '20px', fontWeight: 700, color: '#4C51BF', lineHeight: 1 }}>{fmtCurrency(pageRevenue)}</span>
                    </div>
                    <div style={{ width: 1, height: 36, background: 'var(--color-border, #E2E8F0)', margin: '0 28px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#A0AEC0', fontWeight: 500 }}>Page</span>
                        <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-main, #1A202C)', lineHeight: 1 }}>{page} / {totalPages}</span>
                    </div>
                </div>

                {/* Table */}
                <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
                    {loadingModal ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '64px 24px', color: '#A0AEC0' }}>
                            <Loader2 size={28} style={{ animation: 'spin 0.9s linear infinite', color: '#4C51BF' }} />
                            <span>Loading orders…</span>
                        </div>
                    ) : modalOrders.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '64px 24px', color: '#A0AEC0' }}>
                            <ShoppingCart size={40} style={{ color: '#CBD5E0' }} />
                            <p style={{ margin: 0 }}>No orders found for this period.</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', minWidth: '780px' }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                                <tr style={{ background: 'var(--color-surface-hover, #F8FAFC)', borderBottom: '2px solid var(--color-border, #E2E8F0)' }}>
                                    {[
                                        { icon: <Hash size={13} />, label: 'Order #' },
                                        { icon: <CreditCard size={13} />, label: 'Date & Time' },
                                        { icon: <User size={13} />, label: 'Customer' },
                                        { icon: <ShoppingCart size={13} />, label: 'Items' },
                                        { icon: <CreditCard size={13} />, label: 'Method' },
                                        { icon: <CheckCircle size={13} />, label: 'Status' },
                                        { icon: <IndianRupee size={13} />, label: 'Total', right: true },
                                    ].map((th, i) => (
                                        <th key={i} style={{ padding: '13px 16px', textAlign: th.right ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: th.right ? 'flex-end' : 'flex-start' }}>
                                                {th.icon} {th.label}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {modalOrders.map(order => {
                                    const stKey = order.payment_status?.toLowerCase();
                                    const stStyle = payStatusStyle[stKey] || payStatusStyle.pending;
                                    return (
                                        <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border, #F1F5F9)', transition: 'background 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-hover, #F8FAFC)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '13px 16px', verticalAlign: 'middle', fontWeight: 600, color: '#4C51BF', whiteSpace: 'nowrap' }}>#{order.orderNumber}</td>
                                            <td style={{ padding: '13px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap', color: 'var(--color-text-main, #2D3748)' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    <span>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                    <span style={{ fontSize: '11.5px', color: '#A0AEC0' }}>{new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '13px 16px', verticalAlign: 'middle', fontWeight: 500, whiteSpace: 'nowrap', color: 'var(--color-text-main, #2D3748)' }}>{order.customerName}</td>
                                            <td style={{ padding: '13px 16px', verticalAlign: 'middle', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#4A5568' }} title={order.items}>{order.items}</td>
                                            <td style={{ padding: '13px 16px', verticalAlign: 'middle', color: 'var(--color-text-main, #2D3748)' }}>{methodLabel(order.paymentMethod)}</td>
                                            <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', background: stStyle.bg, color: stStyle.color }}>
                                                    {order.payment_status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '13px 16px', verticalAlign: 'middle', textAlign: 'right', fontWeight: 700, color: 'var(--color-text-main, #1A202C)', whiteSpace: 'nowrap' }}>{fmtCurrency(order.total)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr style={{ background: 'var(--color-surface-hover, #F8FAFC)', borderTop: '2px solid var(--color-border, #E2E8F0)' }}>
                                    <td colSpan={5} style={{ padding: '13px 16px', fontWeight: 600, color: '#4A5568', fontSize: '13px' }}>
                                        Page total ({modalOrders.length} orders)
                                    </td>
                                    <td />
                                    <td style={{ padding: '13px 16px', textAlign: 'right', fontSize: '16px', fontWeight: 700, color: '#4C51BF' }}>
                                        {fmtCurrency(pageRevenue)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {!loadingModal && totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '16px 24px', borderTop: '1px solid var(--color-border, #F1F5F9)', flexShrink: 0 }}>
                        <button onClick={() => goToPage(page - 1)} disabled={page === 1}
                            style={{ minWidth: 34, height: 34, padding: '0 10px', border: '1.5px solid var(--color-border, #E2E8F0)', borderRadius: '8px', background: 'var(--color-surface, #fff)', color: '#4A5568', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === 1 ? 0.35 : 1 }}>
                            <ChevronLeft size={16} />
                        </button>
                        {pageNums.map((p, idx) =>
                            p === '…' ? (
                                <span key={`e-${idx}`} style={{ color: '#A0AEC0', padding: '0 4px', fontSize: '14px' }}>…</span>
                            ) : (
                                <button key={p} onClick={() => goToPage(p)}
                                    style={{ minWidth: 34, height: 34, padding: '0 10px', border: `1.5px solid ${p === page ? '#4C51BF' : 'var(--color-border, #E2E8F0)'}`, borderRadius: '8px', background: p === page ? '#4C51BF' : 'var(--color-surface, #fff)', color: p === page ? '#fff' : '#4A5568', fontWeight: p === page ? 600 : 500, cursor: 'pointer', fontSize: '13px' }}>
                                    {p}
                                </button>
                            )
                        )}
                        <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}
                            style={{ minWidth: 34, height: 34, padding: '0 10px', border: '1.5px solid var(--color-border, #E2E8F0)', borderRadius: '8px', background: 'var(--color-surface, #fff)', color: '#4A5568', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === totalPages ? 0.35 : 1 }}>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Keyframe injections */}
            <style>{`
                @keyframes fadeInOverlay { from { opacity:0 } to { opacity:1 } }
                @keyframes slideUpModal  { from { transform:translateY(24px); opacity:0 } to { transform:translateY(0); opacity:1 } }
                @keyframes spin          { to { transform: rotate(360deg) } }
                .oht-bar-group:hover .oht-bar-tooltip { opacity: 1 !important; }
                .oht-bar-group:hover .oht-chart-bar   { background: linear-gradient(180deg, #5A67D8 0%, #4C51BF 100%) !important; transform: scaleX(1.07); }
            `}</style>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */
export default function OrderHistoryTab({ restaurantId }) {
    const [timeframe,   setTimeframe]   = useState('month');
    const [weekOffset,  setWeekOffset]  = useState(0);
    const [monthOffset, setMonthOffset] = useState(0);
    const [customStart, setCustomStart] = useState('');
    const [customEnd,   setCustomEnd]   = useState('');
    const [loading,     setLoading]     = useState(true);

    const [orders,          setOrders]          = useState([]);
    const [topItems,        setTopItems]        = useState([]);
    const [feedback,        setFeedback]        = useState([]);
    const [showAllItems,    setShowAllItems]     = useState(false);

    // Orders modal state
    const [ordersModal, setOrdersModal] = useState(null); // { start, end, label }

    const [summary, setSummary] = useState({
        totalRevenue: 0, totalOrders: 0, aov: 0,
        discount: 0, tax: 0, cancelled: 0,
        dineInPercent: 0, onlinePercent: 0,
        revenueHistory: [],
        peakData: Array.from({ length: 7 }, () => Array(24).fill(0))
    });

    /* ── Date helpers ── */
    const getDateRange = () => {
        const now = new Date();
        let start = new Date(), end = new Date();

        if (timeframe === 'today') {
            start.setHours(0, 0, 0, 0);
        } else if (timeframe === 'week') {
            // Week starts Monday: getDay() 0=Sun needs to go back 6, 1=Mon->0, 2=Tue->1, etc.
            const dayOfWeek = now.getDay();
            const daysFromMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMon);
            start = new Date(mon); start.setDate(start.getDate() - weekOffset * 7); start.setHours(0, 0, 0, 0);
            end   = new Date(start); end.setDate(end.getDate() + 7); end.setMilliseconds(-1);
        } else if (timeframe === 'month') {
            start = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1, 0, 0, 0, 0);
            end   = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 1); end.setMilliseconds(-1);
        } else if (timeframe === 'all') {
            start = new Date(2020, 0, 1); end = new Date();
        } else if (timeframe === 'custom' && customStart && customEnd) {
            start = new Date(customStart); end = new Date(customEnd); end.setHours(23, 59, 59, 999);
        }
        return { start, end };
    };

    const getWeekDateRange = (offset) => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const daysFromMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMon);
        const s   = new Date(mon); s.setDate(s.getDate() - offset * 7);
        const e   = new Date(s); e.setDate(e.getDate() + 6);
        return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${e.getFullYear()}`;
    };

    const getMonthLabel = (offset) => {
        const d = new Date(new Date().getFullYear(), new Date().getMonth() - offset, 1);
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const chartTitle = () => {
        if (timeframe === 'today')  return 'Revenue Overview (Today)';
        if (timeframe === 'week')   return `Revenue Overview (${getWeekDateRange(weekOffset)})`;
        if (timeframe === 'month')  return `Revenue Overview (${getMonthLabel(monthOffset)})`;
        if (timeframe === 'custom' && customStart && customEnd) return `Revenue Overview (${customStart} → ${customEnd})`;
        return 'Revenue Overview (All Time)';
    };

    /* ── Data fetch ── */
    const fetchData = async () => {
        if (!restaurantId) return;
        setLoading(true);
        try {
            const { start, end } = getDateRange();

            const { data: ordersData, error: ordersError } = await supabase
                .from('orders').select('*')
                .eq('restaurant_id', restaurantId)
                .gte('created_at', start.toISOString())
                .lte('created_at', end.toISOString())
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;
            setOrders(ordersData || []);

            let totalRev = 0, totalTax = 0, totalDisc = 0, cancelledCount = 0;
            let dineInCount = 0, onlineCount = 0, paidCount = 0;
            const revMap = {};
            const peak   = Array.from({ length: 7 }, () => Array(24).fill(0));

            (ordersData || []).forEach(o => {
                const payStatus = o.payment_status?.toLowerCase();

                // Exclude only truly failed or refunded payments
                const isExcluded = payStatus === 'failed' || payStatus === 'refunded';

                // Peak heatmap: count all non-excluded orders (including cancelled order_status)
                const d = new Date(o.created_at);
                // Remap getDay() 0=Sun to our 0=Mon index
                let day = d.getDay() - 1; if (day === -1) day = 6;
                peak[day][d.getHours()] += 1;

                // Count cancelled order_status for the cancelled metric
                if (o.status === 'cancelled' || o.status === 'rejected') cancelledCount++;

                if (isExcluded) return; // skip failed/refunded for all revenue metrics

                const isPaid = payStatus === 'paid';
                if (isPaid) {
                    paidCount++;
                    totalRev  += Number(o.total    || 0);
                    totalTax  += Number(o.taxes    || 0);
                    totalDisc += Number(o.discount || 0);
                    if (o.type === 'dine_in' || o.type === 'dine-in') dineInCount++;
                    if (o.payment_method === 'online' || o.payment_method === 'razorpay') onlineCount++;
                }

                // Chart grouping — use IST date so it matches the DB trigger's DATE(created_at AT TIME ZONE 'Asia/Kolkata')
                if (isPaid) {
                    const dKey = toISTDateKey(o.created_at);
                    if (!revMap[dKey]) revMap[dKey] = { date: dKey, revenue: 0, orders: 0 };
                    revMap[dKey].revenue += Number(o.total || 0);
                    revMap[dKey].orders  += 1;
                }
            });

            // Build chart data with per-bar dateStart/dateEnd for modal
            const revHistory = [];
            const dayDifference = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

            if (timeframe === 'month') {
                let bucketRevenue = 0, bucketOrders = 0;
                let bucketDayStart = null, bucketDayEnd = null;
                let currentBucketIndex = -1;
                
                const firstOfMonth = new Date(start.getFullYear(), start.getMonth(), 1);
                const firstDayOfWeek = firstOfMonth.getDay();
                const firstDayMon = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dKey = toISTDateKey(d.toISOString());
                    const dayOfMonth = d.getDate();
                    const bucketIndex = Math.floor((dayOfMonth - 1 + firstDayMon) / 7);

                    if (bucketIndex !== currentBucketIndex) {
                        if (currentBucketIndex !== -1) {
                            const s = new Date(bucketDayStart); s.setHours(0, 0, 0, 0);
                            const e = new Date(bucketDayEnd); e.setHours(23, 59, 59, 999);
                            revHistory.push({ label: `Wk ${currentBucketIndex + 1}`, revenue: bucketRevenue, orders: bucketOrders, dateStart: s, dateEnd: e });
                        }
                        currentBucketIndex = bucketIndex;
                        bucketDayStart = new Date(d);
                        bucketRevenue = 0;
                        bucketOrders = 0;
                    }
                    bucketDayEnd = new Date(d);
                    bucketRevenue += revMap[dKey]?.revenue || 0;
                    bucketOrders  += revMap[dKey]?.orders || 0;
                }
                if (currentBucketIndex !== -1) {
                    const s = new Date(bucketDayStart); s.setHours(0, 0, 0, 0);
                    const e = new Date(bucketDayEnd); e.setHours(23, 59, 59, 999);
                    revHistory.push({ label: `Wk ${currentBucketIndex + 1}`, revenue: bucketRevenue, orders: bucketOrders, dateStart: s, dateEnd: e });
                }
            } else if (timeframe === 'all' || dayDifference > 31) {
                const monthMap = {};
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dKey = toISTDateKey(d.toISOString());
                    const year = d.getFullYear();
                    const month = d.getMonth();
                    const key = `${year}-${month.toString().padStart(2, '0')}`;

                    if (!monthMap[key]) {
                        const mStart = new Date(year, month, 1, 0, 0, 0, 0);
                        const mEnd   = new Date(year, month + 1, 0, 23, 59, 59, 999);
                        monthMap[key] = {
                            label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                            revenue: 0, orders: 0,
                            dateStart: mStart, dateEnd: mEnd,
                            date: new Date(year, month, 1)
                        };
                    }
                    monthMap[key].revenue += revMap[dKey]?.revenue || 0;
                    monthMap[key].orders  += revMap[dKey]?.orders || 0;
                }
                Object.values(monthMap)
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .forEach(v => revHistory.push({ label: v.label, revenue: v.revenue, orders: v.orders, dateStart: v.dateStart, dateEnd: v.dateEnd }));
            } else if (timeframe === 'today') {
                const ds = new Date(); ds.setHours(0, 0, 0, 0);
                const de = new Date(); de.setHours(23, 59, 59, 999);
                const totalRev = Object.values(revMap).reduce((s, v) => s + v.revenue, 0);
                const totalOrd = Object.values(revMap).reduce((s, v) => s + v.orders, 0);
                revHistory.push({ label: ds.toLocaleDateString('en-US', { weekday: 'short' }), revenue: totalRev, orders: totalOrd, dateStart: ds, dateEnd: de });
            } else {
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dKey = toISTDateKey(d.toISOString());
                    const ds = new Date(d); ds.setHours(0, 0, 0, 0);
                    const de = new Date(d); de.setHours(23, 59, 59, 999);
                    let label = d.toLocaleDateString('en-US', { weekday: 'short' });
                    if (dayDifference > 14) label = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                    revHistory.push({ label, revenue: revMap[dKey]?.revenue || 0, orders: revMap[dKey]?.orders || 0, dateStart: ds, dateEnd: de });
                }
            }

            setSummary({
                totalRevenue: totalRev, totalOrders: paidCount,
                aov:  paidCount > 0 ? totalRev / paidCount : 0,
                discount: totalDisc, tax: totalTax, cancelled: cancelledCount,
                dineInPercent:  paidCount > 0 ? (dineInCount  / paidCount) * 100 : 0,
                onlinePercent:  paidCount > 0 ? (onlineCount  / paidCount) * 100 : 0,
                revenueHistory: revHistory,
                peakData: peak,
            });

            // Top items — only from paid orders (matching the revenue metric filter)
            const { data: oi } = await supabase
                .from('order_items')
                .select('quantity, price, menu_items(name), orders!inner(payment_status)')
                .eq('orders.restaurant_id', restaurantId)
                .eq('orders.payment_status', 'paid')
                .gte('orders.created_at', start.toISOString())
                .lte('orders.created_at', end.toISOString());
            if (oi) {
                const map = {};
                oi.forEach(i => {
                    const nm = i.menu_items?.name || 'Unknown';
                    if (!map[nm]) map[nm] = { name: nm, sold: 0, revenue: 0 };
                    map[nm].sold    += i.quantity;
                    map[nm].revenue += i.quantity * i.price;
                });
                setTopItems(Object.values(map).sort((a, b) => b.revenue - a.revenue));
            }

            // Feedback
            const { data: fbData, error: fbErr } = await supabase
                .from('feedback')
                .select(`id, rating, comment, created_at, orders!inner(restaurant_id, profiles(name), order_items(name))`)
                .eq('orders.restaurant_id', restaurantId)
                .order('created_at', { ascending: false }).limit(20);
            if (!fbErr && fbData) {
                setFeedback(fbData.map(row => {
                    const order   = Array.isArray(row.orders) ? row.orders[0] : row.orders;
                    const profile = order?.profiles ? (Array.isArray(order.profiles) ? order.profiles[0] : order.profiles) : null;
                    const items   = order?.order_items || [];
                    return { id: row.id, rating: row.rating, comment: row.comment, createdAt: row.created_at, customerName: profile?.name || 'Guest', orderItems: Array.isArray(items) ? items.map(i => i.name).join(', ') : '' };
                }));
            }
        } catch (err) {
            console.error('OrderHistoryTab fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (timeframe === 'custom' && (!customStart || !customEnd)) return;
        fetchData();
    }, [restaurantId, timeframe, weekOffset, monthOffset, customStart, customEnd]);

    const handleExportCSV = () => {
        const rows = [
            ['Date', 'Revenue', 'Orders'], ...summary.revenueHistory.map(r => [r.label, r.revenue, r.orders]),
            [], ['Item', 'Sold', 'Revenue'], ...topItems.map(i => [i.name, i.sold, i.revenue])
        ];
        const blob = new Blob([rows.map(e => e.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a'); a.href = url; a.download = `orders_${restaurantId}_${timeframe}.csv`; a.click();
    };

    const openModalForBar  = (bar) => setOrdersModal({ start: bar.dateStart, end: bar.dateEnd, label: bar.label });
    const openModalForFull = () => {
        const { start, end } = getDateRange();
        setOrdersModal({ start, end, label: chartTitle() });
    };

    const maxRev  = Math.max(...summary.revenueHistory.map(b => b.revenue), 1);
    const peakMax = Math.max(...summary.peakData.map(d => Math.max(...d)), 1);

    /* ── Initial loading ── */
    if (loading && summary.totalOrders === 0 && summary.revenueHistory.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <Loader2 size={32} className="animate-spin text-accent-primary mb-4" />
                <p className="text-text-muted">Loading analytics…</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 animate-fade-in">

            {/* ── Filters ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-border">
                <div className="flex items-center gap-2 flex-wrap">
                    {['today', 'week', 'month', 'all'].map(t => (
                        <button key={t} onClick={() => { setTimeframe(t); setWeekOffset(0); setMonthOffset(0); }}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-none cursor-pointer ${timeframe === t ? 'bg-accent-primary text-black' : 'bg-surface-hover text-text-muted hover:text-text-main'}`}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                    <div className="flex items-center gap-2 border-l border-border pl-2 ml-1">
                        <button onClick={() => setTimeframe('custom')}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border-none cursor-pointer ${timeframe === 'custom' ? 'bg-accent-primary text-black' : 'bg-surface-hover text-text-muted hover:text-text-main'}`}>
                            <Calendar size={16} /> Custom
                        </button>
                        {timeframe === 'custom' && (
                            <div className="flex items-center gap-2">
                                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-surface-hover border border-border rounded-lg px-3 py-1.5 text-sm text-text-main" />
                                <span className="text-text-muted text-sm">to</span>
                                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-surface-hover border border-border rounded-lg px-3 py-1.5 text-sm text-text-main" />
                            </div>
                        )}
                    </div>
                    {timeframe === 'week' && (
                        <div className="flex items-center gap-3 bg-surface-hover px-3 py-1.5 rounded-xl ml-1">
                            <button onClick={() => setWeekOffset(p => p + 1)} className="text-text-muted hover:text-text-main border-none bg-transparent cursor-pointer"><ChevronLeft size={16} /></button>
                            <span className="text-sm font-semibold whitespace-nowrap">{getWeekDateRange(weekOffset)}</span>
                            <button onClick={() => setWeekOffset(p => Math.max(0, p - 1))} disabled={weekOffset === 0} className="text-text-muted hover:text-text-main border-none bg-transparent cursor-pointer disabled:opacity-30"><ChevronRight size={16} /></button>
                        </div>
                    )}
                    {timeframe === 'month' && (
                        <div className="flex items-center gap-3 bg-surface-hover px-3 py-1.5 rounded-xl ml-1">
                            <button onClick={() => setMonthOffset(p => p + 1)} className="text-text-muted hover:text-text-main border-none bg-transparent cursor-pointer"><ChevronLeft size={16} /></button>
                            <span className="text-sm font-semibold whitespace-nowrap">{getMonthLabel(monthOffset)}</span>
                            <button onClick={() => setMonthOffset(p => Math.max(0, p - 1))} disabled={monthOffset === 0} className="text-text-muted hover:text-text-main border-none bg-transparent cursor-pointer disabled:opacity-30"><ChevronRight size={16} /></button>
                        </div>
                    )}
                </div>
                <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-surface-hover text-text-main font-semibold rounded-xl border border-border hover:bg-border transition-all cursor-pointer">
                    <Download size={16} /> Export CSV
                </button>
            </div>

            {loading && (
                <div className="flex items-center gap-2 text-sm text-accent-primary animate-pulse">
                    <Loader2 size={16} className="animate-spin" /> Updating…
                </div>
            )}

            {/* ── Metrics ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { label: 'Total Revenue',    value: fmtCurrency(summary.totalRevenue), bar: 'bg-blue-500',   sub: 'Paid orders only' },
                    { label: 'Total Orders',     value: summary.totalOrders,               bar: 'bg-green-500',  sub: 'Paid orders only' },
                    { label: 'Avg Order Value',  value: fmtCurrency(summary.aov),          bar: 'bg-purple-500', sub: 'Revenue per order' },
                    { label: 'Discount Impact',  value: fmtCurrency(summary.discount),     bar: 'bg-red-500',    sub: 'Total discounts given' },
                    { label: 'Tax Collected',    value: fmtCurrency(summary.tax),          bar: 'bg-indigo-500', sub: 'Total taxes' },
                    { label: 'Cancelled Orders', value: summary.cancelled,                 bar: 'bg-zinc-500',   sub: 'Rejected or cancelled' },
                ].map((m, i) => (
                    <Card key={i} className="relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-1 ${m.bar}`} />
                        <CardHeader className="pb-2 pt-5">
                            <CardTitle className="text-xs text-text-muted font-bold tracking-wider uppercase m-0">{m.label}</CardTitle>
                        </CardHeader>
                        <div className="px-6 pb-6">
                            <div className="text-3xl font-extrabold text-text-main mb-1">{m.value}</div>
                            <div className="text-xs text-text-muted">{m.sub}</div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* ── Revenue Chart + Breakdown ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Chart card */}
                <div className="lg:col-span-8">
                    <Card className="h-full">
                        <CardHeader>
                            <div className="flex items-baseline justify-between w-full">
                                <CardTitle className="m-0">{chartTitle()}</CardTitle>
                                <button
                                    onClick={openModalForFull}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-accent-primary bg-accent-primary/10 rounded-lg border-none cursor-pointer hover:bg-accent-primary/20 transition-colors"
                                >
                                    <Eye size={14} /> View Orders
                                </button>
                            </div>
                        </CardHeader>
                        <div className="px-6 pb-6">
                            <div style={chartContainerStyle}>
                                {summary.revenueHistory.length === 0 ? (
                                    <div style={{ color: '#A0AEC0', margin: 'auto' }}>No data available</div>
                                ) : (
                                    summary.revenueHistory.map((bar, i) => {
                                        const h = (bar.revenue / maxRev) * 100;
                                        return (
                                            <div
                                                key={i}
                                                className="oht-bar-group"
                                                style={chartBarGroupStyle}
                                                onClick={() => bar.dateStart && openModalForBar(bar)}
                                                title={`View orders for ${bar.label}`}
                                            >
                                                {/* Tooltip */}
                                                <div className="oht-bar-tooltip" style={{ ...chartTooltipStyle, opacity: 0 }}>
                                                    {fmtCurrency(bar.revenue)}<br />{bar.orders} orders
                                                </div>
                                                {/* Bar */}
                                                <div
                                                    className="oht-chart-bar"
                                                    style={{ ...chartBarBaseStyle, height: `${Math.max(h, 5)}%` }}
                                                />
                                                {/* Label */}
                                                <span style={chartLabelStyle}>{bar.label}</span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <p className="text-xs text-text-muted mt-2 text-center">Click any bar to view its orders</p>
                        </div>
                    </Card>
                </div>

                {/* Breakdown card */}
                <div className="lg:col-span-4">
                    <Card className="h-full">
                        <CardHeader><CardTitle>Order & Payment</CardTitle></CardHeader>
                        <div className="p-6 pt-0 space-y-8">
                            {/* Order Type */}
                            <div>
                                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Order Type</h4>
                                <div className="flex items-center gap-6">
                                    <div className="relative w-[110px] h-[110px] rounded-full flex items-center justify-center" style={{ background: `conic-gradient(#4C51BF 0% ${summary.dineInPercent}%, #E2E8F0 ${summary.dineInPercent}% 100%)`, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
                                        <div className="absolute" style={{ width: 82, height: 82, background: 'var(--color-surface, #fff)', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }} />
                                        <div className="z-10 flex flex-col items-center">
                                            <span className="font-bold text-lg text-text-main">{Math.round(summary.dineInPercent)}%</span>
                                            <span className="text-[11px] text-text-muted">Dine-in</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2 text-sm text-text-main"><div className="w-2.5 h-2.5 rounded-full" style={{ background: '#4C51BF' }} /> Dine-in</div>
                                        <div className="flex items-center gap-2 text-sm text-text-main"><div className="w-2.5 h-2.5 rounded-full" style={{ background: '#E2E8F0' }} /> Takeaway</div>
                                    </div>
                                </div>
                            </div>
                            {/* Payment Method */}
                            <div>
                                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Payment Method</h4>
                                <div className="flex items-center gap-6">
                                    <div className="relative w-[110px] h-[110px] rounded-full flex items-center justify-center" style={{ background: `conic-gradient(#48BB78 0% ${summary.onlinePercent}%, #E2E8F0 ${summary.onlinePercent}% 100%)`, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
                                        <div className="absolute" style={{ width: 82, height: 82, background: 'var(--color-surface, #fff)', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }} />
                                        <div className="z-10 flex flex-col items-center">
                                            <span className="font-bold text-lg text-text-main">{Math.round(summary.onlinePercent)}%</span>
                                            <span className="text-[11px] text-text-muted">Online</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2 text-sm text-text-main"><div className="w-2.5 h-2.5 rounded-full" style={{ background: '#48BB78' }} /> Online</div>
                                        <div className="flex items-center gap-2 text-sm text-text-main"><div className="w-2.5 h-2.5 rounded-full" style={{ background: '#E2E8F0' }} /> Cash</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* ── Top Items + Heatmap ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Items */}
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <div className="flex items-center justify-between w-full">
                            <CardTitle className="m-0">Top Selling Items</CardTitle>
                            <button onClick={() => setShowAllItems(true)} className="text-xs font-bold text-accent-primary bg-accent-primary/10 px-3 py-1.5 rounded-lg border-none cursor-pointer hover:bg-accent-primary/20 transition-colors">View All</button>
                        </div>
                    </CardHeader>
                    <div className="flex-1 overflow-x-auto px-4 pb-4">
                        <table className="w-full text-sm text-left" style={{ borderCollapse: 'separate', borderSpacing: '0 8px', fontFamily: 'inherit' }}>
                            <thead>
                                <tr className="text-text-muted">
                                    <th className="pb-2 font-semibold px-4 border-b border-border" style={{ fontSize: 13 }}>Item</th>
                                    <th className="pb-2 font-semibold px-4 border-b border-border text-right" style={{ fontSize: 13 }}>Sold</th>
                                    <th className="pb-2 font-semibold px-4 border-b border-border text-right" style={{ fontSize: 13 }}>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topItems.length === 0 ? (
                                    <tr><td colSpan={3} className="text-center py-8 text-text-muted">No items sold</td></tr>
                                ) : topItems.slice(0, 5).map((item, i) => (
                                    <tr key={i} className="hover:bg-surface-hover/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-text-main">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: i === 0 ? '#FEFCBF' : i === 1 ? '#E2E8F0' : i === 2 ? '#FEEBC8' : '#F7FAFC', color: i === 0 ? '#B7791F' : i === 1 ? '#4A5568' : i === 2 ? '#C05621' : '#718096' }}>#{i+1}</span>
                                                {item.name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">{item.sold}</td>
                                        <td className="px-4 py-3 text-right font-semibold">{fmtCurrency(item.revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Heatmap */}
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Peak Hour Heatmap</CardTitle>
                        <span className="text-xs text-text-muted">Orders by day & hour (6a–11p)</span>
                    </CardHeader>
                    <div className="p-6 pt-0 overflow-x-auto">
                        <div style={{ minWidth: 520 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 4 }}>
                                <div style={{ width: 32, flexShrink: 0 }} />
                                {HOUR_LABELS.map((hl, i) => (
                                    <div key={i} style={{ flex: 1, minWidth: 20, textAlign: 'center', fontSize: 10, color: '#A0AEC0' }}>{hl}</div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {DAYS.map((day, di) => (
                                    <div key={di} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <div style={{ width: 32, flexShrink: 0, fontSize: 11, fontWeight: 600, color: '#718096', textAlign: 'right' }}>{day}</div>
                                        {HOURS.map((h, hi) => {
                                            const count = summary.peakData[di]?.[h] || 0;
                                            return (
                                                <div key={hi}
                                                    style={{ flex: 1, minWidth: 20, height: 22, borderRadius: 4, backgroundColor: heatColor(count, peakMax), cursor: 'default', transition: 'transform 0.15s, box-shadow 0.15s' }}
                                                    title={`${day} ${HOUR_LABELS[hi]}: ${count} order${count !== 1 ? 's' : ''}`}
                                                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.25)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(76,81,191,0.35)'; e.currentTarget.style.zIndex = 1; e.currentTarget.style.position = 'relative'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                                                />
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                                <span style={{ fontSize: 11, color: '#A0AEC0' }}>Low</span>
                                {['#F0F4F8', '#C3DAFE', '#7F9CF5', '#4C51BF', '#312E81'].map((c, i) => (
                                    <div key={i} style={{ width: 18, height: 18, borderRadius: 3, backgroundColor: c }} />
                                ))}
                                <span style={{ fontSize: 11, color: '#A0AEC0' }}>High</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* ── Recent Orders Table ── */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between w-full">
                        <CardTitle className="m-0">Recent Orders</CardTitle>
                        <button onClick={openModalForFull} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-accent-primary bg-accent-primary/10 rounded-lg border-none cursor-pointer hover:bg-accent-primary/20 transition-colors">
                            <Eye size={14} /> View All
                        </button>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-text-muted uppercase tracking-wider bg-surface-hover">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Order #</th>
                                <th className="px-6 py-4 font-semibold">Date & Time</th>
                                <th className="px-6 py-4 font-semibold">Type</th>
                                <th className="px-6 py-4 font-semibold">Table</th>
                                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Payment</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {orders.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-12 text-text-muted">No orders found in this period.</td></tr>
                            ) : orders.slice(0, 10).map(o => (
                                <tr key={o.id} className="hover:bg-surface-hover/50 transition-colors">
                                    <td className="px-6 py-4 font-mono font-semibold" style={{ color: '#4C51BF' }}>#{o.order_number || o.id.slice(0, 8)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-text-muted">{new Date(o.created_at).toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-4 capitalize">{o.type?.replace('_', ' ')}</td>
                                    <td className="px-6 py-4">{o.table_number || '—'}</td>
                                    <td className="px-6 py-4 text-right font-semibold text-text-main">{fmtCurrency(o.total)}</td>
                                    <td className="px-6 py-4"><Badge variant={o.status === 'completed' || o.status === 'served' ? 'success' : o.status === 'cancelled' ? 'error' : 'warning'}>{o.status}</Badge></td>
                                    <td className="px-6 py-4"><Badge variant="secondary">{methodLabel(o.payment_method)}</Badge></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* ── Feedback ── */}
            {feedback.length > 0 && (
                <Card>
                    <CardHeader><CardTitle>Recent Feedback</CardTitle></CardHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 pt-0">
                        {feedback.map(fb => (
                            <div key={fb.id} className="p-4 rounded-xl bg-surface-hover border border-border">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="font-semibold text-text-main">{fb.customerName}</div>
                                    <div className="text-yellow-500 text-sm">{'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}</div>
                                </div>
                                <div className="text-xs text-text-muted mb-2">{new Date(fb.createdAt).toLocaleDateString()}</div>
                                {fb.comment   && <p className="text-sm text-text-main mb-2 line-clamp-3">"{fb.comment}"</p>}
                                {fb.orderItems && <div className="text-[10px] text-text-muted bg-surface px-2 py-1 rounded">Items: {fb.orderItems}</div>}
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* ── All Items Modal ── */}
            {showAllItems && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowAllItems(false)}>
                    <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl border border-border flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-border">
                            <div>
                                <h2 className="text-xl font-bold text-text-main m-0">All Selling Items</h2>
                                <p className="text-sm text-text-muted m-0 mt-1">Performance breakdown for the selected period</p>
                            </div>
                            <button onClick={() => setShowAllItems(false)} className="p-2 hover:bg-surface-hover rounded-xl text-text-muted border-none bg-transparent cursor-pointer"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="text-text-muted border-b border-border">
                                        <th className="pb-3 font-semibold">Rank</th>
                                        <th className="pb-3 font-semibold">Item Name</th>
                                        <th className="pb-3 font-semibold text-right">Sold</th>
                                        <th className="pb-3 font-semibold text-right">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topItems.map((item, i) => (
                                        <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-surface-hover/50">
                                            <td className="py-3 pr-4">
                                                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: i === 0 ? '#FEFCBF' : i === 1 ? '#E2E8F0' : i === 2 ? '#FEEBC8' : '#F7FAFC', color: i === 0 ? '#B7791F' : i === 1 ? '#4A5568' : i === 2 ? '#C05621' : '#718096' }}>#{i+1}</span>
                                            </td>
                                            <td className="py-3 font-medium text-text-main">{item.name}</td>
                                            <td className="py-3 text-right">{item.sold}</td>
                                            <td className="py-3 text-right font-semibold">{fmtCurrency(item.revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Orders Modal ── */}
            {ordersModal && (
                <OrdersModal
                    restaurantId={restaurantId}
                    startDate={ordersModal.start}
                    endDate={ordersModal.end}
                    periodLabel={ordersModal.label}
                    onClose={() => setOrdersModal(null)}
                />
            )}
        </div>
    );
}
