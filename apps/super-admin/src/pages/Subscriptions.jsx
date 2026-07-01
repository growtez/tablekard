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

            {/* Filter Bar */}
            <Card>
                <div className="flex gap-4 items-center flex-wrap w-full">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                        <input
                            type="text"
                            placeholder="Search restaurant or payment ID..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full py-2 pl-9 pr-3 bg-surface-hover border border-border rounded-xl text-text-main text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
                        />
                    </div>
                    <div className="relative group">
                        <button className={`px-3 py-2.5 rounded-xl border flex items-center gap-1.5 text-sm font-semibold transition-colors cursor-pointer ${filterStatus !== 'all' ? 'bg-blue-500/10 border-accent-primary text-accent-primary' : 'bg-surface-hover border-border text-text-muted hover:text-text-main'}`}>
                            <Filter size={16} /> {filterStatus === 'all' ? 'Status' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-2 flex flex-col">
                            {['all', 'paid', 'pending', 'failed'].map(s => (
                                <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 text-left text-sm hover:bg-surface-hover transition-colors cursor-pointer bg-transparent border-none ${filterStatus === s ? 'text-accent-primary font-bold bg-accent-primary/5' : 'text-text-main'}`}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
                            ))}
                        </div>
                    </div>
                    <div className="relative group">
                        <button className="px-3 py-2.5 rounded-xl bg-surface-hover border border-border flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text-main transition-colors cursor-pointer">
                            <SlidersHorizontal size={16} /> Sort
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-2 flex flex-col">
                            <button onClick={() => setSortBy('newest')} className={`px-4 py-2 text-left text-sm hover:bg-surface-hover transition-colors cursor-pointer bg-transparent border-none ${sortBy === 'newest' ? 'text-accent-primary font-bold bg-accent-primary/5' : 'text-text-main'}`}>Newest First</button>
                            <button onClick={() => setSortBy('oldest')} className={`px-4 py-2 text-left text-sm hover:bg-surface-hover transition-colors cursor-pointer bg-transparent border-none ${sortBy === 'oldest' ? 'text-accent-primary font-bold bg-accent-primary/5' : 'text-text-main'}`}>Oldest First</button>
                            <button onClick={() => setSortBy('amount')} className={`px-4 py-2 text-left text-sm hover:bg-surface-hover transition-colors cursor-pointer bg-transparent border-none ${sortBy === 'amount' ? 'text-accent-primary font-bold bg-accent-primary/5' : 'text-text-main'}`}>Highest Amount</button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Table */}
            <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-hover border-b border-border">
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">Restaurant</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">Plan</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">Duration</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">Validity</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">Created</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">Payment ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan="8" className="px-6 py-16 text-center">
                                    <div className="w-8 h-8 border-4 border-surface-hover border-t-accent-primary rounded-full animate-spin mx-auto" />
                                    <p className="mt-4 text-sm text-text-muted">Loading subscription records...</p>
                                </td></tr>
                            ) : error ? (
                                <tr><td colSpan="8" className="px-6 py-16 text-center text-red-500 font-medium">{error}</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="8" className="px-6 py-16 text-center text-text-muted text-sm">No subscription records found.</td></tr>
                            ) : filtered.map(row => (
                                <tr key={row.id} onClick={() => navigate(`/subscriptions/${row.id}`)} className="hover:bg-surface-hover transition-colors cursor-pointer group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center text-xs font-bold border border-border group-hover:border-accent-primary/30 transition-colors">
                                                {row.restaurants?.name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="font-semibold text-sm text-text-main">{row.restaurants?.name || 'Unknown'}</div>
                                                <div className="text-[11px] text-text-muted">/{row.restaurants?.slug}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-xs font-bold text-accent-primary bg-accent-primary/10 px-2 py-1 rounded-md">
                                            {row.restaurants?.subscription_type || 'Standard'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-baseline gap-1">
                                            <span className="font-extrabold text-sm text-text-main">₹{Number(row.amount).toLocaleString()}</span>
                                            <span className="text-[10px] text-text-muted font-semibold uppercase">{row.currency}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge variant={STATUS_VARIANTS[row.status] || 'default'} className="text-[10px] px-2 py-0.5">{row.status?.toUpperCase()}</Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium">
                                            <Clock size={12} className="opacity-60" />
                                            {row.plan_duration} days
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col text-[11px] leading-relaxed">
                                            <div className="text-text-muted"><span className="opacity-60">From:</span> <span className="font-medium text-text-main">{formatDate(row.starts_at)}</span></div>
                                            <div className={`${row.ends_at && new Date(row.ends_at) < new Date() ? 'text-red-500 font-bold' : 'text-text-muted'}`}>
                                                <span className={`${row.ends_at && new Date(row.ends_at) < new Date() ? '' : 'opacity-60'}`}>To:</span> <span className={`${row.ends_at && new Date(row.ends_at) < new Date() ? '' : 'font-medium text-text-main'}`}>{formatDate(row.ends_at)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-xs text-text-muted">{formatDate(row.created_at)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <code className="text-[10px] text-text-muted bg-surface-hover px-1.5 py-1 rounded border border-border group-hover:border-text-muted/30 transition-colors">
                                            {row.razorpay_payment_id ? row.razorpay_payment_id.slice(0, 14) + '…' : '—'}
                                        </code>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
