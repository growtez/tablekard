import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CreditCard, Search, Filter, SlidersHorizontal, Calendar, Store, Clock, ArrowUpRight } from 'lucide-react';

const STATUS_VARIANTS = { paid: 'success', pending: 'warning', failed: 'error' };

export default function Subscriptions({ setSyncAction }) {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('newest');

    // Summary stats
    const [summary, setSummary] = useState({ total: 0, paid: 0, pending: 0, failed: 0, totalRevenue: 0 });

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: rows, error: err } = await supabase
                .from('subscription_payments')
                .select(`
                    id, plan_duration, amount, currency, status,
                    razorpay_order_id, razorpay_payment_id,
                    paid_at, starts_at, ends_at, created_at,
                    restaurant_id,
                    restaurants(id, name, slug, subscription_type),
                    profiles:user_id(email, name)
                `)
                .order('created_at', { ascending: false });

            if (err) throw err;
            const r = rows || [];

            // ── Authoritative 6-hour auto-cancel (super-admin only, service role key) ──
            // Find all pending payments older than 6 hours and mark them failed in the DB.
            const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
            const staleIds = r
                .filter(x => x.status === 'pending' && x.created_at < sixHoursAgo)
                .map(x => x.id);

            if (staleIds.length > 0) {
                const { error: updateErr } = await supabase
                    .from('subscription_payments')
                    .update({ status: 'failed' })
                    .in('id', staleIds)
                    .eq('status', 'pending'); // guard: only update if still pending
                if (updateErr) console.error('Auto-cancel write failed:', updateErr.message);
                // Apply the change locally so UI reflects it immediately without a second fetch
                staleIds.forEach(id => {
                    const row = r.find(x => x.id === id);
                    if (row) row.status = 'failed';
                });
            }

            setData(r);
            setSummary({
                total: r.length,
                paid: r.filter(x => x.status === 'paid').length,
                pending: r.filter(x => x.status === 'pending').length,
                failed: r.filter(x => x.status === 'failed').length,
                totalRevenue: r.filter(x => x.status === 'paid').reduce((s, x) => s + Number(x.amount || 0), 0),
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        if (setSyncAction) setSyncAction({ onSync: fetchData, loading });
    }, [loading, setSyncAction]);

    const filtered = data
        .filter(row => {
            const matchSearch = !search ||
                row.restaurants?.name?.toLowerCase().includes(search.toLowerCase()) ||
                row.restaurants?.slug?.toLowerCase().includes(search.toLowerCase()) ||
                row.razorpay_payment_id?.toLowerCase().includes(search.toLowerCase());
            const matchStatus = filterStatus === 'all' || row.status === filterStatus;
            return matchSearch && matchStatus;
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
            if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
            if (sortBy === 'amount') return Number(b.amount) - Number(a.amount);
            return 0;
        });

    const formatDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="animate-fade-in space-y-6">
            {/* Summary Cards */}
            <div className="subscriptions-summary-grid">
                {[
                    { label: 'Total Records', value: summary.total, color: '#3b82f6' },
                    { label: 'Paid', value: summary.paid, color: '#10b981' },
                    { label: 'Pending', value: summary.pending, color: '#f59e0b' },
                    { label: 'Failed', value: summary.failed, color: '#ef4444' },
                    { label: 'Total Collected', value: `₹${summary.totalRevenue.toLocaleString()}`, color: 'var(--accent-primary)' },
                ].map(item => (
                    <div key={item.label} className="premium-card" style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{item.label}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: item.color }}>{loading ? '—' : item.value}</div>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <Card>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                        <input
                            type="text"
                            placeholder="Search restaurant or payment ID..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ width: '100%', padding: '10px 10px 10px 38px', background: 'var(--surface-hover)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'white', fontSize: '0.875rem' }}
                        />
                    </div>
                    <div className="dropdown-wrapper">
                        <button className="btn-ghost" style={{ padding: '10px 14px', borderRadius: '10px', background: filterStatus !== 'all' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${filterStatus !== 'all' ? 'var(--accent-primary)' : 'var(--border-color)'}`, gap: '6px', fontSize: '0.85rem', color: filterStatus !== 'all' ? 'var(--accent-primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                            <Filter size={16} /> {filterStatus === 'all' ? 'Status' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                        </button>
                        <div className="dropdown-content">
                            {['all', 'paid', 'pending', 'failed'].map(s => (
                                <button key={s} onClick={() => setFilterStatus(s)} className={filterStatus === s ? 'active' : ''}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
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

            {/* Table */}
            <div className="table-container">
                <table className="premium-table">
                    <thead>
                        <tr>
                            <th>Restaurant</th>
                            <th>Plan</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Duration</th>
                            <th>Validity</th>
                            <th>Created</th>
                            <th>Payment ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '4rem' }}>
                                <div className="loader" style={{ margin: '0 auto' }} />
                                <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading subscription records...</p>
                            </td></tr>
                        ) : error ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>{error}</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No subscription records found.</td></tr>
                        ) : filtered.map(row => (
                            <tr key={row.id} onClick={() => navigate(`/subscriptions/${row.id}`)} style={{ cursor: 'pointer' }} className="clickable-row">
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div className="user-avatar" style={{ borderRadius: '8px', fontSize: '0.8rem', width: '32px', height: '32px' }}>
                                            {row.restaurants?.name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{row.restaurants?.name || 'Unknown'}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/{row.restaurants?.slug}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                                        {row.restaurants?.subscription_type || 'Standard'}
                                    </span>
                                </td>
                                <td>
                                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>₹{Number(row.amount).toLocaleString()}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '4px' }}>{row.currency}</span>
                                </td>
                                <td>
                                    <Badge variant={STATUS_VARIANTS[row.status] || 'default'}>{row.status?.toUpperCase()}</Badge>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                        <Clock size={12} style={{ opacity: 0.6 }} />
                                        {row.plan_duration} days
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '0.78rem', lineHeight: 1.6 }}>
                                        <div style={{ color: 'var(--text-muted)' }}>From: {formatDate(row.starts_at)}</div>
                                        <div style={{ color: row.ends_at && new Date(row.ends_at) < new Date() ? '#ef4444' : 'var(--text-main)' }}>
                                            To: {formatDate(row.ends_at)}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(row.created_at)}</div>
                                </td>
                                <td>
                                    <code style={{ fontSize: '0.7rem', opacity: 0.6, background: 'var(--surface-hover)', padding: '2px 6px', borderRadius: '4px' }}>
                                        {row.razorpay_payment_id ? row.razorpay_payment_id.slice(0, 14) + '…' : '—'}
                                    </code>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
