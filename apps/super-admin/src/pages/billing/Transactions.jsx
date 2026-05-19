import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Search, Filter, SlidersHorizontal, Store, Hash } from 'lucide-react';

// DATA SOURCES:
// 1. payments table  → online (Razorpay) payments, may or may not have order_id
// 2. orders table    → cash/card (pay-at-counter) orders (payment_method = 'cash'|'card')
//    cash/card orders never create a payments row — tracked directly on orders
//
// We fetch both and merge into a normalised list.

const STATUS_VARIANTS = { paid: 'success', pending: 'warning', failed: 'error', refunded: 'info', completed: 'success' };

const normalisePayment = (row) => ({
    _id: row.id,
    _source: 'payments',
    order_number: row.orders?.order_number || null,
    order_type: row.orders?.type || null,
    restaurant_name: row.restaurants?.name || 'Unknown',
    restaurant_slug: row.restaurants?.slug || '',
    amount: Number(row.amount || 0),
    currency: row.currency || 'INR',
    status: row.status,
    gateway: 'Razorpay',
    gateway_color: '#1e40af',
    razorpay_payment_id: row.razorpay_payment_id || null,
    failure_reason: row.failure_reason || null,
    date: row.paid_at || row.created_at,
});

const normaliseOrder = (row) => ({
    _id: row.id,
    _source: 'orders',
    order_number: row.order_number,
    order_type: row.type,
    restaurant_name: row.restaurants?.name || 'Unknown',
    restaurant_slug: row.restaurants?.slug || '',
    amount: Number(row.total || 0),
    currency: 'INR',
    status: row.payment_status,
    gateway: 'Pay at Counter',
    gateway_color: '#92400e',
    razorpay_payment_id: null,
    failure_reason: null,
    date: row.updated_at || row.created_at,
});

