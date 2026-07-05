import React, { useEffect, useState, useCallback } from 'react';
import {
    X, ChevronLeft, ChevronRight, Loader2,
    Hash, User, CreditCard, CheckCircle, IndianRupee, ShoppingCart
} from 'lucide-react';
import { getOrdersForReport } from '../services/supabaseService';
import type { ReportOrder } from '../services/supabaseService';
interface RevenueOrdersModalProps {
    restaurantId: string;
    /** Full start date for the query */
    startDate: Date;
    /** Full end date for the query */
    endDate: Date;
    /** Human-readable label shown in the header (e.g. "Jul 1–7, 2026" or "June 2026") */
    periodLabel: string;
    onClose: () => void;
}

const PAGE_SIZE = 20;

const formatCurrency = (val: number) =>
    `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusConfig: Record<string, { label: string; className: string }> = {
    paid:    { label: 'Paid',    className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
    pending: { label: 'Pending', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' },
    failed:  { label: 'Failed',  className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
    refunded:{ label: 'Refunded',className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' },
};

const methodLabel = (m: string) => {
    const map: Record<string, string> = {
        cash: 'Cash', card: 'Card', upi: 'UPI',
        netbanking: 'Netbanking', wallet: 'Wallet', online: 'Online',
    };
    return map[m?.toLowerCase()] ?? m ?? '—';
};

const RevenueOrdersModal: React.FC<RevenueOrdersModalProps> = ({
    restaurantId,
    startDate,
    endDate,
    periodLabel,
    onClose,
}) => {
    const [orders, setOrders]         = useState<ReportOrder[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage]             = useState(1);
    const [loading, setLoading]       = useState(true);

    const totalPages  = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const totalRevenue = orders.reduce((s, o) => o.paymentStatus?.toLowerCase() === 'failed'||o.paymentStatus?.toLowerCase() === 'refunded' ? s : s + o.total, 0);

    const fetchPage = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const result = await getOrdersForReport(
                restaurantId, startDate, endDate, p, PAGE_SIZE
            );
            setOrders(result.orders);
            setTotalCount(result.totalCount);
        } finally {
            setLoading(false);
        }
    }, [restaurantId, startDate, endDate]);

    useEffect(() => {
        setPage(1);
        fetchPage(1);
    }, [fetchPage]);

    const goToPage = (p: number) => {
        if (p < 1 || p > totalPages) return;
        setPage(p);
        fetchPage(p);
    };


    return (
        <div className="fixed inset-0 z-[9000] bg-black/50 backdrop-blur-[4px] flex items-center justify-center animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-tk-bg-card rounded-[24px] w-[92%] max-w-[1080px] max-h-[90vh] flex flex-col shadow-[0_32px_64px_-12px_rgba(0,0,0,0.22),0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.55)] overflow-hidden font-sans animate-in slide-in-from-bottom-6 duration-300" onClick={(e) => e.stopPropagation()}>

                {/* ── Header ── */}
                <div className="flex items-center justify-between p-6 px-7 pb-5 border-b border-tk-border shrink-0">
                    <div className="flex items-center gap-3.5">
                        <ShoppingCart size={20} className="text-indigo-600 dark:text-indigo-400" />
                        <div>
                            <h2 className="text-xl font-bold text-tk-text m-0 leading-[1.2]">Order Details</h2>
                            <p className="text-[13px] text-tk-text-secondary mt-0.5 mb-0">{periodLabel}</p>
                        </div>
                    </div>
                    <button className="w-9 h-9 border-none rounded-xl bg-tk-bg-elevated text-tk-text-secondary flex items-center justify-center cursor-pointer transition-all duration-200 shrink-0 hover:bg-tk-bg-hover hover:text-tk-text hover:rotate-90" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* ── Stats Bar ── */}
                <div className="flex items-center gap-0 py-3.5 px-7 bg-gradient-to-br from-indigo-50/5 to-purple-50/5 border-b border-tk-border shrink-0 dark:bg-tk-bg-surface">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] uppercase tracking-[0.05em] text-tk-text-muted font-medium">Total Orders</span>
                        <span className="text-xl font-bold text-tk-text leading-none">{totalCount.toLocaleString()}</span>
                    </div>
                    <div className="w-[1px] h-9 bg-tk-border mx-7" />
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] uppercase tracking-[0.05em] text-tk-text-muted font-medium">Showing Page</span>
                        <span className="text-xl font-bold text-tk-text leading-none">{page} / {totalPages}</span>
                    </div>
                </div>

                {/* ── Table ── */}
                <div className="flex-1 overflow-y-auto overflow-x-auto p-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-tk-text-muted text-[15px]">
                            <Loader2 size={28} className="animate-spin text-indigo-600 dark:text-purple-400" />
                            <span>Loading orders…</span>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-tk-text-muted text-[15px]">
                            <ShoppingCart size={40} className="text-slate-300 dark:text-slate-600" />
                            <p>No orders found for this period.</p>
                        </div>
                    ) : (
                        <table className="w-full border-collapse text-[13.5px] min-w-[780px]">
                            <thead className="sticky top-0 z-[2]">
                                <tr className="bg-tk-bg-elevated border-b-2 border-tk-border">
                                    <th className="p-3.5 px-4 text-left text-xs font-semibold text-tk-text-secondary uppercase tracking-[0.04em] whitespace-nowrap"><span className="flex items-center gap-1.5"><Hash size={13} /> Order #</span></th>
                                    <th className="p-3.5 px-4 text-left text-xs font-semibold text-tk-text-secondary uppercase tracking-[0.04em] whitespace-nowrap"><span className="flex items-center gap-1.5"><CreditCard size={13} /> Date &amp; Time</span></th>
                                    <th className="p-3.5 px-4 text-left text-xs font-semibold text-tk-text-secondary uppercase tracking-[0.04em] whitespace-nowrap"><span className="flex items-center gap-1.5"><User size={13} /> Customer</span></th>
                                    <th className="p-3.5 px-4 text-left text-xs font-semibold text-tk-text-secondary uppercase tracking-[0.04em] whitespace-nowrap"><span className="flex items-center gap-1.5"><ShoppingCart size={13} /> Items</span></th>
                                    <th className="p-3.5 px-4 text-left text-xs font-semibold text-tk-text-secondary uppercase tracking-[0.04em] whitespace-nowrap"><span className="flex items-center gap-1.5"><CreditCard size={13} /> Method</span></th>
                                    <th className="p-3.5 px-4 text-left text-xs font-semibold text-tk-text-secondary uppercase tracking-[0.04em] whitespace-nowrap"><span className="flex items-center gap-1.5"><CheckCircle size={13} /> Status</span></th>
                                    <th className="p-3.5 px-4 text-right text-xs font-semibold text-tk-text-secondary uppercase tracking-[0.04em] whitespace-nowrap"><span className="flex items-center gap-1.5 justify-end"><IndianRupee size={13} /> Total</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => {
                                    const sc = statusConfig[order.paymentStatus] ??
                                        { label: order.paymentStatus, className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' };
                                    return (
                                        <tr key={order.id} className="border-b border-tk-border transition-colors duration-150 hover:bg-tk-bg-hover last:border-b-0">
                                            <td className="p-3.5 px-4 align-middle text-indigo-600 font-semibold whitespace-nowrap dark:text-purple-400">#{order.orderNumber}</td>
                                            <td className="p-3.5 px-4 align-middle text-tk-text whitespace-nowrap flex flex-col gap-0.5">
                                                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                    day: '2-digit', month: 'short', year: 'numeric'
                                                })}
                                                <span className="text-[11.5px] text-tk-text-muted">
                                                    {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                                                        hour: '2-digit', minute: '2-digit', hour12: true
                                                    })}
                                                </span>
                                            </td>
                                            <td className="p-3.5 px-4 align-middle text-tk-text font-medium whitespace-nowrap">{order.customerName}</td>
                                            <td className="p-3.5 px-4 align-middle max-w-[260px] overflow-hidden text-ellipsis whitespace-nowrap text-tk-text-secondary" title={order.items}>{order.items}</td>
                                            <td className="p-3.5 px-4 align-middle text-tk-text">{methodLabel(order.paymentMethod)}</td>
                                            <td className="p-3.5 px-4 align-middle text-tk-text">
                                                <span className={`inline-flex items-center py-[3px] px-2.5 rounded-full text-xs font-semibold whitespace-nowrap ${sc.className}`}>
                                                    {sc.label}
                                                </span>
                                            </td>
                                            <td className="p-3.5 px-4 align-middle text-right font-bold text-tk-text whitespace-nowrap">{formatCurrency(order.total)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>

                            {/* ── Totals footer (visible orders page) ── */}
                            <tfoot>
                                <tr className="bg-tk-bg-elevated border-t-2 border-tk-border">
                                    <td colSpan={5} className="p-3.5 px-4 font-semibold text-tk-text-secondary text-[13px]">
                                        Page total ({orders.length} orders)
                                    </td>
                                    <td />
                                    <td className="text-right p-3.5 px-4 text-base font-bold text-indigo-600 dark:text-purple-400">
                                        {formatCurrency(totalRevenue)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>

                {/* ── Pagination ── */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1.5 py-4 px-6 border-t border-tk-border shrink-0">
                        <button
                            className="min-w-[34px] h-[34px] px-2.5 border-[1.5px] border-tk-border rounded-lg bg-tk-bg-elevated text-tk-text-secondary text-[13px] font-medium cursor-pointer flex items-center justify-center transition-all duration-200 font-sans hover:not(:disabled):bg-tk-bg-hover hover:not(:disabled):text-tk-text disabled:opacity-35 disabled:cursor-not-allowed"
                            onClick={() => goToPage(page - 1)}
                            disabled={page === 1}
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {/* Page number pills */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                            .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…');
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, idx) =>
                                p === '…' ? (
                                    <span key={`ellipsis-${idx}`} className="text-tk-text-muted px-1 text-sm select-none">…</span>
                                ) : (
                                    <button
                                        key={p}
                                        className={`min-w-[34px] h-[34px] px-2.5 border-[1.5px] border-tk-border rounded-lg bg-tk-bg-elevated text-tk-text-secondary text-[13px] font-medium cursor-pointer flex items-center justify-center transition-all duration-200 font-sans hover:not(:disabled):not(.active):bg-tk-bg-hover hover:not(:disabled):not(.active):text-tk-text ${p === page ? 'bg-indigo-600 border-indigo-600 text-white font-semibold dark:bg-purple-800 dark:border-purple-800 active' : ''}`}
                                        onClick={() => goToPage(p as number)}
                                    >
                                        {p}
                                    </button>
                                )
                            )}

                        <button
                            className="min-w-[34px] h-[34px] px-2.5 border-[1.5px] border-tk-border rounded-lg bg-tk-bg-elevated text-tk-text-secondary text-[13px] font-medium cursor-pointer flex items-center justify-center transition-all duration-200 font-sans hover:not(:disabled):bg-tk-bg-hover hover:not(:disabled):text-tk-text disabled:opacity-35 disabled:cursor-not-allowed"
                            onClick={() => goToPage(page + 1)}
                            disabled={page === totalPages}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RevenueOrdersModal;
