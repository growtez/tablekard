import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    // PieChart,
    // Pie,
    // Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    // Legend
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
    const navigate = useNavigate();
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

            // 3. Subscription Status Pie — Categorize from restaurants table
            /* const { data: restSubData } = await supabase
                .from('restaurants')
                .select('subscription_status, subscription_end_at');

            if (restSubData) {
                const now = new Date();
                const counts = restSubData.reduce((acc, r) => {
                    if (r.subscription_status) {
                        acc.active++;
                    } else if (r.subscription_end_at && new Date(r.subscription_end_at) < now) {
                        acc.expired++;
                    } else {
                        acc.trial++;
                    }
                    return acc;
                }, { active: 0, expired: 0, trial: 0 });

                setSubscriptionPieData([
                    { name: 'Active', value: counts.active, color: '#10B981' },
                    { name: 'Expired', value: counts.expired, color: '#EF4444' },
                    { name: 'Trial / Free', value: counts.trial, color: '#3B82F6' },
                ].filter(d => d.value > 0));
            } */

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
                                <Bar 
                                    dataKey="revenue" 
                                    name="Revenue" 
                                    fill="var(--accent-primary)" 
                                    radius={[6, 6, 0, 0]} 
                                    maxBarSize={45} 
                                    onClick={() => navigate('/subscriptions')}
                                    style={{ cursor: 'pointer' }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card style={{ gridColumn: 'span 4' }}>
                    <CardHeader>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <CardTitle>Recent Subscriptions</CardTitle>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live</span>
                        </div>
                    </CardHeader>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
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
                            <div 
                                key={sub.id} 
                                onClick={() => navigate('/subscriptions')}
                                className="clickable-stat"
                                style={{ display: 'flex', gap: '0.75rem', padding: '0.6rem', borderRadius: '10px', background: 'var(--surface-hover)', alignItems: 'center', cursor: 'pointer' }}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {sub.restaurants?.name || 'Unknown'}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        {sub.plan_duration} Days Plan
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>₹{Number(sub.amount).toLocaleString()}</div>
                                    <Badge variant={sub.status === 'paid' ? 'success' : 'warning'} style={{ fontSize: '0.6rem', padding: '0px 4px' }}>
                                        {sub.status?.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
