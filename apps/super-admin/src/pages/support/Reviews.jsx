import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Search, MessageSquare, Star } from 'lucide-react';
import { CardListSkeleton } from '../../components/ui/Skeleton';

// feedback: id, order_id, user_id, rating (1-5), comment, created_at
// Joins: orders -> restaurants, profiles (via user_id)
export default function Reviews({ setSyncAction }) {
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
                    orders(order_number, restaurants(name, slug)),
                    profiles:user_id(id, name, email)`)
                .order('created_at', { ascending: false });
            if (err) throw err;
            setData(rows || []);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { if (setSyncAction) setSyncAction({ onSync: fetchData, loading }); }, [loading, setSyncAction]);

    const filtered = data.filter(row => {
        const ms = !search || row.comment?.toLowerCase().includes(search.toLowerCase()) || row.profiles?.name?.toLowerCase().includes(search.toLowerCase()) || row.orders?.restaurants?.name?.toLowerCase().includes(search.toLowerCase());
        return ms && (filterRating === 'all' || String(row.rating) === filterRating);
    });

    const ratingBreakdown = [5,4,3,2,1].map(r => ({
        stars: r,
        count: data.filter(d => d.rating === r).length,
        pct: data.length > 0 ? Math.round(data.filter(d => d.rating === r).length / data.length * 100) : 0
    }));

    const avgRating = data.length > 0 ? (data.reduce((s, r) => s + r.rating, 0) / data.length).toFixed(1) : null;
    const getStarColor = r => r >= 4 ? '#065f46' : r === 3 ? '#92400e' : '#991b1b';

    return (
        <div className="animate-fade-in space-y-6">
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px, 1fr) 2fr', gap: '1.5rem' }}>
                <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '0.5rem', padding: '1.5rem' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 800, color: '#92400e', lineHeight: 1 }}>{loading ? '—' : (avgRating || '—')}</div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                        {[1,2,3,4,5].map(i => <Star key={i} size={14} fill={avgRating && i <= Math.round(avgRating) ? '#92400e' : 'transparent'} color="#92400e" />)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{data.length} review{data.length !== 1 ? 's' : ''}</div>
                </div>
                <div className="premium-card">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {ratingBreakdown.map(({ stars, count, pct }) => (
                            <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '36px' }}>{stars} ★</span>
                                <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: 'var(--surface-hover)', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${pct}%`, background: getStarColor(stars), borderRadius: '4px', transition: 'width 0.6s ease' }} />
                                </div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '24px', textAlign: 'right' }}>{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Card>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                        <input type="text" placeholder="Search by comment, customer, or restaurant..." value={search} onChange={e => setSearch(e.target.value)} className="w-full py-2 pl-9 pr-3 bg-surface-hover border border-border rounded-xl text-text-main text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all" />
                    </div>
                    <div className="dropdown-wrapper">
                        <button className="btn-ghost" style={{ padding: '10px 14px', borderRadius: '10px', background: filterRating !== 'all' ? 'rgba(59,130,246,0.1)' : 'var(--surface-hover)', border: `1px solid ${filterRating !== 'all' ? 'var(--accent-primary)' : 'var(--border-color)'}`, gap: '6px', fontSize: '0.85rem', color: filterRating !== 'all' ? 'var(--accent-primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                            <Star size={16} /> {filterRating === 'all' ? 'All Stars' : `${filterRating}★`}
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
                    <MessageSquare size={32} style={{ marginBottom: '0.75rem', opacity: 0.3 }} /><p>No reviews found.</p>
                </div>
             ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filtered.map(row => (
                        <div key={row.id} className="premium-card">
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ flexShrink: 0, width: '44px', height: '44px', borderRadius: '50%', background: `${getStarColor(row.rating)}20`, color: getStarColor(row.rating), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>{row.rating}★</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{row.profiles?.name || row.profiles?.email || 'Anonymous'}</span>
                                            {row.orders?.restaurants?.name && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--surface-hover)', padding: '1px 8px', borderRadius: '20px' }}>{row.orders.restaurants.name}</span>}
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>{new Date(row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: row.comment ? 'var(--text-main)' : 'var(--text-muted)', fontStyle: row.comment ? 'normal' : 'italic', lineHeight: 1.6 }}>{row.comment || 'No written comment.'}</p>
                                    {row.orders?.order_number && <div style={{ marginTop: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>Order #{row.orders.order_number}</div>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             )}
        </div>
    );
}
