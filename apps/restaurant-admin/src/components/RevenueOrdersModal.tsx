import React, { useEffect, useState, useCallback } from 'react';
import {
    X, ChevronLeft, ChevronRight, Loader2,
    Hash, User, CreditCard, CheckCircle, IndianRupee, ShoppingCart
} from 'lucide-react';
import { getOrdersForReport } from '../services/supabaseService';
import type { ReportOrder } from '../services/supabaseService';
import './RevenueOrdersModal.css';

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
    paid:    { label: 'Paid',    className: 'rom-status-paid' },
    pending: { label: 'Pending', className: 'rom-status-pending' },
    failed:  { label: 'Failed',  className: 'rom-status-failed' },
    refunded:{ label: 'Refunded',className: 'rom-status-refunded' },
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
        <div className="rom-overlay" onClick={onClose}>
            <div className="rom-content" onClick={(e) => e.stopPropagation()}>

                {/* ── Header ── */}
                <div className="rom-header">
                    <div className="rom-header-left">
                        <ShoppingCart size={20} className="rom-header-icon" />
                        <div>
                            <h2 className="rom-title">Order Details</h2>
                            <p className="rom-subtitle">{periodLabel}</p>
                        </div>
                    </div>
                    <button className="rom-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* ── Stats Bar ── */}
                <div className="rom-stats-bar">
                    <div className="rom-stat">
                        <span className="rom-stat-label">Total Orders</span>
                        <span className="rom-stat-value">{totalCount.toLocaleString()}</span>
                    </div>
                    <div className="rom-stat-divider" />
                    <div className="rom-stat">
                        <span className="rom-stat-label">Showing Page</span>
                        <span className="rom-stat-value">{page} / {totalPages}</span>
                    </div>
                </div>

                {/* ── Table ── */}
                <div className="rom-table-wrapper">
                    {loading ? (
                        <div className="rom-loading">
                            <Loader2 size={28} className="rom-spinner" />
                            <span>Loading orders…</span>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="rom-empty">
                            <ShoppingCart size={40} className="rom-empty-icon" />
                            <p>No orders found for this period.</p>
                        </div>
                    ) : (
                        <table className="rom-table">
                            <thead>
                                <tr>
                                    <th><span className="rom-th-inner"><Hash size={13} /> Order #</span></th>
                                    <th><span className="rom-th-inner"><CreditCard size={13} /> Date &amp; Time</span></th>
                                    <th><span className="rom-th-inner"><User size={13} /> Customer</span></th>
                                    <th><span className="rom-th-inner"><ShoppingCart size={13} /> Items</span></th>
                                    <th><span className="rom-th-inner"><CreditCard size={13} /> Method</span></th>
                                    <th><span className="rom-th-inner"><CheckCircle size={13} /> Status</span></th>
                                    <th className="rom-th-right"><span className="rom-th-inner"><IndianRupee size={13} /> Total</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => {
                                    const sc = statusConfig[order.paymentStatus] ??
                                        { label: order.paymentStatus, className: 'rom-status-pending' };
                                    return (
                                        <tr key={order.id} className="rom-row">
                                            <td className="rom-order-num">#{order.orderNumber}</td>
                                            <td className="rom-date">
                                                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                    day: '2-digit', month: 'short', year: 'numeric'
                                                })}
                                                <span className="rom-time">
                                                    {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                                                        hour: '2-digit', minute: '2-digit', hour12: true
                                                    })}
                                                </span>
                                            </td>
                                            <td className="rom-customer">{order.customerName}</td>
                                            <td className="rom-items" title={order.items}>{order.items}</td>
                                            <td>{methodLabel(order.paymentMethod)}</td>
                                            <td>
                                                <span className={`rom-status-badge ${sc.className}`}>
                                                    {sc.label}
                                                </span>
                                            </td>
                                            <td className="rom-total">{formatCurrency(order.total)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>

                            {/* ── Totals footer (visible orders page) ── */}
                            <tfoot>
                                <tr className="rom-footer-row">
                                    <td colSpan={5} className="rom-footer-label">
                                        Page total ({orders.length} orders)
                                    </td>
                                    <td />
                                    <td className="rom-footer-total">
                                        {formatCurrency(totalRevenue)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>

                {/* ── Pagination ── */}
                {!loading && totalPages > 1 && (
                    <div className="rom-pagination">
                        <button
                            className="rom-page-btn"
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
                                    <span key={`ellipsis-${idx}`} className="rom-page-ellipsis">…</span>
                                ) : (
                                    <button
                                        key={p}
                                        className={`rom-page-btn ${p === page ? 'active' : ''}`}
                                        onClick={() => goToPage(p as number)}
                                    >
                                        {p}
                                    </button>
                                )
                            )}

                        <button
                            className="rom-page-btn"
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
