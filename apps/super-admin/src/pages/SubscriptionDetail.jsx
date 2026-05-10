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
    Timer
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const STATUS_VARIANTS = { paid: 'success', pending: 'warning', failed: 'error' };

export default function SubscriptionDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
    }, [id]);

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
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem' }}>
                <div className="loader" />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Fetching transaction details...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
                <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Transaction Not Found</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error || 'The requested transaction could not be located.'}</p>
                <button onClick={() => navigate('/subscriptions')} className="btn-primary">
                    <ChevronLeft size={18} /> Back to Subscriptions
                </button>
            </div>
        );
    }

    const isPaid = data.status === 'paid';
    const isFailed = data.status === 'failed';
    const isPending = data.status === 'pending';

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/subscriptions')} className="btn-close-drawer" style={{ background: 'var(--surface-hover)', width: '40px', height: '40px' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Transaction Details</h1>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>ID: {data.id}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Badge variant={STATUS_VARIANTS[data.status]} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                        {data.status?.toUpperCase()}
                    </Badge>
                </div>
            </div>

            <div className="dashboard-chart-grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
                {/* Left Column: Summary Card */}
                <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card>
                        <CardHeader>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <CreditCard size={18} color="var(--accent-primary)" />
                                <CardTitle>Payment Information</CardTitle>
                            </div>
                        </CardHeader>
                        <div style={{ padding: '0.5rem 0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Amount & Currency</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 800, color: isPaid ? 'var(--accent-primary)' : 'inherit' }}>
                                        ₹{Number(data.amount).toLocaleString()}
                                        <span style={{ fontSize: '1rem', fontWeight: 500, marginLeft: '8px', opacity: 0.6 }}>{data.currency}</span>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Transaction Status</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 600 }}>
                                        {isPaid && <CheckCircle2 size={20} color="#10b981" />}
                                        {isFailed && <XCircle size={20} color="#ef4444" />}
                                        {isPending && <Timer size={20} color="#f59e0b" />}
                                        {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                                    </div>
                                </div>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="space-y-4">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Razorpay Payment ID</span>
                                        <code style={{ fontSize: '0.9rem', color: 'var(--accent-primary)' }}>{data.razorpay_payment_id || '—'}</code>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Razorpay Order ID</span>
                                        <code style={{ fontSize: '0.9rem' }}>{data.razorpay_order_id || '—'}</code>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created At</span>
                                        <span style={{ fontSize: '0.9rem' }}>{formatDate(data.created_at, true)}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completed At</span>
                                        <span style={{ fontSize: '0.9rem' }}>{formatDate(data.paid_at, true)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <ShieldCheck size={18} color="#f59e0b" />
                                <CardTitle>Subscription Plan Scope</CardTitle>
                            </div>
                        </CardHeader>
                        <div style={{ padding: '0.5rem 0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                                <div style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                                    <Clock size={20} style={{ marginBottom: '0.5rem', opacity: 0.6 }} />
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Duration</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{data.plan_duration} Days</div>
                                </div>
                                <div style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                                    <Calendar size={20} style={{ marginBottom: '0.5rem', opacity: 0.6 }} />
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Starts On</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatDate(data.starts_at)}</div>
                                </div>
                                <div style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                                    <Timer size={20} style={{ marginBottom: '0.5rem', opacity: 0.6 }} />
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ends On</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: data.ends_at && new Date(data.ends_at) < new Date() ? '#ef4444' : 'inherit' }}>
                                        {formatDate(data.ends_at)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Entity Cards */}
                <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card>
                        <CardHeader>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Store size={18} color="#10b981" />
                                <CardTitle>Restaurant</CardTitle>
                            </div>
                        </CardHeader>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div className="user-avatar" style={{ width: '48px', height: '48px', borderRadius: '12px', fontSize: '1.2rem' }}>
                                {data.restaurants?.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{data.restaurants?.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/{data.restaurants?.slug}</div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Badge variant="secondary">{data.restaurants?.subscription_type}</Badge>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                                <Mail size={14} color="var(--text-muted)" />
                                <span>{data.restaurants?.contact_email || 'No email set'}</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate(`/restaurants/${data.restaurant_id}`)}
                            className="btn-ghost" 
                            style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center', border: '1px solid var(--border-color)' }}
                        >
                            View Restaurant <ArrowUpRight size={14} style={{ marginLeft: '6px' }} />
                        </button>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <User size={18} color="#3b82f6" />
                                <CardTitle>Initiated By</CardTitle>
                            </div>
                        </CardHeader>
                        <div className="space-y-4">
                            <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{data.profiles?.name || 'Unknown User'}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{data.profiles?.email}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>User ID</span>
                                <code style={{ fontSize: '0.75rem', opacity: 0.6 }}>{data.user_id}</code>
                            </div>
                        </div>
                    </Card>

                    <Card style={{ background: 'linear-gradient(135deg, var(--surface-color) 0%, rgba(99, 102, 241, 0.05) 100%)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0', textAlign: 'center' }}>
                            <FileText size={32} color="var(--accent-primary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Invoice & Logs</div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                Transaction logs and receipt data are available in the platform_logs table.
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
