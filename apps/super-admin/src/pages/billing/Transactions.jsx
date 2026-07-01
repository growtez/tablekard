import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Search, Filter, SlidersHorizontal, Download, X, ChevronLeft, ChevronRight, Store, Hash } from 'lucide-react';
import { TableRowsSkeleton } from '../../components/ui/Skeleton';

// DATA SOURCES:
// 1. payments table  → online (Razorpay) payments, may or may not have order_id
// 2. orders table    → cash/card (pay-at-counter) orders (payment_method = 'cash'|'card')
//    cash/card orders never create a payments row — tracked directly on orders
//
// We fetch both and merge into a normalised list.

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
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(8);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: payments, error: pErr } = await supabase
                .from('payments')
                .select(`id, amount, currency, method, gateway, status, razorpay_payment_id, failure_reason, paid_at, created_at, order_id, restaurants(name, slug), orders(order_number, type)`)
                .order('created_at', { ascending: false });
            if (pErr) throw pErr;

            const { data: cashOrders, error: oErr } = await supabase
                .from('orders')
                .select(`id, order_number, type, payment_method, payment_status, total, created_at, updated_at, restaurants(name, slug)`)
                .in('payment_method', ['cash', 'card'])
                .order('created_at', { ascending: false });
            if (oErr) throw oErr;

            const onlineOrderIds = new Set((payments || []).map(p => p.order_id).filter(Boolean));
            const filteredCash = (cashOrders || []).filter(o => !onlineOrderIds.has(o.id));

            const merged = [
                ...(payments || []).map(normalisePayment),
                ...filteredCash.map(normaliseOrder),
            ].sort((a, b) => new Date(b.date) - new Date(a.date));

            setData(merged);
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
            + "Restaurant,Order#,Amount,Status,Gateway,Payment ID,Date\n"
            + filtered.map(r => `${r.restaurant_name},${r.order_number || ''},${r.amount},${r.status},${r.gateway},${r.razorpay_payment_id || ''},${r.date}`).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    const statusColor = s => s === 'paid' || s === 'completed' ? 'text-green-500' : s === 'pending' ? 'text-amber-500' : s === 'refunded' ? 'text-blue-500' : 'text-red-500';
    const hasActiveFilters = search || filterStatus !== 'all' || filterGateway !== 'all' || sortBy !== 'newest';

    return (
        <div className="space-y-3">
            {/* Control Bar */}
            <div className="flex items-center gap-3 w-full bg-white p-2 rounded-xl shadow-sm border border-border">
                {/* Search */}
                <div className="relative w-full max-w-[260px] shrink-0">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="w-full py-2 pl-4 pr-10 bg-surface-hover border border-border rounded-full text-text-main text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
                    />
                </div>

                {/* Active Filter Pills */}
                <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 px-2 border-x border-border/50">
                    {hasActiveFilters ? (
                        <>
                            <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider shrink-0 mr-1">Active:</span>
                            {search && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium border border-blue-500/20 shrink-0">
                                    "{search}"
                                    <button onClick={() => { setSearch(''); setPage(1); }} className="hover:text-blue-800 focus:outline-none flex items-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                                </span>
                            )}
                            {filterStatus !== 'all' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium border border-blue-500/20 shrink-0">
                                    {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                                    <button onClick={() => { setFilterStatus('all'); setPage(1); }} className="hover:text-blue-800 focus:outline-none flex items-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                                </span>
                            )}
                            {filterGateway !== 'all' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium border border-blue-500/20 shrink-0">
                                    {filterGateway === 'razorpay' ? 'Razorpay' : 'Counter'}
                                    <button onClick={() => { setFilterGateway('all'); setPage(1); }} className="hover:text-blue-800 focus:outline-none flex items-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                                </span>
                            )}
                            {sortBy !== 'newest' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium border border-blue-500/20 shrink-0">
                                    {sortBy === 'oldest' ? 'Oldest' : 'Amount ↓'}
                                    <button onClick={() => { setSortBy('newest'); setPage(1); }} className="hover:text-blue-800 focus:outline-none flex items-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                                </span>
                            )}
                            <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterGateway('all'); setSortBy('newest'); setPage(1); }} className="text-[11px] text-text-muted hover:text-red-500 transition-colors ml-1 bg-transparent border-none cursor-pointer font-medium shrink-0">Clear</button>
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

                {/* Per-page & Dropdowns */}
                <div className="flex gap-2 shrink-0">
                    <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="py-1.5 px-2 rounded-lg border border-border bg-surface text-text-main text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer">
                        {[8, 20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
                    </select>

                    <div className="relative group">
                        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover transition-colors text-[12px] font-medium">
                            <Filter size={14} className="text-accent-primary" /> Status
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-44 bg-surface border border-border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 flex flex-col overflow-hidden py-1">
                            {['all', 'paid', 'pending', 'failed', 'refunded', 'completed'].map(s => (
                                <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }} className={`px-4 py-2 text-left text-[13px] hover:bg-surface-hover transition-colors ${filterStatus === s ? 'text-accent-primary font-medium bg-blue-500/5' : 'text-text-main'}`}>
                                    {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative group">
                        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover transition-colors text-[12px] font-medium">
                            <Store size={14} className="text-accent-primary" /> Gateway
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-44 bg-surface border border-border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 flex flex-col overflow-hidden py-1">
                            <button onClick={() => { setFilterGateway('all'); setPage(1); }} className={`px-4 py-2 text-left text-[13px] hover:bg-surface-hover transition-colors ${filterGateway === 'all' ? 'text-accent-primary font-medium bg-blue-500/5' : 'text-text-main'}`}>All Gateways</button>
                            <button onClick={() => { setFilterGateway('razorpay'); setPage(1); }} className={`px-4 py-2 text-left text-[13px] hover:bg-surface-hover transition-colors ${filterGateway === 'razorpay' ? 'text-accent-primary font-medium bg-blue-500/5' : 'text-text-main'}`}>Razorpay</button>
                            <button onClick={() => { setFilterGateway('counter'); setPage(1); }} className={`px-4 py-2 text-left text-[13px] hover:bg-surface-hover transition-colors ${filterGateway === 'counter' ? 'text-accent-primary font-medium bg-blue-500/5' : 'text-text-main'}`}>Pay at Counter</button>
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
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[15%]">Order #</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[12%]">Amount</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[1%]">Status</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[15%]">Gateway</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[12%]">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <TableRowsSkeleton rows={perPage} columns={6} />
                        ) : error ? (
                            <tr><td colSpan="6" className="text-center py-10 text-red-500 text-[13px] font-medium">{error}</td></tr>
                        ) : paged.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-10 text-text-muted text-[13px]">No transactions found.</td></tr>
                        ) : paged.map(row => (
                            <tr key={`${row._source}-${row._id}`} className="group hover:bg-surface-hover border-b border-border/40 last:border-b-0 transition-colors">
                                <td className="py-2.5 px-4 align-middle">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-blue-600 text-[12px] shrink-0">
                                            {row.restaurant_name[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-semibold text-text-main text-[13px] truncate group-hover:text-accent-primary transition-colors max-w-[160px]" title={row.restaurant_name}>{row.restaurant_name}</span>
                                            <span className="text-[11px] text-text-muted">/{row.restaurant_slug}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-2.5 px-4 align-middle">
                                    {row.order_number ? (
                                        <div className="flex items-center gap-1.5">
                                            <Hash size={11} className="text-text-muted shrink-0" />
                                            <div>
                                                <div className="text-[12px] font-bold font-mono text-text-main">{row.order_number}</div>
                                                {row.order_type && <div className="text-[11px] text-text-muted">{row.order_type.replace('_', ' ')}</div>}
                                            </div>
                                        </div>
                                    ) : <span className="text-text-muted text-[12px]">—</span>}
                                </td>
                                <td className="py-2.5 px-4 align-middle">
                                    <span className="font-bold text-[13px] text-text-main">₹{row.amount.toLocaleString()}</span>
                                    <span className="text-[10px] text-text-muted ml-1 uppercase">{row.currency}</span>
                                </td>
                                <td className="py-2.5 px-4 align-middle">
                                    <span className={`text-[12px] font-bold ${statusColor(row.status)}`}>{(row.status || '').toUpperCase()}</span>
                                    {row.failure_reason && (
                                        <div className="text-[10px] text-red-400 max-w-[100px] truncate" title={row.failure_reason}>{row.failure_reason}</div>
                                    )}
                                </td>
                                <td className="py-2.5 px-4 align-middle">
                                    <span className="text-[12px] font-bold px-2 py-0.5 rounded border whitespace-nowrap" style={{ color: row.gateway_color, backgroundColor: `${row.gateway_color}15`, borderColor: `${row.gateway_color}30` }}>
                                        {row.gateway}
                                    </span>
                                    {row.razorpay_payment_id && (
                                        <div className="text-[11px] font-mono text-text-muted mt-0.5">{row.razorpay_payment_id.slice(0, 14)}…</div>
                                    )}
                                </td>
                                <td className="py-2.5 px-4 align-middle">
                                    <span className="text-[12px] text-text-muted font-medium">{fmt(row.date)}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
