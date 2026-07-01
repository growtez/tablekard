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
        <div className="animate-fade-in space-y-6 pb-8">
            {/* Filters */}
            <Card className="border-none shadow-[0_2px_16px_rgba(0,0,0,0.04)] mb-6">
                <div className="p-4 flex gap-4 items-center flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                        <input type="text" placeholder="Search restaurant, order #, or payment ID..." value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full py-2 pl-9 pr-3 bg-surface-hover border border-border rounded-xl text-text-main text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all" />
                    </div>

                    <div className="relative group">
                        <button className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-[13px] font-semibold transition-colors cursor-pointer ${filterStatus !== 'all' ? 'bg-blue-500/10 border-accent-primary text-accent-primary' : 'bg-surface-hover border-border text-text-muted hover:bg-border'}`}>
                            <Filter size={16} /> {filterStatus === 'all' ? 'Status' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-surface rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-border overflow-hidden z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col p-1.5">
                            {['all', 'paid', 'pending', 'failed', 'refunded'].map(s => (
                                <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2.5 text-left text-sm font-semibold rounded-lg border-none cursor-pointer ${filterStatus === s ? 'bg-blue-500/10 text-accent-primary' : 'bg-transparent text-text-main hover:bg-surface-hover'}`}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
                            ))}
                        </div>
                    </div>

                    <div className="relative group">
                        <button className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-[13px] font-semibold transition-colors cursor-pointer ${filterGateway !== 'all' ? 'bg-amber-500/10 border-amber-800 text-amber-800' : 'bg-surface-hover border-border text-text-muted hover:bg-border'}`}>
                            <Store size={16} /> {filterGateway === 'all' ? 'Gateway' : filterGateway === 'razorpay' ? 'Razorpay' : 'Pay at Counter'}
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-surface rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-border overflow-hidden z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col p-1.5">
                            <button onClick={() => setFilterGateway('all')} className={`px-4 py-2.5 text-left text-sm font-semibold rounded-lg border-none cursor-pointer ${filterGateway === 'all' ? 'bg-amber-500/10 text-amber-800' : 'bg-transparent text-text-main hover:bg-surface-hover'}`}>All Gateways</button>
                            <button onClick={() => setFilterGateway('razorpay')} className={`px-4 py-2.5 text-left text-sm font-semibold rounded-lg border-none cursor-pointer ${filterGateway === 'razorpay' ? 'bg-amber-500/10 text-amber-800' : 'bg-transparent text-text-main hover:bg-surface-hover'}`}>Razorpay</button>
                            <button onClick={() => setFilterGateway('counter')} className={`px-4 py-2.5 text-left text-sm font-semibold rounded-lg border-none cursor-pointer ${filterGateway === 'counter' ? 'bg-amber-500/10 text-amber-800' : 'bg-transparent text-text-main hover:bg-surface-hover'}`}>Pay at Counter</button>
                        </div>
                    </div>

                    <div className="relative group">
                        <button className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-surface-hover hover:bg-border border border-border text-text-muted hover:text-text-main text-[13px] font-semibold cursor-pointer transition-colors">
                            <SlidersHorizontal size={16} /> Sort
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-surface rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-border overflow-hidden z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col p-1.5">
                            <button onClick={() => setSortBy('newest')} className={`px-4 py-2.5 text-left text-sm font-semibold rounded-lg border-none cursor-pointer ${sortBy === 'newest' ? 'bg-surface-hover text-text-main' : 'bg-transparent text-text-main hover:bg-surface-hover'}`}>Newest First</button>
                            <button onClick={() => setSortBy('oldest')} className={`px-4 py-2.5 text-left text-sm font-semibold rounded-lg border-none cursor-pointer ${sortBy === 'oldest' ? 'bg-surface-hover text-text-main' : 'bg-transparent text-text-main hover:bg-surface-hover'}`}>Oldest First</button>
                            <button onClick={() => setSortBy('amount')} className={`px-4 py-2.5 text-left text-sm font-semibold rounded-lg border-none cursor-pointer ${sortBy === 'amount' ? 'bg-surface-hover text-text-main' : 'bg-transparent text-text-main hover:bg-surface-hover'}`}>Highest Amount</button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Table */}
            <div className="bg-surface border border-border rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-surface-hover border-b border-border text-left">
                                <th className="px-5 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Restaurant</th>
                                <th className="px-5 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Order #</th>
                                <th className="px-5 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Amount</th>
                                <th className="px-5 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
                                <th className="px-5 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Gateway</th>
                                <th className="px-5 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-16"><div className="w-8 h-8 border-4 border-surface-hover border-t-accent-primary rounded-full animate-spin mx-auto" /></td></tr>
                            ) : error ? (
                                <tr><td colSpan="6" className="text-center py-16 text-red-500 font-semibold">{error}</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-16 text-text-muted font-medium">No transactions found.</td></tr>
                            ) : filtered.map(row => (
                                <tr key={`${row._source}-${row._id}`} className="hover:bg-surface-hover/50 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="font-bold text-sm text-text-main">{row.restaurant_name}</div>
                                        <div className="text-[11px] font-medium text-text-muted">/{row.restaurant_slug}</div>
                                    </td>
                                    <td className="px-5 py-4">
                                        {row.order_number ? (
                                            <div className="flex items-center gap-1.5">
                                                <Hash size={11} className="text-text-muted shrink-0" />
                                                <div>
                                                    <div className="text-[13px] font-bold font-mono text-text-main">{row.order_number}</div>
                                                    {row.order_type && <div className="text-[11px] font-medium text-text-muted">{row.order_type.replace('_', ' ')}</div>}
                                                </div>
                                            </div>
                                        ) : <span className="text-text-muted text-xs">—</span>}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="font-extrabold text-[15px] text-text-main">₹{row.amount.toLocaleString()}</span>
                                        <span className="text-[11px] font-bold text-text-muted ml-1 uppercase">{row.currency}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <Badge variant={STATUS_VARIANTS[row.status] || 'default'} className="uppercase text-[10px] tracking-wider font-bold">{row.status?.toUpperCase()}</Badge>
                                        {row.failure_reason && (
                                            <div className="text-[10px] font-medium text-red-800 mt-1 max-w-[120px] truncate" title={row.failure_reason}>{row.failure_reason}</div>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span 
                                            className="text-[12px] font-bold px-2 py-1 rounded-md border whitespace-nowrap"
                                            style={{ color: row.gateway_color, backgroundColor: `${row.gateway_color}15`, borderColor: `${row.gateway_color}30` }}
                                        >
                                            {row.gateway}
                                        </span>
                                        {row.razorpay_payment_id && (
                                            <div className="text-[11px] font-medium font-mono text-text-muted mt-1">{row.razorpay_payment_id.slice(0, 14)}…</div>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <span className="text-[13px] font-medium text-text-muted">{fmt(row.date)}</span>
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
