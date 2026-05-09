import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { CheckCircle, Zap, Building2 } from 'lucide-react';

const PLANS = [
    {
        id: 'lite',
        name: 'Lite Plan',
        price: 999,
        duration: 30,
        color: '#3b82f6',
        description: 'Perfect for single-outlet restaurants just getting started.',
        features: [
            'QR Table Ordering',
            'Up to 50 Menu Items',
            'Basic Order Management',
            'Email Support',
            'Customer App Access',
        ],
        icon: Zap,
    },
    {
        id: 'pro',
        name: 'Pro Plan',
        price: 2499,
        duration: 30,
        color: 'var(--accent-primary)',
        description: 'For growing restaurants that need advanced features.',
        features: [
            'Everything in Lite',
            'Unlimited Menu Items',
            'AR Model Uploads (3D)',
            'Revenue Analytics',
            'Priority Support',
            'Multi-Staff Access',
            'Custom Branding',
        ],
        icon: Building2,
        recommended: true,
    },
];

export default function Plans() {
    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Pricing Plans</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Current platform plans available to restaurants. Edit plans via Supabase <code style={{ background: 'var(--surface-hover)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.8rem' }}>platform_settings</code>.
                </p>
            </div>

            <div className="plans-grid">
                {PLANS.map(plan => (
                    <div
                        key={plan.id}
                        className="premium-card"
                        style={{
                            border: plan.recommended ? `2px solid ${plan.color}` : '1px solid var(--border-color)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {plan.recommended && (
                            <div style={{
                                position: 'absolute', top: '1rem', right: '1rem',
                                background: plan.color, color: 'black', fontSize: '0.65rem',
                                fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
                                letterSpacing: '0.05em', textTransform: 'uppercase'
                            }}>
                                Recommended
                            </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${plan.color}20`, color: plan.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <plan.icon size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{plan.name}</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{plan.description}</p>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <span style={{ fontSize: '2rem', fontWeight: 800, color: plan.color }}>₹{plan.price.toLocaleString()}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}> / {plan.duration} days</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '2rem' }}>
                            {plan.features.map(f => (
                                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <CheckCircle size={14} style={{ color: plan.color, flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{f}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Plan key: <code style={{ background: 'var(--surface-hover)', padding: '1px 6px', borderRadius: '4px' }}>{plan.id}</code>
                        </div>
                    </div>
                ))}
            </div>

            <div className="premium-card" style={{ marginTop: '2rem', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    <strong style={{ color: 'var(--text-main)' }}>ℹ️ Plan Configuration</strong><br />
                    Pricing and plan features are managed via the <code>platform_settings</code> table in Supabase under the key <code>billing_plans</code>. Subscription payments are recorded in the <code>subscription_payments</code> table and linked to each restaurant.
                </div>
            </div>
        </div>
    );
}
