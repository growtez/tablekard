import { useState } from 'react';
import {
    Store,
    TrendingUp,
    DollarSign,
    Users,
    Plus,
    MoreHorizontal,
    RefreshCw,
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
import { useDashboardStats } from '../hooks/useDashboardStats';
import { RestaurantStatus } from '@restaurant-saas/types';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import AddRestaurantModal from '../components/AddRestaurantModal';

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
    { id: 6, type: 'order', message: 'Order #ORD-4520 completed by Tandoori Nights', time: '3 hours ago', icon: CheckCircle, color: 'green' },
];

const systemHealth = [
    { name: 'API Server', status: 'operational', uptime: '99.9%', icon: Server },
    { name: 'Database', status: 'operational', uptime: '99.8%', icon: Database },
    { name: 'Payment Gateway', status: 'operational', uptime: '100%', icon: CreditCard },
    { name: 'WebSocket', status: 'degraded', uptime: '97.2%', icon: Zap },
];

const getStatusBadge = (status: RestaurantStatus) => {
    switch (status) {
        case RestaurantStatus.ACTIVE:
            return <Badge variant="success">Active</Badge>;
        case RestaurantStatus.TRIAL:
            return <Badge variant="info">Trial</Badge>;
        case RestaurantStatus.EXPIRED:
            return <Badge variant="error">Expired</Badge>;
        default:
            return <Badge>{status}</Badge>;
    }
};

