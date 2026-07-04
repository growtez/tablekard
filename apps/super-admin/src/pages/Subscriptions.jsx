import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Search, Filter, SlidersHorizontal, Download, X, ChevronLeft, ChevronRight, Clock, Store, Calendar, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { TableRowsSkeleton } from '../components/ui/Skeleton';

export default function Subscriptions({ setSyncAction }) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterMonth, setFilterMonth] = useState(searchParams.get('month') || 'all');
    const [sortBy, setSortBy] = useState('newest');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(8);
    const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
    const [isMonthFilterOpen, setIsMonthFilterOpen] = useState(false);

    useEffect(() => {
        setFilterMonth(searchParams.get('month') || 'all');
    }, [searchParams]);

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

    const getAvailableMonths = () => {
        const monthsMap = {};
        data.forEach(row => {
            if (!row.created_at) return;
            const d = new Date(row.created_at);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            monthsMap[key] = label;
        });
        return Object.entries(monthsMap).sort((a, b) => b[0].localeCompare(a[0]));
    };

    const handleMonthChange = (val) => {
        setPage(1);
        if (val === 'all') {
            searchParams.delete('month');
        } else {
            searchParams.set('month', val);
        }
        setSearchParams(searchParams);
    };

    const filtered = data
        .filter(row => {
            const matchSearch = !search ||
                row.restaurants?.name?.toLowerCase().includes(search.toLowerCase()) ||
                row.restaurants?.slug?.toLowerCase().includes(search.toLowerCase()) ||
                row.razorpay_payment_id?.toLowerCase().includes(search.toLowerCase());
            const matchStatus = filterStatus === 'all' || row.status === filterStatus;
            let matchMonth = true;
            if (filterMonth !== 'all' && row.created_at) {
                const d = new Date(row.created_at);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                matchMonth = key === filterMonth;
            }
            return matchSearch && matchStatus && matchMonth;
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
        if (totalPages <= 3) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        if (safePage === totalPages) {
            return [1, '...', totalPages];
        }
        if (safePage === totalPages - 1) {
            return [safePage - 1, safePage, totalPages];
        }
        return [safePage, '...', totalPages];
    };

    const toggleSort = (newSort) => {
        setPage(1);
        if (newSort === 'newest') {
            setSortBy(sortBy === 'newest' ? 'oldest' : 'newest');
        } else if (sortBy === newSort) {
            setSortBy('newest');
        } else {
            setSortBy(newSort);
        }
    };

    const getSortIcon = (field) => {
        if (field === 'newest') {
            if (sortBy === 'newest') return <ArrowUp size={14} />;
            if (sortBy === 'oldest') return <ArrowDown size={14} />;
            return <ArrowUpDown size={14} style={{ opacity: 0.3 }} />;
        }
        if (sortBy === field) return <ArrowDown size={14} />;
        return <ArrowUpDown size={14} style={{ opacity: 0.3 }} />;
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

    const statusColor = s => s === 'paid' ? 'text-green-600' : s === 'pending' ? 'text-amber-600' : 'text-red-600';

    return (
        <div className="space-y-3">
            {/* List Control */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 w-full bg-surface p-3 md:p-2 rounded-xl shadow-sm border border-border">
                {/* Search Box */}
                <div className="relative w-full md:max-w-[260px] shrink-0">
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
                <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 px-2 md:border-x md:border-border/50 py-1 md:py-0">
                    {(search || filterStatus !== 'all' || filterMonth !== 'all') ? (
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
                            {filterMonth !== 'all' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium border border-blue-500/20 shrink-0">
                                    {(() => {
                                        const [year, month] = filterMonth.split('-');
                                        const d = new Date(parseInt(year), parseInt(month) - 1, 1);
                                        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                                    })()}
                                    <button onClick={() => handleMonthChange('all')} className="hover:text-blue-800 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                                </span>
                            )}
                            <button onClick={() => { setSearch(''); setFilterStatus('all'); handleMonthChange('all'); setSortBy('newest'); }} className="text-[11px] text-text-muted hover:text-red-500 transition-colors ml-1 bg-transparent border-none cursor-pointer font-medium shrink-0">Clear</button>
                        </>
                    ) : (
                        <span className="text-[11px] text-text-muted italic opacity-50">No active filters</span>
                    )}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between md:justify-start gap-1 shrink-0 md:border-x md:border-border/50 px-3 py-1.5 md:py-0 w-full md:w-auto">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
                        <ChevronLeft size={14} />
                    </button>
                    <div className="flex items-center justify-center gap-1 w-[80px]">
                        {getPaginationPages().map((p, i) => p === '...' ? (
                            <div key={`ellipsis-${i}`} className="w-6 h-6 flex items-center justify-center text-[11px] text-text-muted">…</div>
                        ) : (
                            <button key={p} onClick={() => setPage(p)} className={`w-6 h-6 flex items-center justify-center rounded text-[11px] font-semibold transition-colors border-none cursor-pointer ${safePage === p ? 'bg-accent-primary text-white' : 'text-text-muted hover:bg-surface-hover bg-transparent'}`}>{p}</button>
                        ))}
                    </div>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
                        <ChevronRight size={14} />
                    </button>
                </div>

                {/* Per-page & Dropdowns & Export */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
                    <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="py-1.5 px-2 rounded-lg border border-border bg-surface text-text-main text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer flex-1 md:flex-none">
                        {[8, 20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
                    </select>

                    <div className="relative group flex-1 md:flex-none">
                        <button 
                            onClick={() => { setIsStatusFilterOpen(!isStatusFilterOpen); setIsMonthFilterOpen(false); }}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover transition-colors text-[12px] font-medium"
                        >
                            <Filter size={14} className="text-accent-primary" /> Status
                        </button>
                        <div className={`absolute right-0 top-full mt-2 w-44 bg-surface border border-border rounded-xl shadow-lg transition-all z-50 flex flex-col overflow-hidden py-1 ${
                            isStatusFilterOpen ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
                        }`}>
                            {['all', 'paid', 'pending', 'failed'].map(s => (
                                <button key={s} onClick={() => { setFilterStatus(s); setPage(1); setIsStatusFilterOpen(false); }} className={`px-4 py-2 text-left text-[13px] hover:bg-surface-hover transition-colors ${filterStatus === s ? 'text-accent-primary font-medium bg-blue-500/5' : 'text-text-main'}`}>
                                    {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative group flex-1 md:flex-none">
                        <button 
                            onClick={() => { setIsMonthFilterOpen(!isMonthFilterOpen); setIsStatusFilterOpen(false); }}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover transition-colors text-[12px] font-medium"
                        >
                            <Calendar size={14} className="text-accent-primary" /> Month
                        </button>
                        <div className={`absolute right-0 top-full mt-2 w-44 bg-surface border border-border rounded-xl shadow-lg transition-all z-50 flex flex-col overflow-hidden py-1 max-h-60 overflow-y-auto ${
                            isMonthFilterOpen ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
                        }`}>
                            <button onClick={() => { handleMonthChange('all'); setIsMonthFilterOpen(false); }} className={`px-4 py-2 text-left text-[13px] hover:bg-surface-hover transition-colors ${filterMonth === 'all' ? 'text-accent-primary font-medium bg-blue-500/5' : 'text-text-main'}`}>
                                All Months
                            </button>
                            {getAvailableMonths().map(([key, label]) => (
                                <button key={key} onClick={() => { handleMonthChange(key); setIsMonthFilterOpen(false); }} className={`px-4 py-2 text-left text-[13px] hover:bg-surface-hover transition-colors ${filterMonth === key ? 'text-accent-primary font-medium bg-blue-500/5' : 'text-text-main'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleExport} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent-primary text-white hover:bg-accent-hover transition-colors text-[12px] font-medium shadow-sm cursor-pointer border-none flex-1 md:flex-none">
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            {/* Subscriptions List Container */}
            <div className="w-full bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                {/* Desktop View Table */}
                <table className="hidden md:table w-full text-left border-collapse whitespace-nowrap table-fixed">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[30%]">Restaurant</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[10%]">Plan</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[10%]" onClick={() => toggleSort('amount')}>
                                <div className="flex items-center gap-2">
                                    Amount {getSortIcon('amount')}
                                </div>
                            </th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[10%]">Status</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[10%]">Duration</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[20%]">Validity</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[10%]" onClick={() => toggleSort('newest')}>
                                <div className="flex items-center gap-2">
                                    Created {getSortIcon('newest')}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <TableRowsSkeleton rows={perPage} columns={7} />
                        ) : error ? (
                            <tr><td colSpan="7" className="text-center py-10 text-red-500 text-[13px] font-medium">{error}</td></tr>
                        ) : paged.length === 0 ? (
                            <tr><td colSpan="7" className="text-center py-10 text-text-muted text-[13px]">No subscription records found.</td></tr>
                        ) : (
                            <>
                                {paged.map(row => (
                                    <tr key={row.id} onClick={() => navigate(`/subscriptions/${row.id}`, { state: { name: row.restaurants?.name || 'Unknown' } })} className="group even:bg-bg hover:bg-surface-hover border-b border-border/40 last:border-b-0 cursor-pointer transition-colors">
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
                                    </tr>
                                ))}
                                {perPage - paged.length > 0 && Array.from({ length: perPage - paged.length }).map((_, idx) => (
                                    <tr key={`empty-${idx}`} className="border-b border-border/40 last:border-b-0 opacity-0 pointer-events-none">
                                        <td colSpan="7" className="py-2.5 px-4 align-middle">
                                            <div className="h-8"></div>
                                        </td>
                                    </tr>
                                ))}
                            </>
                        )}
                    </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="block md:hidden divide-y divide-border/40">
                    {loading ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3].map(n => (
                                <div key={n} className="animate-pulse flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-border/40" />
                                            <div className="h-4 bg-border/40 rounded w-28" />
                                        </div>
                                        <div className="h-4 bg-border/40 rounded w-16" />
                                    </div>
                                    <div className="space-y-2 pl-11">
                                        <div className="h-3.5 bg-border/40 rounded w-48" />
                                        <div className="h-3.5 bg-border/40 rounded w-36" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center py-10 text-red-500 text-[13px] font-medium">{error}</div>
                    ) : paged.length === 0 ? (
                        <div className="text-center py-10 text-text-muted text-[13px]">No subscription records found.</div>
                    ) : (
                        paged.map(row => (
                            <div
                                key={row.id}
                                onClick={() => navigate(`/subscriptions/${row.id}`, { state: { name: row.restaurants?.name || 'Unknown' } })}
                                className="p-4 hover:bg-surface-hover border-b border-border/40 last:border-b-0 cursor-pointer transition-colors flex flex-col gap-2.5 active:bg-surface-hover/80"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-blue-600 text-[12px] shrink-0">
                                            {row.restaurants?.name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-semibold text-text-main text-[13px] group-hover:text-accent-primary transition-colors truncate" title={row.restaurants?.name}>{row.restaurants?.name || 'Unknown'}</span>
                                            <span className="text-[11px] text-text-muted">/{row.restaurants?.slug}</span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className={`text-[12px] font-bold ${statusColor(row.status)}`}>{(row.status || '').toUpperCase()}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5 pl-11">
                                    <div className="flex items-center justify-between text-[12px]">
                                        <span className="text-text-muted">Plan / Amount</span>
                                        <span className="font-semibold text-text-main">
                                            <span className="text-accent-primary mr-1.5 font-bold">{row.restaurants?.subscription_type || 'Standard'}</span> 
                                            ₹{Number(row.amount).toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-[12px]">
                                        <span className="text-text-muted">Duration</span>
                                        <span className="flex items-center gap-1 text-text-main font-medium text-[12px]">
                                            <Clock size={11} className="opacity-60 text-blue-500" />
                                            {row.plan_duration} Days
                                        </span>
                                    </div>

                                    <div className="flex flex-col text-[11px] leading-relaxed border-t border-border/20 pt-1.5 mt-1">
                                        <div className="flex justify-between">
                                            <span className="text-text-muted">From:</span>
                                            <span className="font-medium text-text-main">{formatDate(row.starts_at)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-muted">To:</span>
                                            <span className={`font-medium ${row.ends_at && new Date(row.ends_at) < new Date() ? 'text-red-500 font-bold' : 'text-text-main'}`}>
                                                {formatDate(row.ends_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
