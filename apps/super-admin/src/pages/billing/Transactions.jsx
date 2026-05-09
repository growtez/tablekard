import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';

const STATUS_VARIANTS = { paid: 'success', pending: 'warning', failed: 'error', refunded: 'info' };
const METHOD_LABELS = { cash: 'Cash', card: 'Card', upi: 'UPI', netbanking: 'Net Banking', wallet: 'Wallet', online: 'Online' };

export default function Transactions({ setSyncAction }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [summary, setSummary] = useState({ total: 0, paid: 0, totalAmount: 0, refunded: 0 });

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: rows, error: err } = await supabase
                .from('payments')
                .select(`
                    id, amount, currency, method, gateway, status,
                    razorpay_order_id, razorpay_payment_id,
                    webhook_verified, failure_reason, paid_at, created_at,
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
            const ms = !search || row.restaurants?.name?.toLowerCase().includes(search.toLowerCase()) || row.razorpay_payment_id?.toLowerCase().includes(search.toLowerCase()) || row.orders?.order_number?.toLowerCase().includes(search.toLowerCase());
            const ms2 = filterStatus === 'all' || row.status === filterStatus;
            return ms && ms2;
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

            <Card>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                        <input type="text" placeholder="Search restaurant, order, or payment ID..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 38px', background: 'var(--surface-hover)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'white', fontSize: '0.875rem' }} />
                    </div>
                    <div className="dropdown-wrapper">
                        <button className="btn-ghost" style={{ padding: '10px 14px', borderRadius: '10px', background: filterStatus !== 'all' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${filterStatus !== 'all' ? 'var(--accent-primary)' : 'var(--border-color)'}`, gap: '6px', fontSize: '0.85rem', color: filterStatus !== 'all' ? 'var(--accent-primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                            <Filter size={16} /> {filterStatus === 'all' ? 'Status' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                        </button>
                        <div className="dropdown-content">
                            {['all', 'paid', 'pending', 'failed', 'refunded'].map(s => (
                                <button key={s} onClick={() => setFilterStatus(s)} className={filterStatus === s ? 'active' : ''}>{s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
                            ))}
                        </div>
                    </div>
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

            <div className="table-container">
                <table className="premium-table">
                    <thead>
                        <tr>
                            <th>Restaurant</th>
                            <th>Order</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Status</th>
                            <th>Gateway</th>
                            <th>Verified</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '4rem' }}><div className="loader" style={{ margin: '0 auto' }} /></td></tr>
                        ) : error ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>{error}</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No transactions found.</td></tr>
                        ) : filtered.map(row => (
                            <tr key={row.id}>
                                <td>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{row.restaurants?.name || 'Unknown'}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/{row.restaurants?.slug}</div>
                                </td>
                                <td>
                                    {row.orders ? (
                                        <div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>#{row.orders.order_number}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{row.orders.type?.replace('_', ' ')}</div>
                                        </div>
                                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
                                </td>
                                <td><span style={{ fontWeight: 700 }}>₹{Number(row.amount).toLocaleString()}</span></td>
                                <td><span style={{ fontSize: '0.8rem' }}>{METHOD_LABELS[row.method] || row.method || '—'}</span></td>
                                <td><Badge variant={STATUS_VARIANTS[row.status] || 'default'}>{row.status?.toUpperCase()}</Badge></td>
                                <td><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.gateway || 'Razorpay'}</span></td>
                                <td>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: row.webhook_verified ? '#10b981' : '#ef4444', margin: '0 auto' }} title={row.webhook_verified ? 'Verified' : 'Not verified'} />
                                </td>
                                <td><span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{fmt(row.created_at)}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
