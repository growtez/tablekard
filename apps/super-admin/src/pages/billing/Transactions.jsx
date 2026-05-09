import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Search, Filter, SlidersHorizontal, Store, Hash } from 'lucide-react';

// payments.method enum: cash | card | upi | netbanking | wallet | online
// payments.gateway TEXT: null/'cash'/'card' = pay at counter, 'razorpay' = online
const STATUS_VARIANTS = { paid: 'success', pending: 'warning', failed: 'error', refunded: 'info' };

const getGatewayLabel = (row) => {
    if (row.gateway === 'razorpay') return { label: 'Razorpay', color: '#3b82f6' };
    if (['upi', 'netbanking', 'wallet', 'online'].includes(row.method)) return { label: 'Razorpay', color: '#3b82f6' };
    return { label: 'Pay at Counter', color: '#f59e0b' };
};

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
            const { data: rows, error: err } = await supabase
                .from('payments')
                .select(`
                    id, amount, currency, method, gateway,
                    status, razorpay_payment_id,
                    failure_reason, paid_at, created_at,
                    restaurant_id, order_id,
                    restaurants(name, slug),
                    orders(order_number, type)
                `)
                .order('created_at', { ascending: false });

            if (err) throw err;
            const r = rows || [];
            setData(r);
            setSummary({
                total: r.length,
                paid: r.filter(x => x.status === 'paid').length,
                totalAmount: r.filter(x => x.status === 'paid').reduce((s, x) => s + Number(x.amount || 0), 0),
                refunded: r.filter(x => x.status === 'refunded').length,
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { if (setSyncAction) setSyncAction({ onSync: fetchData, loading }); }, [loading, setSyncAction]);

    const filtered = data
        .filter(row => {
            const gw = getGatewayLabel(row).label;
            const ms = !search ||
                row.restaurants?.name?.toLowerCase().includes(search.toLowerCase()) ||
                row.razorpay_payment_id?.toLowerCase().includes(search.toLowerCase()) ||
                row.orders?.order_number?.toLowerCase().includes(search.toLowerCase());
            const ms2 = filterStatus === 'all' || row.status === filterStatus;
            const ms3 = filterGateway === 'all' ||
                (filterGateway === 'razorpay' && gw === 'Razorpay') ||
                (filterGateway === 'counter' && gw === 'Pay at Counter');
            return ms && ms2 && ms3;
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
            if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
            if (sortBy === 'amount') return Number(b.amount) - Number(a.amount);
            return 0;
        });

    const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="animate-fade-in space-y-6">
            {/* Summary */}
            <div className="subscriptions-summary-grid">
                {[
                    { label: 'Total Transactions', value: summary.total, color: '#3b82f6' },
                    { label: 'Successful', value: summary.paid, color: '#10b981' },
                    { label: 'Revenue Collected', value: `₹${summary.totalAmount.toLocaleString()}`, color: 'var(--accent-primary)' },
                    { label: 'Refunded', value: summary.refunded, color: '#f59e0b' },
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
                        <input type="text" placeholder="Search restaurant, order #, or payment ID..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 38px', background: 'var(--surface-hover)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'white', fontSize: '0.875rem' }} />
                    </div>

                    {/* Status */}
                    <div className="dropdown-wrapper">
                        <button className="btn-ghost" style={{ padding: '10px 14px', borderRadius: '10px', background: filterStatus !== 'all' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${filterStatus !== 'all' ? 'var(--accent-primary)' : 'var(--border-color)'}`, gap: '6px', fontSize: '0.85rem', color: filterStatus !== 'all' ? 'var(--accent-primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                            <Filter size={16} /> {filterStatus === 'all' ? 'Status' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                        </button>
                        <div className="dropdown-content">
                            {['all', 'paid', 'pending', 'failed', 'refunded'].map(s => (
                                <button key={s} onClick={() => setFilterStatus(s)} className={filterStatus === s ? 'active' : ''}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
                            ))}
                        </div>
                    </div>

                    {/* Gateway */}
                    <div className="dropdown-wrapper">
                        <button className="btn-ghost" style={{ padding: '10px 14px', borderRadius: '10px', background: filterGateway !== 'all' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${filterGateway !== 'all' ? '#f59e0b' : 'var(--border-color)'}`, gap: '6px', fontSize: '0.85rem', color: filterGateway !== 'all' ? '#f59e0b' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                            <Store size={16} /> {filterGateway === 'all' ? 'Gateway' : filterGateway === 'razorpay' ? 'Razorpay' : 'Pay at Counter'}
                        </button>
                        <div className="dropdown-content">
                            <button onClick={() => setFilterGateway('all')} className={filterGateway === 'all' ? 'active' : ''}>All Gateways</button>
                            <button onClick={() => setFilterGateway('razorpay')} className={filterGateway === 'razorpay' ? 'active' : ''}>Razorpay</button>
                            <button onClick={() => setFilterGateway('counter')} className={filterGateway === 'counter' ? 'active' : ''}>Pay at Counter</button>
                        </div>
                    </div>

                    {/* Sort */}
                    <div className="dropdown-wrapper">
                        <button className="btn-ghost" style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
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

            {/* Table — 6 columns: Restaurant, Order #, Amount, Status, Gateway, Date */}
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
                        ) : filtered.map(row => {
                            const gw = getGatewayLabel(row);
                            return (
                                <tr key={row.id}>
                                    {/* Restaurant */}
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{row.restaurants?.name || 'Unknown'}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/{row.restaurants?.slug}</div>
                                    </td>

                                    {/* Order # — shown for both cash and online orders */}
                                    <td>
                                        {row.orders?.order_number ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <Hash size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                                <div>
                                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, fontFamily: 'monospace' }}>{row.orders.order_number}</div>
                                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{row.orders.type?.replace('_', ' ')}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                                        )}
                                    </td>

                                    {/* Amount */}
                                    <td>
                                        <span style={{ fontWeight: 700 }}>₹{Number(row.amount).toLocaleString()}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '4px' }}>{row.currency}</span>
                                    </td>

                                    {/* Status + failure reason */}
                                    <td>
                                        <Badge variant={STATUS_VARIANTS[row.status] || 'default'}>{row.status?.toUpperCase()}</Badge>
                                        {row.failure_reason && (
                                            <div style={{ fontSize: '0.65rem', color: '#ef4444', marginTop: '3px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.failure_reason}>{row.failure_reason}</div>
                                        )}
                                    </td>

                                    {/* Gateway pill — Pay at Counter (amber) or Razorpay (blue) */}
                                    <td>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: gw.color, background: `${gw.color}15`, padding: '3px 8px', borderRadius: '6px', border: `1px solid ${gw.color}30`, whiteSpace: 'nowrap' }}>
                                            {gw.label}
                                        </span>
                                        {row.razorpay_payment_id && (
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '3px', fontFamily: 'monospace' }}>{row.razorpay_payment_id.slice(0, 14)}…</div>
                                        )}
                                    </td>

                                    {/* Date — prefer paid_at, fall back to created_at */}
                                    <td><span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{fmt(row.paid_at || row.created_at)}</span></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