const planBadge = (
    <Badge style={{
        background: 'rgba(217, 181, 80, 0.1)',
        color: 'var(--color-accent-primary)',
        border: '1px solid rgba(217, 181, 80, 0.2)',
        fontWeight: 600,
        letterSpacing: '0.5px',
        fontSize: '10px',
        textTransform: 'uppercase'
    }}>
        QR Menu Plan
    </Badge>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        // If it's a pie chart or bar chart, we might not have a top-level label, or it's irrelevant
        const showLabel = label && typeof label === 'string' && label.length < 15;

        return (
            <div className="chart-tooltip bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-3 shadow-lg">
                {showLabel && (
                    <p className="text-[var(--color-text-primary)] font-semibold mb-1 text-sm">{label}</p>
                )}
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                        {entry.color && (
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        )}
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            <span className="text-[var(--color-text-muted)] font-normal">
                                {entry.name}:
                            </span>{' '}
                            {entry.dataKey === 'revenue' || entry.name === 'Revenue'
                                ? `₹${entry.value.toLocaleString()}`
                                : entry.value}
                        </p>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function Dashboard() {
    const { stats, revenue, recentRestaurants, recentOrders, loading, error, refresh } = useDashboardStats();
    const [timeRange, setTimeRange] = useState('7d');
    const [showAddModal, setShowAddModal] = useState(false);

    const handleAddRestaurant = () => {
        setShowAddModal(true);
    };

    const handleAddSuccess = () => {
        refresh(); // Refresh dashboard data
        setShowAddModal(false);
    };

    // Always show content, ignore loading and error states for now
    const dashboardStats = [
        {
            label: 'Total Restaurants',
            value: stats?.totalRestaurants || 70,
            change: '+12%',
            positive: true,
            icon: Store,
            color: 'purple'
        },
        {
            label: 'Total Orders',
            value: stats?.totalOrders || 1247,
            change: '+18%',
            positive: true,
            icon: TrendingUp,
            color: 'blue'
        },
        {
            label: 'Monthly Revenue',
            value: `₹${(revenue?.totalRevenue || 85000).toLocaleString()}`,
            change: '+23%',
            positive: true,
            icon: DollarSign,
            color: 'green'
        },
        {
            label: 'Total Users',
            value: stats?.totalUsers || 3284,
            change: '+8%',
            positive: true,
            icon: Users,
            color: 'orange'
        }
    ];

    // Use static data for recent restaurants if API fails
    const displayRecentRestaurants = recentRestaurants.length > 0 ? recentRestaurants : [
        { id: 1, name: 'Spice Garden', slug: 'spice-garden', status: 'active' as any, createdAt: new Date().toISOString() },
        { id: 2, name: 'Biryani House', slug: 'biryani-house', status: 'active' as any, createdAt: new Date().toISOString() },
        { id: 3, name: 'Tandoori Nights', slug: 'tandoori-nights', status: 'pending' as any, createdAt: new Date().toISOString() },
        { id: 4, name: 'Curry Palace', slug: 'curry-palace', status: 'active' as any, createdAt: new Date().toISOString() },
        { id: 5, name: 'Masala Dhaba', slug: 'masala-dhaba', status: 'trial' as any, createdAt: new Date().toISOString() },
    ];

    return (
        <>
            <PageHeader
                className="page-header"
                title="Dashboard"
                description="Welcome back! Here's what's happening with your platform."
                actions={
                    <>
                        <Button className="flex items-center gap-2" onClick={handleAddRestaurant}>
                            <Plus size={18} />
                            Add Restaurant
                        </Button>
                    </>
                }
            />

            <div className="page-content animate-fadeIn">
                {/* Stats Grid */}
                <div className="stats-grid">
                    {dashboardStats.map((stat) => (
                        <StatCard
                            key={stat.label}
                            label={stat.label}
                            value={stat.value}
                            icon={stat.icon}
                            color={stat.color}
                        />
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Revenue Chart */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex items-center justify-between pb-2">
                            <div>
                                <CardTitle>Revenue Overview</CardTitle>
                                <p className="text-sm text-[var(--color-text-muted)] mt-1">Monthly revenue and order trends</p>
                            </div>
                            <div className="flex gap-2">
                                {['7d', '30d', '90d', '1y'].map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setTimeRange(range)}
                                        className={`px-3 py-1 text-xs rounded-md transition-all ${timeRange === range
                                                ? 'bg-[var(--color-accent-primary)] text-white'
                                                : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                                            }`}
                                    >
                                        {range}
                                    </button>
                                ))}
                            </div>
                        </CardHeader>
                        <div className="p-4 h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#D9B550" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#D9B550" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                    <XAxis
                                        dataKey="month"
                                        stroke="var(--color-text-muted)"
                                        fontSize={12}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        stroke="var(--color-text-muted)"
                                        fontSize={12}
                                        tickLine={false}
                                        tickFormatter={(value) => `₹${value / 1000}k`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#D9B550"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                        name="Revenue"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Restaurant Status Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Restaurant Status</CardTitle>
                            <p className="text-sm text-[var(--color-text-muted)] mt-1">Distribution by status</p>
                        </CardHeader>
                        <div className="p-4 h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={restaurantStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {restaurantStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                {/* Weekly Orders & System Health */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Weekly Orders Bar Chart */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Weekly Order Volume</CardTitle>
                            <p className="text-sm text-[var(--color-text-muted)] mt-1">Orders processed this week</p>
                        </CardHeader>
                        <div className="p-4 h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyOrderData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                    <XAxis
                                        dataKey="day"
                                        stroke="var(--color-text-muted)"
                                        fontSize={12}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        stroke="var(--color-text-muted)"
                                        fontSize={12}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar
                                        dataKey="orders"
                                        fill="#3B82F6"
                                        radius={[4, 4, 0, 0]}
                                        name="Orders"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* System Health */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity size={18} className="text-[var(--color-accent-primary)]" />
                                System Health
                            </CardTitle>
                        </CardHeader>
                        <div className="p-4 space-y-4">
                            {systemHealth.map((service) => (
                                <div key={service.name} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${service.status === 'operational' ? 'bg-green-500/10' : 'bg-yellow-500/10'
                                            }`}>
                                            <service.icon size={16} className={
                                                service.status === 'operational' ? 'text-green-500' : 'text-yellow-500'
                                            } />
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm text-[var(--color-text-primary)]">{service.name}</div>
                                            <div className="text-xs text-[var(--color-text-muted)]">{service.uptime} uptime</div>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${service.status === 'operational'
                                            ? 'bg-green-500/10 text-green-500'
                                            : 'bg-yellow-500/10 text-yellow-500'
                                        }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${service.status === 'operational' ? 'bg-green-500' : 'bg-yellow-500'
                                            }`} />
                                        {service.status === 'operational' ? 'Operational' : 'Degraded'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Top Restaurants & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Top Performing Restaurants */}
                    <Card>
                        <CardHeader className="flex items-center justify-between">
                            <div>
                                <CardTitle>Top Performing Restaurants</CardTitle>
                                <p className="text-sm text-[var(--color-text-muted)] mt-1">Based on orders and revenue</p>
                            </div>
                            <Link to="/restaurants">
                                <Button variant="ghost">View All</Button>
                            </Link>
                        </CardHeader>
                        <div className="p-4">
                            <div className="space-y-4">
                                {topRestaurants.map((restaurant, index) => (
                                    <div key={restaurant.id} className="flex items-center gap-4 p-3 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] hover:border-[var(--color-accent-primary)]/30 transition-all">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] flex items-center justify-center text-white font-bold">
                                            {restaurant.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-[var(--color-text-primary)] truncate">{restaurant.name}</div>
                                            <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                                                <span>{restaurant.orders} orders</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-0.5">
                                                    <DollarSign size={10} />
                                                    {restaurant.revenue.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-green-500 text-sm font-medium">
                                                <ArrowUpRight size={14} />
                                                {restaurant.trend}
                                            </div>
                                            <div className="text-xs text-[var(--color-text-muted)]">{restaurant.rating} ★</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Recent Activity Feed */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock size={18} className="text-[var(--color-accent-primary)]" />
                                Recent Activity
                            </CardTitle>
                            <p className="text-sm text-[var(--color-text-muted)] mt-1">Latest platform updates</p>
                        </CardHeader>
                        <div className="p-4">
                            <div className="space-y-4">
                                {recentActivities.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--color-bg-tertiary)] transition-all border border-transparent hover:border-[var(--color-border)]">
                                        <div className={`p-2 rounded-lg shrink-0 ${activity.color === 'blue' ? 'bg-blue-500/10 text-blue-500' :
                                                activity.color === 'green' ? 'bg-green-500/10 text-green-500' :
                                                    activity.color === 'purple' ? 'bg-purple-500/10 text-purple-500' :
                                                        activity.color === 'orange' ? 'bg-orange-500/10 text-orange-500' :
                                                            'bg-teal-500/10 text-teal-500'
                                            }`}>
                                            <activity.icon size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">{activity.message}</p>
                                            <p className="text-xs text-[var(--color-text-muted)] mt-1">{activity.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Recent Restaurants Table */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle>Recent Restaurants</CardTitle>
                        <Link to="/restaurants" style={{ textDecoration: 'none' }}>
                            <Button variant="ghost">View All</Button>
                        </Link>
                    </CardHeader>
                    <div className="table-container">
                        {displayRecentRestaurants.length === 0 ? (
                            <div className="p-4 text-center text-muted">No recent restaurants</div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Restaurant</th>
                                        <th>Plan</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayRecentRestaurants.slice(0, 5).map((restaurant) => (
                                        <tr key={restaurant.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] flex items-center justify-center text-white font-bold">
                                                        {restaurant.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{restaurant.name}</div>
                                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                            {restaurant.slug}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{planBadge}</td>
                                            <td>{getStatusBadge(restaurant.status)}</td>
                                            <td>
                                                <Link to={`/restaurants/${restaurant.id}`}>
                                                    <Button variant="ghost">
                                                        <MoreHorizontal size={18} />
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </Card>
            </div>

            {/* Add Restaurant Modal */}
            {showAddModal && (
                <AddRestaurantModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={handleAddSuccess}
                />
            )}
        </>
    );
}
