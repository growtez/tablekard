import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { 
    ChevronLeft, 
    CreditCard, 
    Store, 
    Calendar, 
    Clock, 
    User, 
    Mail, 
    FileText, 
    AlertCircle,
    Hash,
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

const STATUS_VARIANTS = {
    paid: 'success',
    completed: 'success',
    pending: 'warning',
    failed: 'error',
    refunded: 'info'
};

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
                // Fetch from payments
                const { data: payment, error: pErr } = await supabase
                    .from('payments')
                    .select(`
                        *,
                        restaurants(id, name, slug, contact_email, contact_phone),
                        orders(*),
                        profiles:user_id(id, email, name)
                    `)
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
                // Fetch from orders
                const { data: order, error: oErr } = await supabase
                    .from('orders')
                    .select(`
                        *,
                        restaurants(id, name, slug, contact_email, contact_phone),
                        profiles:customer_id(id, email, name)
                    `)
                    .eq('id', id)
                    .single();

                if (oErr) throw oErr;

                // Also attempt to get any associated payment record
                const { data: assocPayments } = await supabase
                    .from('payments')
                    .select('*')
                    .eq('order_id', id);

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
            const { data: items, error } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', orderId);
            
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
        if (time) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        return new Date(d).toLocaleDateString('en-IN', options);
    };

    if (loading) {
        return <DetailPageSkeleton />;
    }

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

    return (
        <div className="animate-fade-in max-w-[1200px] mx-auto pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Transaction Info (ColSpan 2) */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    {/* General Card */}
                    <Card>
                        <CardHeader className="flex justify-between items-center border-b border-border pb-4">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <CreditCard size={18} className="text-accent-primary" />
                                Transaction Overview
                            </CardTitle>
                            <Badge variant={STATUS_VARIANTS[txData.status?.toLowerCase()] || 'secondary'}>
                                {txData.status?.toUpperCase()}
                            </Badge>
                        </CardHeader>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div>
                                    <div className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-1">Transaction ID</div>
                                    <div className="text-sm font-semibold text-text-main font-mono">{txData.id}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-1">Amount</div>
                                    <div className="text-xl font-black text-text-main font-mono">₹{txData.amount?.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-1">Gateway</div>
                                    <div className="text-sm font-semibold text-text-main capitalize">{txData.gateway}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-1">Razorpay Payment ID</div>
                                    <div className="text-sm font-semibold text-text-main font-mono break-all">{txData.gateway_payment_id || '—'}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-1">Created At</div>
                                    <div className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                                        <Calendar size={14} className="text-text-muted" />
                                        {formatDate(txData.created_at, true)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-1">Source Record</div>
                                    <div className="text-sm font-semibold text-text-main capitalize">{source} Table</div>
                                </div>
                            </div>

                            {txData.failure_reason && (
                                <div className="mt-6 p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex gap-3">
                                    <AlertCircle className="text-red-500 shrink-0" size={18} />
                                    <div>
                                        <div className="text-xs font-bold text-red-600 uppercase mb-0.5">Payment Failure Reason</div>
                                        <p className="text-sm text-red-600/90 font-medium">{txData.failure_reason}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Order Details & Items */}
                    {orderData && (
                        <Card>
                            <CardHeader className="flex justify-between items-center border-b border-border pb-4">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <ShoppingCart size={18} className="text-accent-primary" />
                                    Order Info: #{orderData.order_number}
                                </CardTitle>
                                <div className="flex gap-2">
                                    {orderData.type && (
                                        <Badge variant="outline" className="capitalize">
                                            {orderData.type}
                                        </Badge>
                                    )}
                                    {orderData.status && (
                                        <Badge variant={orderData.status === 'completed' ? 'success' : orderData.status === 'cancelled' ? 'error' : 'warning'}>
                                            {orderData.status?.toUpperCase()}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>

                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b border-border">
                                    <div>
                                        <div className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-1">Order UUID</div>
                                        <div className="text-sm font-semibold text-text-main font-mono truncate" title={orderData.id}>{orderData.id}</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-1">Payment Method</div>
                                        <div className="text-sm font-semibold text-text-main capitalize">{orderData.payment_method || '—'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-1">Order Date</div>
                                        <div className="text-sm font-semibold text-text-main">{formatDate(orderData.created_at, true)}</div>
                                    </div>
                                </div>

                                <div className="text-sm font-bold text-text-main mb-3">Order Items ({orderItems.length})</div>
                                {orderItems.length === 0 ? (
                                    <div className="text-center py-6 text-text-muted border border-dashed border-border rounded-xl">
                                        No item details available.
                                    </div>
                                ) : (
                                    <div className="border border-border rounded-xl overflow-hidden">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-border bg-bg/50">
                                                    <th className="py-2.5 px-4 text-xs font-bold text-text-muted w-[50%]">Item Name</th>
                                                    <th className="py-2.5 px-4 text-xs font-bold text-text-muted w-[15%] text-right">Price</th>
                                                    <th className="py-2.5 px-4 text-xs font-bold text-text-muted w-[15%] text-right">Qty</th>
                                                    <th className="py-2.5 px-4 text-xs font-bold text-text-muted w-[20%] text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orderItems.map((item, idx) => (
                                                    <tr key={item.id || idx} className="border-b border-border last:border-b-0">
                                                        <td className="py-2.5 px-4 text-[13px] font-semibold text-text-main">
                                                            {item.name}
                                                            {item.variant_name && <span className="text-[11px] text-text-muted ml-2">({item.variant_name})</span>}
                                                        </td>
                                                        <td className="py-2.5 px-4 text-[13px] text-text-main text-right">₹{item.price?.toLocaleString()}</td>
                                                        <td className="py-2.5 px-4 text-[13px] text-text-main text-right">{item.quantity}</td>
                                                        <td className="py-2.5 px-4 text-[13px] font-bold text-text-main text-right">₹{(item.price * item.quantity)?.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Sidebar details */}
                <div className="flex flex-col gap-8">
                    {/* Restaurant Info */}
                    <Card>
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Store size={18} className="text-accent-primary" />
                                Restaurant Details
                            </CardTitle>
                        </CardHeader>
                        <div className="p-6 flex flex-col gap-4">
                            <div>
                                <div className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-0.5">Name</div>
                                <div className="text-[14px] font-bold text-text-main">{txData.restaurant?.name || 'Unknown Restaurant'}</div>
                            </div>
                            <div>
                                <div className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-0.5">Slug</div>
                                <div className="text-[13px] font-mono text-text-main">/{txData.restaurant?.slug || '—'}</div>
                            </div>
                            {txData.restaurant?.contact_email && (
                                <div>
                                    <div className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-0.5">Contact Email</div>
                                    <a href={`mailto:${txData.restaurant.contact_email}`} className="text-[13px] font-medium text-blue-500 hover:underline flex items-center gap-1">
                                        <Mail size={12} /> {txData.restaurant.contact_email}
                                    </a>
                                </div>
                            )}
                            {txData.restaurant?.contact_phone && (
                                <div>
                                    <div className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-0.5">Contact Phone</div>
                                    <div className="text-[13px] font-medium text-text-main flex items-center gap-1">
                                        <Phone size={12} className="text-text-muted" /> {txData.restaurant.contact_phone}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Customer Info */}
                    <Card>
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <User size={18} className="text-accent-primary" />
                                Customer Details
                            </CardTitle>
                        </CardHeader>
                        <div className="p-6">
                            {txData.customer ? (
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <div className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-0.5">Name</div>
                                        <div className="text-[14px] font-bold text-text-main">{txData.customer.name || 'Anonymous Customer'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-0.5">Email</div>
                                        <a href={`mailto:${txData.customer.email}`} className="text-[13px] font-medium text-blue-500 hover:underline flex items-center gap-1">
                                            <Mail size={12} /> {txData.customer.email}
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-text-muted italic opacity-70 flex items-center gap-1.5">
                                    <Info size={14} /> No customer details linked to this transaction record.
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Raw JSON View */}
                    <Card>
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                <FileText size={14} />
                                Raw Record JSON
                            </CardTitle>
                        </CardHeader>
                        <div className="p-4">
                            <details className="cursor-pointer group">
                                <summary className="text-xs text-blue-500 font-semibold select-none outline-none hover:underline">
                                    Show Database Payload
                                </summary>
                                <pre className="mt-3 text-[11px] font-mono leading-relaxed bg-bg border border-border rounded-xl p-3 overflow-x-auto whitespace-pre select-all max-h-60">
                                    {JSON.stringify(txData.raw, null, 2)}
                                </pre>
                            </details>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
