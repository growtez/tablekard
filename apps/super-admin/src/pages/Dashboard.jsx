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
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color || entry.fill || 'var(--color-accent-primary)' }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{entry.name}:</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
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
                chartData.push({ 
                    month: MONTH_NAMES[d.getMonth()], 
                    revenue: monthlyMap[key]?.revenue || 0, 
                    orders: monthlyMap[key]?.orders || 0,
                    monthKey: key 
                });
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
        <div style={{ height: '1.5rem', width: '4rem', borderRadius: '6px', background: '#F7FAFC', animation: 'pulse 1.5s infinite' }} />
    );

    return (
        <div className="animate-fade-in w-full">
            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card 
                    className="lg:col-span-8 min-w-0 cursor-pointer hover:border-accent-primary/40 transition-colors group/card"
                    onClick={() => navigate('/subscriptions')}
                >
                    <CardHeader className="group-hover/card:text-accent-primary transition-colors">
                        <CardTitle>Subscription Revenue (Last 6 Months)</CardTitle>
                    </CardHeader>
                    <div className="h-[300px] w-full" onClick={(e) => e.stopPropagation()}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v === 0 ? '₹0' : `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface-hover)' }} />
                                <Bar 
                                    dataKey="revenue" 
                                    name="Revenue" 
                                    fill="var(--color-accent-primary)" 
                                    radius={[6, 6, 0, 0]} 
                                    maxBarSize={45} 
                                    onClick={(data, index, event) => {
                                        if (event) event.stopPropagation();
                                        if (data && data.monthKey) {
                                            navigate(`/subscriptions?month=${data.monthKey}`);
                                        } else {
                                            navigate('/subscriptions');
                                        }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
 
                <Card 
                    className="lg:col-span-4 cursor-pointer hover:border-accent-primary/40 transition-colors group/card"
                    onClick={() => navigate('/subscriptions')}
                >
                    <CardHeader className="group-hover/card:text-accent-primary transition-colors">
                            <CardTitle>Recent Subscriptions</CardTitle>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse"></span>
                                <span className="text-xs font-medium text-accent-primary uppercase tracking-wider">Live</span>
                            </div>
                    </CardHeader>
                    <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                        {loading ? (
                            [...Array(4)].map((_, i) => (
                                <div key={i} className="p-3 rounded-xl bg-surface-hover h-14 animate-pulse" />
                            ))
                        ) : recentSubscriptions.length === 0 ? (
                            <div className="text-center p-8 text-text-muted text-sm flex flex-col items-center">
                                <CreditCard size={28} className="mb-2 opacity-30" />
                                <p>No subscriptions yet</p>
                            </div>
                        ) : recentSubscriptions.map(sub => (
                            <div 
                                key={sub.id} 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/subscriptions/${sub.id}`);
                                }}
                                className="flex gap-3 p-2 rounded-xl bg-surface-hover items-center cursor-pointer transition-colors hover:bg-border group/sub"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis text-text-main group-hover/sub:text-accent-primary transition-colors">
                                        {sub.restaurants?.name || 'Unknown'}
                                    </div>
                                    <div className="text-[11px] text-text-muted">
                                        {sub.plan_duration} Days Plan
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[13px] font-bold text-text-main">₹{Number(sub.amount).toLocaleString()}</div>
                                    <Badge variant={sub.status === 'paid' ? 'success' : 'warning'} className="text-[10px] px-1.5 py-0.5 mt-1 font-bold">
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
