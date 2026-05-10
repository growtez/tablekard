import { useState, useEffect } from 'react';
import {
    Store,
    Users,
    CreditCard,
    // Activity,
    // Utensils,
    // AlertCircle,
    // CheckCircle,
    // Server,
    // Database,
    TrendingUp,
    ShoppingBag,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { supabase } from '../supabaseClient';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PIE_COLORS = {
    paid: '#10B981',
    pending: '#3B82F6',
    failed: '#EF4444',
};

// const systemHealth = [
//     { name: 'API Server', uptime: '99.9%', icon: Server },
//     { name: 'Database', uptime: '99.8%', icon: Database },
//     { name: 'Payment Gateway', uptime: '100%', icon: CreditCard },
// ];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'rgba(10, 10, 15, 0.95)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color || entry.fill || 'var(--accent-primary)' }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{entry.name}:</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {entry.dataKey === 'revenue' ? `₹${Number(entry.value).toLocaleString()}` : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function Dashboard({ setSyncAction }) {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalRestaurants: 0,
        totalOrders: 0,
        totalRevenue: 0,
    });
    const [revenueChartData, setRevenueChartData] = useState([]);
    const [subscriptionPieData, setSubscriptionPieData] = useState([]);
    const [recentSubscriptions, setRecentSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRealStats = async () => {
        setLoading(true);
        try {
            // 1. Core counts from schema tables
            const [usersRes, restaurantsRes, subPaymentsRes] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('restaurants').select('*', { count: 'exact', head: true }),
                supabase.from('subscription_payments').select('amount, created_at').eq('status', 'paid').order('created_at', { ascending: true }),
            ]);

            const totalRevenue = (subPaymentsRes.data || []).reduce((sum, r) => sum + Number(r.amount || 0), 0);

            setStats({
                totalUsers: usersRes.count || 0,
                totalRestaurants: restaurantsRes.count || 0,
                totalSubscriptions: (subPaymentsRes.data || []).length,
                totalRevenue,
            });

            // 2. Revenue chart — aggregate by month from subscription_payments
            const monthlyMap = {};
            for (const row of (subPaymentsRes.data || [])) {
                const d = new Date(row.created_at);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, orders: 0, month: MONTH_NAMES[d.getMonth()] };
                monthlyMap[key].revenue += Number(row.amount || 0);
                monthlyMap[key].orders += 1; // Number of subscription payments
            }
            // Last 6 months
            const now = new Date();
            const chartData = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                chartData.push({ month: MONTH_NAMES[d.getMonth()], revenue: monthlyMap[key]?.revenue || 0, orders: monthlyMap[key]?.orders || 0 });
            }
            setRevenueChartData(chartData);

            // 3. Subscription pie — from subscription_payments table
            const { data: subData } = await supabase
                .from('subscription_payments')
                .select('status');
            if (subData && subData.length > 0) {
                const counts = subData.reduce((acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; }, {});
                setSubscriptionPieData(Object.entries(counts).map(([name, value]) => ({
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    value,
                    color: PIE_COLORS[name] || '#6366f1'
                })));
            } else {
                // Fallback: use restaurants subscription_status boolean
                const { data: restData } = await supabase.from('restaurants').select('subscription_status, subscription_type');
                if (restData) {
                    const active = restData.filter(r => r.subscription_status).length;
                    const trial = restData.filter(r => !r.subscription_status).length;
                    setSubscriptionPieData([
                        { name: 'Active (Paid)', value: active, color: '#10B981' },
                        { name: 'Trial / Free', value: trial, color: '#3B82F6' },
                    ].filter(d => d.value > 0));
                }
            }

            // 4. Recent subscriptions — latest 5 from subscription_payments join restaurants
            const { data: subsData } = await supabase
                .from('subscription_payments')
                .select('id, amount, status, plan_duration, created_at, restaurants(name)')
                .order('created_at', { ascending: false })
                .limit(5);
            setRecentSubscriptions(subsData || []);

        } catch (err) {
            console.error('Dashboard stats fetch failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRealStats(); }, []);

    useEffect(() => {
        if (setSyncAction) setSyncAction({ onSync: fetchRealStats, loading });
    }, [loading, setSyncAction]);

    const StatSkeleton = () => (
        <div style={{ height: '1.5rem', width: '4rem', borderRadius: '6px', background: 'var(--surface-hover)', animation: 'pulse 1.5s infinite' }} />
    );

    return (
        <div className="animate-fade-in">
            {/* ── Stat Cards Row ── */}
            <div className="dashboard-stat-grid">
                <StatCard
                    label="Total Restaurants"
                    value={loading ? '—' : stats.totalRestaurants.toLocaleString()}
                    icon={Store}
                    color="green"
                    path="/restaurants"
                />
                <StatCard
                    label="Total Users"
                    value={loading ? '—' : stats.totalUsers.toLocaleString()}
                    icon={Users}
                    color="blue"
                    path="/users"
                />
                <StatCard
                    label="Total Subscriptions"
                    value={loading ? '—' : stats.totalSubscriptions.toLocaleString()}
                    icon={CreditCard}
                    color="purple"
                    path="/subscriptions"
                />
                <StatCard
                    label="Platform Revenue"
                    value={loading ? '—' : `₹${stats.totalRevenue.toLocaleString()}`}
                    icon={TrendingUp}
                    color="orange"
                    path="/subscriptions"
                />
            </div>

            {/* ── Charts Row ── */}
            <div className="dashboard-chart-grid">
                <Card style={{ gridColumn: 'span 8', minWidth: 0 }}>
                    <CardHeader>
                        <CardTitle>Subscription Revenue (Last 6 Months)</CardTitle>
                    </CardHeader>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v === 0 ? '₹0' : `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface-hover)' }} />
                                <Bar dataKey="revenue" name="Revenue" fill="var(--accent-primary)" radius={[6, 6, 0, 0]} maxBarSize={45} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card style={{ gridColumn: 'span 4', minWidth: 0 }}>
                    <CardHeader>
                        <CardTitle>Subscription Status</CardTitle>
                    </CardHeader>
                    <div style={{ height: '300px', width: '100%' }}>
                        {subscriptionPieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={subscriptionPieData}
                                        cx="50%" cy="45%"
                                        innerRadius={60} outerRadius={90}
                                        paddingAngle={5} dataKey="value"
                                    >
                                        {subscriptionPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="bottom" align="center" iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <CreditCard size={32} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
                                No subscription data yet
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* ── Recent Activity + System Health ── */}
            <div className="dashboard-bottom-grid">
                <Card style={{ gridColumn: 'span 12' }}>
                    <CardHeader>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <CardTitle>Recent Subscription Payments</CardTitle>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live from DB</span>
                        </div>
                    </CardHeader>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {loading ? (
                            [...Array(4)].map((_, i) => (
                                <div key={i} style={{ padding: '0.75rem', borderRadius: '10px', background: 'var(--surface-hover)', height: '56px', animation: 'pulse 1.5s infinite' }} />
                            ))
                        ) : recentSubscriptions.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <CreditCard size={28} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                                <p>No subscriptions yet</p>
                            </div>
                        ) : recentSubscriptions.map(sub => (
                            <div key={sub.id} style={{ display: 'flex', gap: '1rem', padding: '0.75rem', borderRadius: '10px', background: 'var(--surface-hover)', alignItems: 'center' }}>
                                <div style={{ color: sub.status === 'paid' ? 'var(--accent-primary)' : sub.status === 'failed' ? '#ef4444' : '#3b82f6' }}>
                                    <CreditCard size={18} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {sub.restaurants?.name || 'Unknown Restaurant'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                        {sub.plan_duration} Days Plan — {new Date(sub.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>₹{Number(sub.amount).toLocaleString()}</span>
                                    <Badge variant={sub.status === 'paid' ? 'success' : sub.status === 'failed' ? 'error' : 'warning'} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                                        {sub.status?.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* <Card style={{ gridColumn: 'span 5' }}>
                    <CardHeader>
                        <CardTitle>System Health</CardTitle>
                    </CardHeader>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {systemHealth.map(service => (
                            <div key={service.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <service.icon size={18} />
                                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{service.name}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{service.uptime}</span>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 8px var(--accent-primary)' }} />
                                </div>
                            </div>
                        ))}

                        <div style={{ marginTop: '0.5rem', padding: '1rem', borderRadius: '12px', background: 'var(--accent-primary-glow)', border: '1px solid hsla(155,100%,50%,0.15)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Stats</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {[
                                    { label: 'Restaurants', value: stats.totalRestaurants },
                                    { label: 'Users', value: stats.totalUsers },
                                    { label: 'Orders', value: stats.totalOrders },
                                    { label: 'Revenue', value: `₹${(stats.totalRevenue / 1000).toFixed(1)}k` }
                                ].map(item => (
                                    <div key={item.label}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.label}</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{loading ? '—' : item.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card> */}
            </div>
        </div>
    );
}
