import { useState, useEffect } from 'react';
import {
    Store,
    TrendingUp,
    DollarSign,
    Users,
    Plus,
    Activity,
    Utensils,
    AlertCircle,
    CheckCircle,
    Clock,
    ArrowUpRight,
    Zap,
    Server,
    Database,
    CreditCard
} from 'lucide-react';
import {
    AreaChart,
    Area,
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

// Static Data for Charts
const revenueData = [
    { month: 'Jan', revenue: 45000, orders: 320 },
    { month: 'Feb', revenue: 52000, orders: 380 },
    { month: 'Mar', revenue: 48000, orders: 350 },
    { month: 'Apr', revenue: 61000, orders: 420 },
    { month: 'May', revenue: 55000, orders: 390 },
    { month: 'Jun', revenue: 67000, orders: 450 },
    { month: 'Jul', revenue: 72000, orders: 480 },
    { month: 'Aug', revenue: 69000, orders: 470 },
    { month: 'Sep', revenue: 78000, orders: 520 },
    { month: 'Oct', revenue: 85000, orders: 580 },
    { month: 'Nov', revenue: 82000, orders: 560 },
    { month: 'Dec', revenue: 91000, orders: 620 },
];

const restaurantStatusData = [
    { name: 'Active', value: 45, color: '#10B981' },
    { name: 'Trial', value: 12, color: '#3B82F6' },
    { name: 'Expired', value: 8, color: '#EF4444' },
    { name: 'Suspended', value: 5, color: '#F59E0B' },
];

const weeklyOrderData = [
    { day: 'Mon', orders: 145 },
    { day: 'Tue', orders: 182 },
    { day: 'Wed', orders: 165 },
    { day: 'Thu', orders: 198 },
    { day: 'Fri', orders: 234 },
    { day: 'Sat', orders: 287 },
    { day: 'Sun', orders: 256 },
];

const topRestaurants = [
    { id: 1, name: 'Spice Garden', orders: 1245, revenue: 245000, rating: 4.8, trend: '+12%' },
    { id: 2, name: 'Biryani House', orders: 1120, revenue: 198000, rating: 4.7, trend: '+8%' },
    { id: 3, name: 'Tandoori Nights', orders: 980, revenue: 176000, rating: 4.6, trend: '+15%' },
    { id: 4, name: 'Curry Palace', orders: 856, revenue: 154000, rating: 4.5, trend: '+5%' },
    { id: 5, name: 'Masala Dhaba', orders: 743, revenue: 132000, rating: 4.4, trend: '+10%' },
];

const recentActivities = [
    { id: 1, type: 'order', message: 'New order #ORD-4521 received from Spice Garden', time: '2 mins ago', icon: Utensils, color: 'blue' },
    { id: 2, type: 'restaurant', message: 'Royal Kitchen joined the platform', time: '15 mins ago', icon: Store, color: 'green' },
    { id: 3, type: 'payment', message: 'Payment of ₹12,450 received from Biryani House', time: '32 mins ago', icon: CreditCard, color: 'purple' },
    { id: 4, type: 'alert', message: 'Curry Palace subscription expires in 3 days', time: '1 hour ago', icon: AlertCircle, color: 'orange' },
    { id: 5, type: 'user', message: 'New user registered: Rahul Sharma', time: '2 hours ago', icon: Users, color: 'teal' },
];

const systemHealth = [
    { name: 'API Server', status: 'operational', uptime: '99.9%', icon: Server },
    { name: 'Database', status: 'operational', uptime: '99.8%', icon: Database },
    { name: 'Payment Gateway', status: 'operational', uptime: '100%', icon: CreditCard },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ margin: 0, fontSize: '0.75rem', color: entry.color || 'var(--accent-primary)' }}>
                        {entry.name}: {entry.dataKey === 'revenue' ? `₹${entry.value.toLocaleString()}` : entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalRestaurants: 0,
        totalOrders: 0,
        totalRevenue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRealStats = async () => {
            try {
                // Placeholder for real Supabase calls
                // For now, we use a mix of real counts if possible and static for display
                const [users, restaurants] = await Promise.all([
                    supabase.from('profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('restaurants').select('*', { count: 'exact', head: true })
                ]);

                setStats({
                    totalUsers: users.count || 3284,
                    totalRestaurants: restaurants.count || 70,
                    totalOrders: 1247,
                    totalRevenue: 85000
                });
            } catch (err) {
                console.error('Stats fetch failed:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchRealStats();
    }, []);

    const dashboardStats = [
        { label: 'Total Restaurants', value: stats.totalRestaurants, change: '+12%', icon: Store, color: 'purple' },
        { label: 'Total Orders', value: stats.totalOrders, change: '+18%', icon: TrendingUp, color: 'blue' },
        { label: 'Monthly Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, change: '+23%', icon: DollarSign, color: 'green' },
        { label: 'Total Users', value: stats.totalUsers, change: '+8%', icon: Users, color: 'orange' },
    ];

    return (
        <div className="animate-fade-in">
            <div className="section-header" style={{ marginBottom: '2rem' }}>
                <div className="section-title">
                    <h2>Platform Overview</h2>
                    <Badge variant="info">Live System Stats</Badge>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {dashboardStats.map((stat) => (
                    <StatCard key={stat.label} {...stat} />
                ))}
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem', marginBottom: '2.5rem', width: '100%' }}>
                <Card style={{ gridColumn: 'span 8', minWidth: 0 }}>
                    <CardHeader>
                        <CardTitle>Revenue Analytics</CardTitle>
                    </CardHeader>
                    <div style={{ height: '350px', width: '100%', minHeight: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="revenue" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card style={{ gridColumn: 'span 4', minWidth: 0 }}>
                    <CardHeader>
                        <CardTitle>Distribution</CardTitle>
                    </CardHeader>
                    <div style={{ height: '350px', width: '100%', minHeight: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={restaurantStatusData}
                                    cx="50%" cy="50%"
                                    innerRadius={70} outerRadius={100}
                                    paddingAngle={5} dataKey="value"
                                >
                                    {restaurantStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" align="center" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem', width: '100%' }}>
                <Card style={{ gridColumn: 'span 7' }}>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {recentActivities.map(activity => (
                            <div key={activity.id} style={{ display: 'flex', gap: '1rem', padding: '1rem', borderRadius: '12px', background: 'var(--surface-hover)' }}>
                                <div style={{ color: `var(--accent-${activity.color || 'primary'})` }}>
                                    <activity.icon size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{activity.message}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{activity.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card style={{ gridColumn: 'span 5' }}>
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
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 8px var(--accent-primary)' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
