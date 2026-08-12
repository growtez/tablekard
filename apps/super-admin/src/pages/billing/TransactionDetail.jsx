import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { 
    ChevronLeft, 
    CreditCard, 
    Store, 
    Calendar, 
    User, 
    Mail, 
    FileText, 
    AlertCircle,
    Info,
    ArrowUpRight,
    CheckCircle2,
    XCircle,
    Timer,
    Phone,
    ShoppingCart
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DetailPageSkeleton } from '../../components/ui/Skeleton';

export default function TransactionDetail({ setHeaderData }) {
    const { source, id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [txData, setTxData] = useState(null);
    const [orderData, setOrderData] = useState(null);
    const [orderItems, setOrderItems] = useState([]);

    const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            if (source === 'payments') {
                const { data: payment, error: pErr } = await supabase
                    .from('payments')
                    .select(`*, restaurants(id, name, contact_email, contact_phone), orders(*), profiles:user_id(id, email, name)`)
                    .eq('id', id)
                    .single();
                if (pErr) throw pErr;
                setTxData({
                    id: payment.id,
                    amount: payment.amount,
                    status: payment.status,
                    gateway: payment.gateway || 'Razorpay',
                    gateway_payment_id: payment.razorpay_payment_id,
                    failure_reason: payment.failure_reason,
                    created_at: payment.paid_at || payment.created_at,
                    restaurant: payment.restaurants,
                    customer: payment.profiles,
                    raw: payment
                });
                if (payment.orders) {
                    setOrderData(payment.orders);
                    fetchOrderItems(payment.orders.id);
                }
            } else if (source === 'orders') {
                const { data: order, error: oErr } = await supabase
                    .from('orders')
                    .select(`*, restaurants(id, name, contact_email, contact_phone), profiles:customer_id(id, email, name)`)
                    .eq('id', id)
                    .single();
                if (oErr) throw oErr;
                const { data: assocPayments } = await supabase.from('payments').select('*').eq('order_id', id);
                const payment = assocPayments?.[0];
                setTxData({
                    id: order.id,
                    amount: order.total,
                    status: order.payment_status,
                    gateway: payment?.gateway || (order.payment_method === 'cash' ? 'Pay at Counter (Cash)' : order.payment_method === 'card' ? 'Pay at Counter (Card)' : 'Pay at Counter'),
                    gateway_payment_id: payment?.razorpay_payment_id || null,
                    failure_reason: payment?.failure_reason || null,
                    created_at: order.created_at,
                    restaurant: order.restaurants,
                    customer: order.profiles,
                    raw: { order, payment }
                });
                setOrderData(order);
                fetchOrderItems(order.id);
            }
        } catch (err) {
            console.error('Failed to fetch transaction details:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderItems = async (orderId) => {
        try {
            const { data: items, error } = await supabase.from('order_items').select('*').eq('order_id', orderId);
            if (error) throw error;
            setOrderItems(items || []);
        } catch (err) {
            console.error('Failed to fetch order items:', err);
        }
    };

    useEffect(() => {
        fetchDetails();
        return () => setHeaderData && setHeaderData(null);
    }, [source, id]);

    useEffect(() => {
        if (txData && setHeaderData) {
            setHeaderData({
                id: txData.id,
                name: txData.restaurant?.name || 'Unknown',
                status: txData.status,
                backPath: '/billing/transactions',
                backTitle: 'Back to Transactions'
            });
        }
    }, [txData, orderData, setHeaderData]);

    const formatDate = (d, time = false) => {
        if (!d) return '—';
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        if (time) { options.hour = '2-digit'; options.minute = '2-digit'; }
        return new Date(d).toLocaleDateString('en-IN', options);
    };

    if (loading) return <DetailPageSkeleton />;

    if (error || !txData) {
        return (
            <div className="animate-fade-in p-8 text-center">
                <AlertCircle size={48} className="text-red-500 opacity-50 mb-4 mx-auto" />
                <h2 className="text-2xl font-bold mb-2">Transaction Not Found</h2>
                <p className="text-text-muted mb-6">{error || 'The requested transaction could not be located.'}</p>
                <button onClick={() => navigate('/billing/transactions')} className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-black font-bold rounded-xl mx-auto shadow-sm hover:shadow-md transition-all border-none cursor-pointer">
                    <ChevronLeft size={18} /> Back to Transactions
                </button>
            </div>
        );
    }

    const statusKey = txData.status?.toLowerCase();
    const StatusIcon = statusKey === 'paid' || statusKey === 'completed' ? CheckCircle2 : statusKey === 'failed' ? XCircle : Timer;
    const statusColor = statusKey === 'paid' || statusKey === 'completed' ? 'text-emerald-500' : statusKey === 'failed' ? 'text-red-500' : 'text-amber-500';
    const statusBg = statusKey === 'paid' || statusKey === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20' : statusKey === 'failed' ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20';
    const orderTotal = orderItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    return (
        <div className="animate-fade-in max-w-[1100px] mx-auto pb-12">

            {/* Hero Amount Banner */}
            <div className="rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-hover overflow-hidden mb-8 shadow-sm">
                <div className="px-8 py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center shrink-0">
                            <CreditCard size={26} className="text-accent-primary" />
                        </div>
                        <div>
                            <div className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-1">Transaction Amount</div>
                            <div className="text-4xl font-black text-text-main tracking-tight">₹{Number(txData.amount || 0).toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-3">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border font-bold text-[13px] ${statusBg} ${statusColor}`}>
                            <StatusIcon size={15} />
                            {txData.status?.toUpperCase()}
                        </div>
                        <div className="flex items-center gap-1.5 text-[13px] text-text-muted">
                            <Calendar size={13} />
                            {formatDate(txData.created_at, true)}
                        </div>
                    </div>
                </div>

                <div className="border-t border-border px-8 py-4 flex flex-wrap gap-6">
                    <div>
                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Gateway</div>
                        <div className="text-[13px] font-semibold text-text-main capitalize">{txData.gateway}</div>
                    </div>
                    {txData.gateway_payment_id && (
                        <div>
                            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Gateway ID</div>
                            <div className="text-[13px] font-mono text-text-main">{txData.gateway_payment_id}</div>
                        </div>
                    )}
                    <div>
                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Source</div>
                        <div className="text-[13px] font-semibold text-text-main capitalize">{source} Table</div>
                    </div>
                    <div className="ml-auto hidden sm:block">
                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Record ID</div>
                        <div className="text-[11px] font-mono text-text-muted truncate max-w-[220px]" title={txData.id}>{txData.id}</div>
                    </div>
                </div>

                {txData.failure_reason && (
                    <div className="border-t border-red-500/10 bg-red-500/5 px-8 py-4 flex items-start gap-3">
                        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                        <div>
                            <div className="text-[11px] font-bold text-red-600 uppercase tracking-wider mb-0.5">Failure Reason</div>
                            <p className="text-[13px] text-red-600/90 font-medium">{txData.failure_reason}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Column */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {orderData && (
                        <Card>
                            <CardHeader className="flex justify-between items-center border-b border-border pb-4">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <ShoppingCart size={18} className="text-accent-primary" />
                                    Order #{orderData.order_number}
                                </CardTitle>
                                <div className="flex gap-2">
                                    {orderData.type && <Badge variant="outline" className="capitalize">{orderData.type}</Badge>}
                                    {orderData.status && (
                                        <Badge variant={orderData.status === 'completed' ? 'success' : orderData.status === 'cancelled' ? 'error' : 'warning'}>
                                            {orderData.status?.toUpperCase()}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <div className="p-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-surface-hover rounded-xl">
                                    <div>
                                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Payment Method</div>
                                        <div className="text-[13px] font-semibold text-text-main capitalize">{orderData.payment_method || '—'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Order Date</div>
                                        <div className="text-[13px] font-semibold text-text-main">{formatDate(orderData.created_at, true)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Order UUID</div>
                                        <div className="text-[11px] font-mono text-text-muted truncate" title={orderData.id}>{orderData.id}</div>
                                    </div>
                                </div>

                                <div className="text-[13px] font-bold text-text-main mb-3 flex items-center gap-2">
                                    Order Items
                                    <span className="text-[11px] font-bold bg-accent-primary/10 text-accent-primary px-2 py-0.5 rounded-full">{orderItems.length}</span>
                                </div>

                                {orderItems.length === 0 ? (
                                    <div className="text-center py-8 text-text-muted border border-dashed border-border rounded-xl text-sm">
                                        No item details available.
                                    </div>
                                ) : (
                                    <div className="border border-border rounded-xl overflow-hidden">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-border bg-surface-hover">
                                                    <th className="py-3 px-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Item</th>
                                                    <th className="py-3 px-4 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">Price</th>
                                                    <th className="py-3 px-4 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">Qty</th>
                                                    <th className="py-3 px-4 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orderItems.map((item, idx) => (
                                                    <tr key={item.id || idx} className="border-b border-border last:border-b-0 hover:bg-surface-hover/50 transition-colors">
                                                        <td className="py-3 px-4">
                                                            <div className="text-[13px] font-semibold text-text-main">{item.name}</div>
                                                            {item.variant_name && <div className="text-[11px] text-text-muted mt-0.5">{item.variant_name}</div>}
                                                        </td>
                                                        <td className="py-3 px-4 text-[13px] text-text-muted text-right">₹{Number(item.price).toLocaleString('en-IN')}</td>
                                                        <td className="py-3 px-4 text-right">
                                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-hover text-[12px] font-bold text-text-main">{item.quantity}</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-[13px] font-bold text-text-main text-right">₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t border-border bg-surface-hover">
                                                    <td colSpan={3} className="py-3 px-4 text-[12px] font-bold text-text-muted uppercase tracking-wider text-right">Order Total</td>
                                                    <td className="py-3 px-4 text-[15px] font-black text-text-main text-right">₹{orderTotal.toLocaleString('en-IN')}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Raw JSON collapsible */}
                    <Card>
                        <div className="p-4">
                            <details className="group">
                                <summary className="flex items-center gap-2 text-[12px] font-bold text-text-muted uppercase tracking-wider select-none outline-none hover:text-text-main transition-colors list-none cursor-pointer">
                                    <FileText size={14} />
                                    Raw Database Payload
                                    <span className="ml-auto text-[11px] font-semibold text-blue-500 group-open:hidden">Show</span>
                                    <span className="ml-auto text-[11px] font-semibold text-blue-500 hidden group-open:inline">Hide</span>
                                </summary>
                                <pre className="mt-4 text-[11px] font-mono leading-relaxed bg-bg border border-border rounded-xl p-4 overflow-x-auto whitespace-pre select-all max-h-64 text-text-muted">
                                    {JSON.stringify(txData.raw, null, 2)}
                                </pre>
                            </details>
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Store size={16} className="text-accent-primary" />
                                Restaurant
                            </CardTitle>
                        </CardHeader>
                        <div className="p-5 flex flex-col gap-4">
                            <div className="text-[15px] font-bold text-text-main">{txData.restaurant?.name || 'Unknown'}</div>
                            {txData.restaurant?.contact_email && (
                                <a href={`mailto:${txData.restaurant.contact_email}`} className="text-[13px] text-blue-500 hover:underline flex items-center gap-1.5 font-medium">
                                    <Mail size={12} /> {txData.restaurant.contact_email}
                                </a>
                            )}
                            {txData.restaurant?.contact_phone && (
                                <div className="text-[13px] font-medium text-text-main flex items-center gap-1.5">
                                    <Phone size={12} className="text-text-muted" /> {txData.restaurant.contact_phone}
                                </div>
                            )}
                            {txData.restaurant?.id && (
                                <button
                                    onClick={() => navigate(`/restaurants/${txData.restaurant.id}`)}
                                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-border text-[13px] font-bold text-text-muted hover:text-text-main hover:bg-surface-hover transition-all cursor-pointer bg-transparent"
                                >
                                    View Restaurant <ArrowUpRight size={14} />
                                </button>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <User size={16} className="text-accent-primary" />
                                Customer
                            </CardTitle>
                        </CardHeader>
                        <div className="p-5">
                            {txData.customer ? (
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center shrink-0">
                                            <User size={18} className="text-accent-primary" />
                                        </div>
                                        <div>
                                            <div className="text-[14px] font-bold text-text-main">{txData.customer.name || 'Anonymous'}</div>
                                            <div className="text-[12px] text-text-muted">Customer</div>
                                        </div>
                                    </div>
                                    {txData.customer.email && (
                                        <a href={`mailto:${txData.customer.email}`} className="text-[13px] text-blue-500 hover:underline flex items-center gap-1.5 font-medium">
                                            <Mail size={12} /> {txData.customer.email}
                                        </a>
                                    )}
                                    {txData.customer.id && (
                                        <button
                                            onClick={() => navigate(`/users/${txData.customer.id}`)}
                                            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-border text-[13px] font-bold text-text-muted hover:text-text-main hover:bg-surface-hover transition-all cursor-pointer bg-transparent"
                                        >
                                            View Profile <ArrowUpRight size={14} />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="text-sm text-text-muted italic flex items-center gap-1.5 py-2">
                                    <Info size={14} /> No customer linked.
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
