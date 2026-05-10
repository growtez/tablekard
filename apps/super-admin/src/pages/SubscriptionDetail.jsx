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

const STATUS_VARIANTS = { paid: 'success', pending: 'warning', failed: 'error' };

export default function SubscriptionDetail() {
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
            {/* Header / Context Area */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '20px', 
                        background: 'var(--accent-primary-glow)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                    }}>
                        <Receipt size={32} color="var(--accent-primary)" />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Transaction Details</h1>
                            <Badge variant={STATUS_VARIANTS[data.status]} style={{ padding: '4px 12px' }}>
                                {data.status?.toUpperCase()}
                            </Badge>
                        </div>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            System ID: <code style={{ color: 'var(--accent-primary)' }}>{data.id}</code>
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div style={{ display: 'flex', gap: '2.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
                {[
                    { id: 'payment', label: 'Payment Details', icon: CreditCard },
                    { id: 'plan', label: 'Plan Scope', icon: ShieldCheck },
                    { id: 'entities', label: 'Related Entities', icon: Store }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '1rem 0',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                            borderBottom: `2px solid ${activeTab === tab.id ? 'var(--accent-primary)' : 'transparent'}`,
                            transition: 'all 0.2s',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="tab-content">
                {activeTab === 'payment' && (
                    <div className="dashboard-chart-grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
                        <div style={{ gridColumn: 'span 8' }}>
                            <Card>
                                <CardHeader>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <CreditCard size={18} color="var(--accent-primary)" />
                                        <CardTitle>Financial Summary</CardTitle>
                                    </div>
                                </CardHeader>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Amount Collected</div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: isPaid ? 'var(--accent-primary)' : 'inherit' }}>
                                            ₹{Number(data.amount).toLocaleString()}
                                            <span style={{ fontSize: '1rem', fontWeight: 500, marginLeft: '8px', opacity: 0.6 }}>{data.currency}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Gateway Status</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: 700 }}>
                                            {isPaid && <CheckCircle2 size={24} color="#10b981" />}
                                            {isFailed && <XCircle size={24} color="#ef4444" />}
                                            {isPending && <Timer size={24} color="#f59e0b" />}
                                            {data.status.toUpperCase()}
                                        </div>
                                    </div>
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '2rem 0' }} />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div className="space-y-6">
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Razorpay Payment ID</div>
                                            <code style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-primary)' }}>{data.razorpay_payment_id || '—'}</code>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Razorpay Order ID</div>
                                            <code style={{ fontSize: '0.95rem' }}>{data.razorpay_order_id || '—'}</code>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Initiated At</div>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{formatDate(data.created_at, true)}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Payment Settled</div>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{formatDate(data.paid_at, true)}</div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                        <div style={{ gridColumn: 'span 4' }}>
                            <Card style={{ background: 'linear-gradient(135deg, var(--surface-color) 0%, rgba(140, 100, 255, 0.05) 100%)' }}>
                                <CardHeader><CardTitle>Payment Method</CardTitle></CardHeader>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0', textAlign: 'center' }}>
                                    <div style={{ 
                                        width: '48px', 
                                        height: '48px', 
                                        borderRadius: '12px', 
                                        background: 'var(--surface-hover)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        marginBottom: '1rem'
                                    }}>
                                        <Hash size={24} color="var(--accent-secondary)" />
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Razorpay Gateway</div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                        Secure online payment processed via Razorpay API.
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'plan' && (
                    <div className="dashboard-chart-grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
                        <div style={{ gridColumn: 'span 12' }}>
                            <Card>
                                <CardHeader>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <ShieldCheck size={18} color="#f59e0b" />
                                        <CardTitle>Subscription Coverage</CardTitle>
                                    </div>
                                </CardHeader>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', padding: '1rem 0' }}>
                                    <div style={{ background: 'var(--surface-hover)', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}>
                                        <Clock size={28} color="#f59e0b" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan Duration</div>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{data.plan_duration} Days</div>
                                    </div>
                                    <div style={{ background: 'var(--surface-hover)', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}>
                                        <Calendar size={28} color="var(--accent-primary)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activation Date</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatDate(data.starts_at)}</div>
                                    </div>
                                    <div style={{ background: 'var(--surface-hover)', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}>
                                        <Timer size={28} color={data.ends_at && new Date(data.ends_at) < new Date() ? '#ef4444' : 'var(--accent-secondary)'} style={{ marginBottom: '1rem', opacity: 0.8 }} />
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expiration Date</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: data.ends_at && new Date(data.ends_at) < new Date() ? '#ef4444' : 'inherit' }}>
                                            {formatDate(data.ends_at)}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Info size={16} /> Plan Information
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.6 }}>
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
                    <div className="dashboard-chart-grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
                        <div style={{ gridColumn: 'span 6' }}>
                            <Card>
                                <CardHeader>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Store size={18} color="#10b981" />
                                        <CardTitle>Restaurant Profile</CardTitle>
                                    </div>
                                </CardHeader>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
                                    <div className="user-avatar" style={{ width: '64px', height: '64px', borderRadius: '16px', fontSize: '1.5rem', border: '1px solid var(--border-color)' }}>
                                        {data.restaurants?.logo_url ? <img src={data.restaurants.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : data.restaurants?.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>{data.restaurants?.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)' }}>/{data.restaurants?.slug}</div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Subscription Tier</span>
                                        <Badge variant="info">{data.restaurants?.subscription_type || 'Lite Plan'}</Badge>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Contact Email</span>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{data.restaurants?.contact_email || '—'}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => navigate(`/restaurants/${data.restaurant_id}`)}
                                    className="btn-primary" 
                                    style={{ width: '100%', marginTop: '2rem', justifyContent: 'center' }}
                                >
                                    Open Restaurant Details <ExternalLink size={14} style={{ marginLeft: '8px' }} />
                                </button>
                            </Card>
                        </div>
                        <div style={{ gridColumn: 'span 6' }}>
                            <Card>
                                <CardHeader>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <User size={18} color="#3b82f6" />
                                        <CardTitle>Payer Details</CardTitle>
                                    </div>
                                </CardHeader>
                                <div className="space-y-6">
                                    <div style={{ padding: '1.25rem', background: 'var(--surface-hover)', borderRadius: '16px' }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{data.profiles?.name || 'Unknown Payer'}</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                            <Mail size={14} /> {data.profiles?.email}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Payer Identifier (UUID)</div>
                                        <code style={{ fontSize: '0.85rem', display: 'block', padding: '12px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', opacity: 0.7 }}>
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
