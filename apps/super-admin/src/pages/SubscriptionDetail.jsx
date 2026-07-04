import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
    ChevronLeft, 
    CreditCard, 
    Store, 
    Calendar, 
    Clock, 
    User, 
    Mail, 
    FileText, 
    ShieldCheck, 
    AlertCircle,
    ArrowUpRight,
    CheckCircle2,
    XCircle,
    Timer,
    Hash,
    ExternalLink,
    Receipt,
    Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { DetailPageSkeleton } from '../components/ui/Skeleton';

const STATUS_VARIANTS = { paid: 'success', pending: 'warning', failed: 'error' };

export default function SubscriptionDetail({ setHeaderData }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('payment');

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const { data: row, error: err } = await supabase
                .from('subscription_payments')
                .select(`
                    *,
                    restaurants(id, name, slug, subscription_type, contact_email, contact_phone, logo_url),
                    profiles:user_id(email, name)
                `)
                .eq('id', id)
                .single();

            if (err) throw err;
            setData(row);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
        return () => setHeaderData && setHeaderData(null);
    }, [id]);

    useEffect(() => {
        if (data && setHeaderData) {
            setHeaderData({
                id: data.id,
                name: data.restaurants?.name || 'Unknown',
                status: data.status,
                backPath: '/subscriptions',
                backTitle: 'Back to Subscriptions'
            });
        }
    }, [data, setHeaderData]);

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

    if (error || !data) {
        return (
            <div className="animate-fade-in p-8 text-center">
                <AlertCircle size={48} className="text-red-500 opacity-50 mb-4 mx-auto" />
                <h2 className="text-2xl font-bold mb-2">Transaction Not Found</h2>
                <p className="text-text-muted mb-6">{error || 'The requested transaction could not be located.'}</p>
                <button onClick={() => navigate('/subscriptions')} className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-black font-bold rounded-xl mx-auto shadow-sm hover:shadow-md transition-all">
                    <ChevronLeft size={18} /> Back to Subscriptions
                </button>
            </div>
        );
    }

    const isPaid = data.status === 'paid';
    const isFailed = data.status === 'failed';
    const isPending = data.status === 'pending';

    return (
        <div className="animate-fade-in max-w-[1000px] mx-auto pb-12">
            {/* Context Area (Non-duplicated header) */}
            <div className="flex items-center gap-6 mb-10">
                <div className="w-14 h-14 rounded-2xl bg-accent-primary/10 flex items-center justify-center shrink-0">
                    <Receipt size={28} className="text-accent-primary" />
                </div>
                <div>
                    <h2 className="text-xl font-extrabold m-0">
                        ₹{Number(data.amount).toLocaleString()}
                    </h2>
                    <p className="text-sm text-text-muted mt-1">
                        Settled via Razorpay • {formatDate(data.created_at, true)}
                    </p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-10 border-b border-border mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
                {[
                    { id: 'payment', label: 'Payment Details', icon: CreditCard },
                    { id: 'plan', label: 'Plan Scope', icon: ShieldCheck },
                    { id: 'entities', label: 'Related Entities', icon: Store }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 py-4 text-sm font-semibold border-b-2 transition-all bg-transparent cursor-pointer ${activeTab === tab.id ? 'text-accent-primary border-accent-primary' : 'text-text-muted border-transparent hover:text-text-main'}`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="tab-content">
                {activeTab === 'payment' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-8">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <CreditCard size={18} className="text-accent-primary" />
                                        <CardTitle className="m-0">Financial Summary</CardTitle>
                                    </div>
                                </CardHeader>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Amount Collected</div>
                                        <div className={`text-4xl font-extrabold ${isPaid ? 'text-accent-primary' : ''}`}>
                                            ₹{Number(data.amount).toLocaleString()}
                                            <span className="text-base font-medium ml-2 opacity-60">{data.currency}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Gateway Status</div>
                                        <div className="flex items-center gap-2 text-xl font-bold">
                                            {isPaid && <CheckCircle2 size={24} className="text-emerald-500" />}
                                            {isFailed && <XCircle size={24} className="text-red-500" />}
                                            {isPending && <Timer size={24} className="text-amber-500" />}
                                            {data.status.toUpperCase()}
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-t border-border my-8" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Razorpay Payment ID</div>
                                            <code className="text-[15px] font-semibold text-accent-primary">{data.razorpay_payment_id || '—'}</code>
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Razorpay Order ID</div>
                                            <code className="text-[15px]">{data.razorpay_order_id || '—'}</code>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Initiated At</div>
                                            <div className="text-[15px] font-semibold">{formatDate(data.created_at, true)}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Payment Settled</div>
                                            <div className="text-[15px] font-semibold">{formatDate(data.paid_at, true)}</div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                        <div className="lg:col-span-4">
                            <Card className="bg-gradient-to-br from-surface to-purple-500/5">
                                <CardHeader><CardTitle className="m-0">Payment Method</CardTitle></CardHeader>
                                <div className="flex flex-col items-center py-4 text-center">
                                    <div className="w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center mb-4">
                                        <Hash size={24} className="text-accent-secondary" />
                                    </div>
                                    <div className="font-bold text-lg">Razorpay Gateway</div>
                                    <p className="text-xs text-text-muted mt-2">
                                        Secure online payment processed via Razorpay API.
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'plan' && (
                    <div className="grid grid-cols-1 gap-6">
                        <div className="col-span-1">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck size={18} className="text-amber-500" />
                                        <CardTitle className="m-0">Subscription Coverage</CardTitle>
                                    </div>
                                </CardHeader>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
                                    <div className="bg-surface-hover p-6 rounded-2xl text-center">
                                        <Clock size={28} className="text-amber-500 mb-4 opacity-80 mx-auto" />
                                        <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Plan Duration</div>
                                        <div className="text-2xl font-extrabold">
                                            {data.plan_duration} {data.plan_duration === 1 ? 'Month' : 'Months'}
                                        </div>
                                    </div>
                                    <div className="bg-surface-hover p-6 rounded-2xl text-center">
                                        <Calendar size={28} className="text-accent-primary mb-4 opacity-80 mx-auto" />
                                        <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Activation Date</div>
                                        <div className="text-xl font-bold">{formatDate(data.starts_at)}</div>
                                    </div>
                                    <div className="bg-surface-hover p-6 rounded-2xl text-center">
                                        <Timer size={28} className={`${data.ends_at && new Date(data.ends_at) < new Date() ? 'text-red-500' : 'text-accent-secondary'} mb-4 opacity-80 mx-auto`} />
                                        <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Expiration Date</div>
                                        <div className={`text-xl font-bold ${data.ends_at && new Date(data.ends_at) < new Date() ? 'text-red-700' : ''}`}>
                                            {formatDate(data.ends_at)}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 p-6 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                    <div className="font-semibold text-[15px] text-amber-700 flex items-center gap-2">
                                        <Info size={16} /> Plan Information
                                    </div>
                                    <p className="text-sm text-text-muted mt-2 leading-relaxed">
                                        This subscription grants the restaurant full access to the platform's features for the specified duration. 
                                        The plan type is determined by the pricing tier selected during checkout. 
                                        {data.ends_at && new Date(data.ends_at) < new Date() ? " This plan has already expired." : " This plan is currently active."}
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'entities' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <Store size={18} className="text-emerald-500" />
                                        <CardTitle className="m-0">Restaurant Profile</CardTitle>
                                    </div>
                                </CardHeader>
                                <div className="flex items-center gap-5 mb-8">
                                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold bg-surface-hover border border-border overflow-hidden">
                                        {data.restaurants?.logo_url ? <img src={data.restaurants.logo_url} alt="" className="w-full h-full object-cover" /> : data.restaurants?.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-extrabold text-xl">{data.restaurants?.name}</div>
                                        <div className="text-sm text-accent-primary">/{data.restaurants?.slug}</div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-text-muted">Subscription Tier</span>
                                        <Badge variant="info">{data.restaurants?.subscription_type || 'Lite Plan'}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-text-muted">Contact Email</span>
                                        <span className="text-sm font-medium">{data.restaurants?.contact_email || '—'}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => navigate(`/restaurants/${data.restaurant_id}`)}
                                    className="w-full mt-8 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-primary text-black font-bold rounded-xl hover:shadow-md transition-all border-none cursor-pointer"
                                >
                                    Open Restaurant Details <ExternalLink size={14} />
                                </button>
                            </Card>
                        </div>
                        <div className="col-span-1">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <User size={18} className="text-blue-500" />
                                        <CardTitle className="m-0">Payer Details</CardTitle>
                                    </div>
                                </CardHeader>
                                <div className="space-y-6">
                                    <div className="p-5 bg-surface-hover rounded-2xl">
                                        <div className="text-lg font-bold">{data.profiles?.name || 'Unknown Payer'}</div>
                                        <div className="text-sm text-text-muted flex items-center gap-2 mt-1">
                                            <Mail size={14} /> {data.profiles?.email}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Payer Identifier (UUID)</div>
                                        <code className="block text-sm p-3 bg-surface border border-border rounded-xl opacity-70 font-mono break-all">
                                            {data.user_id}
                                        </code>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
