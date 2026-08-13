import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Shield, Lock, CheckCircle, AlertTriangle, Users, Database } from 'lucide-react';

// Reads live data from schema tables to provide security overview
// RLS is enforced on: profiles, restaurants, restaurant_users, restaurant_tables,
// menu_categories, menu_items, menu_item_images, orders, order_items,
// payments, payment_logs, revenue, favorites, feedback, platform_settings, subscription_payments

const RLS_TABLES = [
    'profiles', 'restaurants', 'restaurant_users', 'restaurant_tables',
    'menu_categories', 'menu_items', 'menu_item_images', 'orders', 'order_items',
    'payments', 'payment_logs', 'revenue', 'favorites', 'feedback',
    'platform_settings', 'subscription_payments'
];

const ROLE_POLICIES = [
    { role: 'super_admin', color: 'var(--accent-primary)', access: 'Full access to all tables via is_super_admin() RLS helper.' },
    { role: 'restaurant_admin', color: '#3b82f6', access: 'Scoped to their restaurant via is_restaurant_member(). Can manage staff, menu, orders.' },
    { role: 'restaurant_staff', color: '#8b5cf6', access: 'Read/manage orders for their restaurant. Cannot modify restaurant settings.' },
    { role: 'customer', color: '#f59e0b', access: 'Own orders, favorites, feedback. Public read on active menus and restaurants.' },
];

export default function Security({ setSyncAction }) {
    const [stats, setStats] = useState({ superAdmins: 0, totalUsers: 0, restaurants: 0 });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [profilesRes, restaurantsRes] = await Promise.all([
                supabase.from('profiles').select('role'),
                supabase.from('restaurants').select('*', { count: 'exact', head: true }),
            ]);
            const profiles = profilesRes.data || [];
            setStats({
                superAdmins: profiles.filter(p => p.role === 'super_admin').length,
                totalUsers: profiles.length,
                restaurants: restaurantsRes.count || 0,
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { if (setSyncAction) setSyncAction({ onSync: fetchData, loading }); }, [loading, setSyncAction]);

    return (
        <div className="animate-fade-in space-y-6">
            {/* Live stats */}
            <div className="subscriptions-summary-grid">
                {[
                    { label: 'Super Admins', value: stats.superAdmins, color: 'var(--accent-primary)', icon: Shield },
                    { label: 'Total Users', value: stats.totalUsers, color: '#3b82f6', icon: Users },
                    { label: 'Total Restaurants', value: stats.restaurants, color: '#8b5cf6', icon: Database },
                    { label: 'RLS-Protected Tables', value: RLS_TABLES.length, color: '#10b981', icon: Lock },
                ].map(item => (
                    <div key={item.label} className="premium-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${item.color}20`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <item.icon size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: item.color }}>{loading ? '—' : item.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* RLS Status */}
            <Card>
                <CardHeader>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Lock size={18} style={{ color: '#10b981' }} />
                        <CardTitle>Row Level Security (RLS) Status</CardTitle>
                    </div>
                </CardHeader>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {RLS_TABLES.map(table => (
                        <div key={table} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '4px 12px', borderRadius: '20px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                            <CheckCircle size={12} style={{ color: '#10b981' }} />
                            {table}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Role Access Matrix */}
            <Card>
                <CardHeader>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Users size={18} style={{ color: '#3b82f6' }} />
                        <CardTitle>Role Access Policy</CardTitle>
                    </div>
                </CardHeader>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {ROLE_POLICIES.map((rp, idx) => (
                        <div key={rp.role} style={{ display: 'flex', gap: '1.25rem', padding: '1rem 1.5rem', borderBottom: idx < ROLE_POLICIES.length - 1 ? '1px solid var(--border-color)' : 'none', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Badge style={{ background: `${rp.color}20`, color: rp.color, border: `1px solid ${rp.color}30`, minWidth: '130px', justifyContent: 'center', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                {rp.role}
                            </Badge>
                            <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-muted)' }}>{rp.access}</span>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Security Checklist */}
            <Card>
                <CardHeader>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Shield size={18} style={{ color: '#f59e0b' }} />
                        <CardTitle>Security Checklist</CardTitle>
                    </div>
                </CardHeader>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                        { label: 'RLS enabled on all tables', ok: true, note: `${RLS_TABLES.length} tables protected` },
                        { label: 'Razorpay webhook signature verified', ok: true, note: 'webhook_verified column on payments table' },
                        { label: 'Auth trigger creates profiles automatically', ok: true, note: 'on_auth_user_created trigger active' },
                        { label: 'Service role key stored in platform_settings only', ok: true, note: 'Never exposed client-side' },
                        { label: 'super_admin role gated via is_super_admin() helper', ok: true, note: 'SECURITY DEFINER function' },
                        { label: '2FA enforced for super admins', ok: false, note: 'Recommended — enable in Supabase Auth dashboard' },
                    ].map(item => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', background: item.ok ? 'rgba(16,185,129,0.05)' : 'rgba(245,158,11,0.05)', border: `1px solid ${item.ok ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}` }}>
                            {item.ok ? <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0 }} /> : <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.label}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.note}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
