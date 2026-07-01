import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Search, MessageSquare, Star } from 'lucide-react';
import { CardListSkeleton } from '../../components/ui/Skeleton';

// Uses: feedback (id, order_id, user_id, rating, comment, created_at)
// joins: orders -> restaurants, profiles (user_id)
export default function Complaints({ setSyncAction }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filterRating, setFilterRating] = useState('all');

    const fetchData = async () => {
        setLoading(true); setError(null);
        try {
            const { data: rows, error: err } = await supabase
                .from('feedback')
                .select(`id, rating, comment, created_at,
                    orders(order_number, restaurants(name)),
                    profiles:user_id(name, email)`)
                .order('created_at', { ascending: false });
            if (err) throw err;
            setData(rows || []);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { if (setSyncAction) setSyncAction({ onSync: fetchData, loading }); }, [loading, setSyncAction]);

    const avgRating = data.length ? (data.reduce((s, r) => s + r.rating, 0) / data.length).toFixed(1) : null;

    const filtered = data.filter(row => {
        const ms = !search || row.comment?.toLowerCase().includes(search.toLowerCase()) || row.profiles?.name?.toLowerCase().includes(search.toLowerCase()) || row.orders?.restaurants?.name?.toLowerCase().includes(search.toLowerCase());
        return ms && (filterRating === 'all' || String(row.rating) === filterRating);
    });

    const getRatingColor = r => r >= 4 ? '#065f46' : r >= 3 ? '#92400e' : '#991b1b';

    return (
        <div className="animate-fade-in space-y-6">
            <div className="subscriptions-summary-grid">
                {[
                    { label: 'Total Feedback', value: data.length, color: '#1e40af' },
                    { label: 'Avg Rating', value: avgRating ? `${avgRating} ★` : '—', color: '#92400e' },
                    { label: 'Low Ratings (≤2)', value: data.filter(r => r.rating <= 2).length, color: '#991b1b' },
                    { label: '5-Star Reviews', value: data.filter(r => r.rating === 5).length, color: '#065f46' },
                ].map(item => (
                    <div key={item.label} className="premium-card" style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{item.label}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: item.color }}>{loading ? '—' : item.value}</div>
                    </div>
                ))}
            </div>

            <Card>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                        <input type="text" placeholder="Search by comment, customer, or restaurant..." value={search} onChange={e => setSearch(e.target.value)} className="w-full py-2 pl-9 pr-3 bg-surface-hover border border-border rounded-xl text-text-main text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all" />
                    </div>
                    <div className="dropdown-wrapper">
                        <button className="btn-ghost" style={{ padding: '10px 14px', borderRadius: '10px', background: filterRating !== 'all' ? 'rgba(59,130,246,0.1)' : 'var(--surface-hover)', border: `1px solid ${filterRating !== 'all' ? 'var(--accent-primary)' : 'var(--border-color)'}`, gap: '6px', fontSize: '0.85rem', color: filterRating !== 'all' ? 'var(--accent-primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                            <Star size={16} /> {filterRating === 'all' ? 'All Ratings' : `${filterRating}★`}
                        </button>
                        <div className="dropdown-content">
                            <button onClick={() => setFilterRating('all')} className={filterRating === 'all' ? 'active' : ''}>All Ratings</button>
                            {['5','4','3','2','1'].map(r => <button key={r} onClick={() => setFilterRating(r)} className={filterRating === r ? 'active' : ''}>{r} Stars</button>)}
                        </div>
                    </div>
                </div>
            </Card>

            {loading ? <CardListSkeleton count={5} />
             : error ? <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>{error}</div>
             : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <MessageSquare size={32} style={{ marginBottom: '0.75rem', opacity: 0.3 }} /><p>No feedback found.</p>
                </div>
             ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filtered.map(row => (
                        <div key={row.id} className="premium-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${getRatingColor(row.rating)}20`, color: getRatingColor(row.rating), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>{row.rating}★</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{row.profiles?.name || row.profiles?.email || 'Anonymous'}
                                        {row.orders?.restaurants?.name && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>@ {row.orders.restaurants.name}</span>}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: row.comment ? 'var(--text-main)' : 'var(--text-muted)', fontStyle: row.comment ? 'normal' : 'italic', lineHeight: 1.6 }}>
                                    {row.comment || 'No comment left.'}
                                </p>
                                {row.orders?.order_number && <div style={{ marginTop: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>Order #{row.orders.order_number}</div>}
                            </div>
                        </div>
                    ))}
                </div>
             )}
        </div>
    );
}
