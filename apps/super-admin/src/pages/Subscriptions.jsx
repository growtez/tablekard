import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Search, Filter, SlidersHorizontal, Download, X, ChevronLeft, ChevronRight, Clock, Store } from 'lucide-react';
import { TableRowsSkeleton } from '../components/ui/Skeleton';

export default function Subscriptions({ setSyncAction }) {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(8);

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

            // Auto-cancel stale pending payments older than 6 hours
            const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
            const staleIds = r.filter(x => x.status === 'pending' && x.created_at < sixHoursAgo).map(x => x.id);
            if (staleIds.length > 0) {
                await supabase.from('subscription_payments').update({ status: 'failed' }).in('id', staleIds).eq('status', 'pending');
                staleIds.forEach(id => { const row = r.find(x => x.id === id); if (row) row.status = 'failed'; });
            }

            setData(r);
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

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const safePage = Math.min(page, totalPages);
    const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage);

    const getPaginationPages = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (safePage > 3) pages.push('...');
            for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
            if (safePage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    const handleExport = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Restaurant,Plan,Amount,Status,Duration,Starts,Ends,Created,Payment ID\n"
            + filtered.map(r => `${r.restaurants?.name || ''},${r.restaurants?.subscription_type || ''},${r.amount},${r.status},${r.plan_duration},${r.starts_at || ''},${r.ends_at || ''},${r.created_at},${r.razorpay_payment_id || ''}`).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `subscriptions_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    const statusColor = s => s === 'paid' ? 'text-green-500' : s === 'pending' ? 'text-amber-500' : 'text-red-500';

    return (
        <div className="space-y-3">
            {/* Control Bar */}
            <div className="flex items-center gap-3 w-full bg-white p-2 rounded-xl shadow-sm border border-border">
                {/* Search */}
                <div className="relative w-full max-w-[260px] shrink-0">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input
                        type="text"
                        placeholder="Search subscriptions..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="w-full py-2 pl-4 pr-10 bg-surface-hover border border-border rounded-full text-text-main text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
                    />
                </div>

                {/* Active Filter Pills */}
                <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 px-2 border-x border-border/50">
                    {(search || filterStatus !== 'all' || sortBy !== 'newest') ? (
                        <>
                            <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider shrink-0 mr-1">Active:</span>
                            {search && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium border border-blue-500/20 shrink-0">
                                    "{search}"
                                    <button onClick={() => { setSearch(''); setPage(1); }} className="hover:text-blue-800 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                                </span>
                            )}
                            {filterStatus !== 'all' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium border border-blue-500/20 shrink-0">
                                    {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                                    <button onClick={() => { setFilterStatus('all'); setPage(1); }} className="hover:text-blue-800 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                                </span>
                            )}
                            {sortBy !== 'newest' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium border border-blue-500/20 shrink-0">
                                    {sortBy === 'oldest' ? 'Oldest' : sortBy === 'amount' ? 'Amount ↓' : sortBy}
                                    <button onClick={() => { setSortBy('newest'); setPage(1); }} className="hover:text-blue-800 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                                </span>
                            )}
                            <button onClick={() => { setSearch(''); setFilterStatus('all'); setSortBy('newest'); setPage(1); }} className="text-[11px] text-text-muted hover:text-red-500 transition-colors ml-1 bg-transparent border-none cursor-pointer font-medium shrink-0">Clear</button>
                        </>
                    ) : (
                        <span className="text-[11px] text-text-muted italic opacity-50">No active filters</span>
                    )}
                </div>

                {/* Pagination */}
                <div className="flex items-center gap-1 shrink-0 border-x border-border/50 px-3">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
                        <ChevronLeft size={14} />
                    </button>
                    {getPaginationPages().map((p, i) => p === '...' ? (
                        <span key={`e-${i}`} className="text-[11px] text-text-muted px-1">…</span>
                    ) : (
                        <button key={p} onClick={() => setPage(p)} className={`w-6 h-6 flex items-center justify-center rounded text-[11px] font-semibold transition-colors border-none cursor-pointer ${safePage === p ? 'bg-accent-primary text-white' : 'text-text-muted hover:bg-surface-hover bg-transparent'}`}>{p}</button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
                        <ChevronRight size={14} />
                    </button>
                </div>

                {/* Per-page & Dropdowns & Export */}
                <div className="flex gap-2 shrink-0">
                    <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="py-1.5 px-2 rounded-lg border border-border bg-surface text-text-main text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer">
                        {[8, 20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
                    </select>

                    <div className="relative group">
                        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover transition-colors text-[12px] font-medium">
                            <Filter size={14} className="text-accent-primary" /> Status
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-44 bg-surface border border-border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 flex flex-col overflow-hidden py-1">
                            {['all', 'paid', 'pending', 'failed'].map(s => (
                                <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }} className={`px-4 py-2 text-left text-[13px] hover:bg-surface-hover transition-colors ${filterStatus === s ? 'text-accent-primary font-medium bg-blue-500/5' : 'text-text-main'}`}>
                                    {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative group">
                        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover transition-colors text-[12px] font-medium">
                            <SlidersHorizontal size={14} className="text-accent-primary" /> Sort
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-44 bg-surface border border-border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 flex flex-col overflow-hidden py-1">
                            <button onClick={() => { setSortBy('newest'); setPage(1); }} className={`px-4 py-2 text-left text-[13px] hover:bg-surface-hover transition-colors ${sortBy === 'newest' ? 'text-accent-primary font-medium bg-blue-500/5' : 'text-text-main'}`}>Newest First</button>
                            <button onClick={() => { setSortBy('oldest'); setPage(1); }} className={`px-4 py-2 text-left text-[13px] hover:bg-surface-hover transition-colors ${sortBy === 'oldest' ? 'text-accent-primary font-medium bg-blue-500/5' : 'text-text-main'}`}>Oldest First</button>
                            <button onClick={() => { setSortBy('amount'); setPage(1); }} className={`px-4 py-2 text-left text-[13px] hover:bg-surface-hover transition-colors ${sortBy === 'amount' ? 'text-accent-primary font-medium bg-blue-500/5' : 'text-text-main'}`}>Highest Amount</button>
                        </div>
                    </div>

                    <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-primary text-white hover:bg-accent-hover transition-colors text-[12px] font-medium shadow-sm ml-2 cursor-pointer border-none">
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto bg-white rounded-xl shadow-sm border border-border">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[25%]">Restaurant</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[10%]">Plan</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[10%]">Amount</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[1%]">Status</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[1%]">Duration</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[20%]">Validity</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[10%]">Created</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[15%]">Payment ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <TableRowsSkeleton rows={perPage} columns={8} />
                        ) : error ? (
                            <tr><td colSpan="8" className="text-center py-10 text-red-500 text-[13px] font-medium">{error}</td></tr>
                        ) : paged.length === 0 ? (
                            <tr><td colSpan="8" className="text-center py-10 text-text-muted text-[13px]">No subscription records found.</td></tr>
                        ) : paged.map(row => (
                            <tr key={row.id} onClick={() => navigate(`/subscriptions/${row.id}`)} className="group hover:bg-surface-hover border-b border-border/40 last:border-b-0 cursor-pointer transition-colors">
                                <td className="py-2.5 px-4 align-middle">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-blue-600 text-[12px] shrink-0">
                                            {row.restaurants?.name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-semibold text-text-main text-[13px] truncate group-hover:text-accent-primary transition-colors max-w-[180px]" title={row.restaurants?.name}>{row.restaurants?.name || 'Unknown'}</span>
                                            <span className="text-[11px] text-text-muted">/{row.restaurants?.slug}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-2.5 px-4 align-middle">
                                    <span className="text-[12px] font-bold text-accent-primary">{row.restaurants?.subscription_type || 'Standard'}</span>
                                </td>
                                <td className="py-2.5 px-4 align-middle">
                                    <span className="font-bold text-[13px] text-text-main">₹{Number(row.amount).toLocaleString()}</span>
                                    <span className="text-[10px] text-text-muted ml-1 uppercase">{row.currency}</span>
                                </td>
                                <td className="py-2.5 px-4 align-middle">
                                    <span className={`text-[12px] font-bold ${statusColor(row.status)}`}>{(row.status || '').toUpperCase()}</span>
                                </td>
                                <td className="py-2.5 px-4 align-middle">
                                    <div className="flex items-center gap-1 text-[12px] text-text-muted font-medium">
                                        <Clock size={11} className="opacity-60" />
                                        {row.plan_duration}d
                                    </div>
                                </td>
                                <td className="py-2.5 px-4 align-middle">
                                    <div className="flex flex-col text-[11px] leading-relaxed">
                                        <span className="text-text-muted"><span className="opacity-60">From:</span> <span className="font-medium text-text-main">{formatDate(row.starts_at)}</span></span>
                                        <span className={row.ends_at && new Date(row.ends_at) < new Date() ? 'text-red-500 font-bold' : 'text-text-muted'}>
                                            <span className="opacity-60">To:</span> <span className="font-medium">{formatDate(row.ends_at)}</span>
                                        </span>
                                    </div>
                                </td>
                                <td className="py-2.5 px-4 align-middle">
                                    <span className="text-[12px] text-text-muted font-medium">{formatDate(row.created_at)}</span>
                                </td>
                                <td className="py-2.5 px-4 align-middle">
                                    <code className="text-[11px] text-text-muted bg-surface-hover px-1.5 py-0.5 rounded border border-border">
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