export default function Transactions({ setSyncAction }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterGateway, setFilterGateway] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [summary, setSummary] = useState({ total: 0, paid: 0, totalAmount: 0, refunded: 0 });

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Online payments (Razorpay)
            const { data: payments, error: pErr } = await supabase
                .from('payments')
                .select(`
                    id, amount, currency, method, gateway,
                    status, razorpay_payment_id,
                    failure_reason, paid_at, created_at,
                    order_id,
                    restaurants(name, slug),
                    orders(order_number, type)
                `)
                .order('created_at', { ascending: false });
            if (pErr) throw pErr;

            // 2. Cash/card orders (pay at counter) — exclude orders that already have a payments row
            const { data: cashOrders, error: oErr } = await supabase
                .from('orders')
                .select(`
                    id, order_number, type, payment_method,
                    payment_status, total, created_at, updated_at,
                    restaurants(name, slug)
                `)
                .in('payment_method', ['cash', 'card'])
                .order('created_at', { ascending: false });
            if (oErr) throw oErr;

            // Exclude cash orders that somehow already have a payments entry (edge case)
            const onlineOrderIds = new Set((payments || []).map(p => p.order_id).filter(Boolean));
            const filteredCash = (cashOrders || []).filter(o => !onlineOrderIds.has(o.id));

            const merged = [
                ...(payments || []).map(normalisePayment),
                ...filteredCash.map(normaliseOrder),
            ].sort((a, b) => new Date(b.date) - new Date(a.date));

            setData(merged);
            setSummary({
                total: merged.length,
                paid: merged.filter(x => x.status === 'paid' || x.status === 'completed').length,
                totalAmount: merged.filter(x => x.status === 'paid' || x.status === 'completed').reduce((s, x) => s + x.amount, 0),
                refunded: merged.filter(x => x.status === 'refunded').length,
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { if (setSyncAction) setSyncAction({ onSync: fetchData, loading }); }, [loading, setSyncAction]);

    const filtered = data.filter(row => {
        const ms = !search ||
            row.restaurant_name?.toLowerCase().includes(search.toLowerCase()) ||
            row.razorpay_payment_id?.toLowerCase().includes(search.toLowerCase()) ||
            row.order_number?.toLowerCase().includes(search.toLowerCase());
        const ms2 = filterStatus === 'all' || row.status === filterStatus;
        const ms3 = filterGateway === 'all' ||
            (filterGateway === 'razorpay' && row.gateway === 'Razorpay') ||
            (filterGateway === 'counter' && row.gateway === 'Pay at Counter');
        return ms && ms2 && ms3;
    }).sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.date) - new Date(a.date);
        if (sortBy === 'oldest') return new Date(a.date) - new Date(b.date);
        if (sortBy === 'amount') return b.amount - a.amount;
        return 0;
    });

    const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="animate-fade-in space-y-6">
            {/* Summary */}
            <div className="subscriptions-summary-grid">
                {[
                    { label: 'Total Transactions', value: summary.total, color: '#1e40af' },
                    { label: 'Successful', value: summary.paid, color: '#065f46' },
                    { label: 'Revenue Collected', value: `₹${summary.totalAmount.toLocaleString()}`, color: 'var(--accent-primary)' },
                    { label: 'Refunded', value: summary.refunded, color: '#92400e' },
                ].map(item => (
                    <div key={item.label} className="premium-card" style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{item.label}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: item.color }}>{loading ? '—' : item.value}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <Card>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                        <input type="text" placeholder="Search restaurant, order #, or payment ID..." value={search} onChange={e => setSearch(e.target.value)}
                            style={{ width: '100%', padding: '10px 10px 10px 38px', background: 'var(--surface-hover)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.875rem' }} />
                    </div>

                    <div className="dropdown-wrapper">
                        <button className="btn-ghost" style={{ padding: '10px 14px', borderRadius: '10px', background: filterStatus !== 'all' ? 'rgba(59,130,246,0.1)' : 'var(--surface-hover)', border: `1px solid ${filterStatus !== 'all' ? 'var(--accent-primary)' : 'var(--border-color)'}`, gap: '6px', fontSize: '0.85rem', color: filterStatus !== 'all' ? 'var(--accent-primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                            <Filter size={16} /> {filterStatus === 'all' ? 'Status' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                        </button>
                        <div className="dropdown-content">
                            {['all', 'paid', 'pending', 'failed', 'refunded'].map(s => (
                                <button key={s} onClick={() => setFilterStatus(s)} className={filterStatus === s ? 'active' : ''}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
                            ))}
                        </div>
                    </div>

                    <div className="dropdown-wrapper">
                        <button className="btn-ghost" style={{ padding: '10px 14px', borderRadius: '10px', background: filterGateway !== 'all' ? 'rgba(245,158,11,0.1)' : 'var(--surface-hover)', border: `1px solid ${filterGateway !== 'all' ? '#92400e' : 'var(--border-color)'}`, gap: '6px', fontSize: '0.85rem', color: filterGateway !== 'all' ? '#92400e' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                            <Store size={16} /> {filterGateway === 'all' ? 'Gateway' : filterGateway === 'razorpay' ? 'Razorpay' : 'Pay at Counter'}
                        </button>
                        <div className="dropdown-content">
                            <button onClick={() => setFilterGateway('all')} className={filterGateway === 'all' ? 'active' : ''}>All Gateways</button>
                            <button onClick={() => setFilterGateway('razorpay')} className={filterGateway === 'razorpay' ? 'active' : ''}>Razorpay</button>
                            <button onClick={() => setFilterGateway('counter')} className={filterGateway === 'counter' ? 'active' : ''}>Pay at Counter</button>
                        </div>
                    </div>

                    <div className="dropdown-wrapper">
                        <button className="btn-ghost" style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--surface-hover)', border: '1px solid var(--border-color)', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                            <SlidersHorizontal size={16} /> Sort
                        </button>
                        <div className="dropdown-content">
                            <button onClick={() => setSortBy('newest')} className={sortBy === 'newest' ? 'active' : ''}>Newest First</button>
                            <button onClick={() => setSortBy('oldest')} className={sortBy === 'oldest' ? 'active' : ''}>Oldest First</button>
                            <button onClick={() => setSortBy('amount')} className={sortBy === 'amount' ? 'active' : ''}>Highest Amount</button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Table */}
            <div className="table-container">
                <table className="premium-table">
                    <thead>
                        <tr>
                            <th>Restaurant</th>
                            <th>Order #</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Gateway</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '4rem' }}><div className="loader" style={{ margin: '0 auto' }} /></td></tr>
                        ) : error ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>{error}</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No transactions found.</td></tr>
                        ) : filtered.map(row => (
                            <tr key={`${row._source}-${row._id}`}>
                                <td>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{row.restaurant_name}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/{row.restaurant_slug}</div>
                                </td>
                                <td>
                                    {row.order_number ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Hash size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                            <div>
                                                <div style={{ fontSize: '0.82rem', fontWeight: 600, fontFamily: 'monospace' }}>{row.order_number}</div>
                                                {row.order_type && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{row.order_type.replace('_', ' ')}</div>}
                                            </div>
                                        </div>
                                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
                                </td>
                                <td>
                                    <span style={{ fontWeight: 700 }}>₹{row.amount.toLocaleString()}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '4px' }}>{row.currency}</span>
                                </td>
                                <td>
                                    <Badge variant={STATUS_VARIANTS[row.status] || 'default'}>{row.status?.toUpperCase()}</Badge>
                                    {row.failure_reason && (
                                        <div style={{ fontSize: '0.65rem', color: '#991b1b', marginTop: '3px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.failure_reason}>{row.failure_reason}</div>
                                    )}
                                </td>
                                <td>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: row.gateway_color, background: `${row.gateway_color}15`, padding: '3px 8px', borderRadius: '6px', border: `1px solid ${row.gateway_color}30`, whiteSpace: 'nowrap' }}>
                                        {row.gateway}
                                    </span>
                                    {row.razorpay_payment_id && (
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '3px', fontFamily: 'monospace' }}>{row.razorpay_payment_id.slice(0, 14)}…</div>
                                    )}
                                </td>
                                <td><span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{fmt(row.date)}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
