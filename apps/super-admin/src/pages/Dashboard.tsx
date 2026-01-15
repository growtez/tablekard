import {
    Store,
    TrendingUp,
    DollarSign,
    Users,
    Plus,
    MoreHorizontal,
    RefreshCw
} from 'lucide-react';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { RestaurantStatus, SubscriptionPlan } from '@restaurant-saas/types';
import { Link } from 'react-router-dom';

const getStatusBadge = (status: RestaurantStatus) => {
    switch (status) {
        case RestaurantStatus.ACTIVE:
            return <span className="badge success">Active</span>;
        case RestaurantStatus.TRIAL:
            return <span className="badge info">Trial</span>;
        case RestaurantStatus.EXPIRED:
            return <span className="badge error">Expired</span>;
        default:
            return <span className="badge">{status}</span>;
    }
};

const getPlanBadge = (plan: SubscriptionPlan) => {
    switch (plan) {
        case SubscriptionPlan.DELIVERY:
            return <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>Delivery</span>;
        case SubscriptionPlan.QR:
            return <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>QR Only</span>;
        case SubscriptionPlan.OWNED:
            return <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>Owned</span>;
        default:
            return <span className="badge">{plan}</span>;
    }
};

export default function Dashboard() {
    const { stats, revenue, recentRestaurants, loading, error, refresh } = useDashboardStats();

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-500 mb-4">Error loading dashboard: {error}</div>
                <button onClick={refresh} className="btn btn-primary">Try Again</button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const dashboardStats = [
        {
            label: 'Total Restaurants',
            value: stats?.totalRestaurants || 0,
            change: '+0%', // Dynamic change not implemented yet
            positive: true,
            icon: Store,
            color: 'purple'
        },
        {
            label: 'Total Orders',
            value: stats?.totalOrders || 0,
            change: '+0%',
            positive: true,
            icon: TrendingUp,
            color: 'blue'
        },
        {
            label: 'Monthly Revenue',
            value: `₹${(revenue?.totalRevenue || 0).toLocaleString()}`,
            change: '+0%',
            positive: true,
            icon: DollarSign,
            color: 'green'
        },
        {
            label: 'Total Users',
            value: stats?.totalUsers || 0,
            change: '+0%',
            positive: false,
            icon: Users,
            color: 'orange'
        }
    ];

    return (
        <>
            <header className="page-header flex items-center justify-between">
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Dashboard</h1>
                    <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                        Welcome back! Here's what's happening with your platform.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-ghost" onClick={refresh} title="Refresh">
                        <RefreshCw size={18} />
                    </button>
                    <Link to="/restaurants" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                        <Plus size={18} />
                        Add Restaurant
                    </Link>
                </div>
            </header>

            <div className="page-content animate-fadeIn">
                {/* Stats Grid */}
                <div className="stats-grid">
                    {dashboardStats.map((stat) => (
                        <div key={stat.label} className="stat-card">
                            <div className={`stat-icon ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <div className="stat-info">
                                <div className="stat-label">{stat.label}</div>
                                <div className="stat-value">{stat.value}</div>
                                {/* <div className={`stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                                    {stat.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    {stat.change} from last month
                                </div> */}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Restaurants */}
                <div className="card">
                    <div className="card-header flex items-center justify-between">
                        <h2 className="card-title">Recent Restaurants</h2>
                        <Link to="/restaurants" className="btn btn-ghost" style={{ textDecoration: 'none' }}>View All</Link>
                    </div>
                    <div className="table-container">
                        {recentRestaurants.length === 0 ? (
                            <div className="p-4 text-center text-muted">No recent restaurants</div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Restaurant</th>
                                        <th>Plan</th>
                                        <th>Status</th>
                                        {/* <th>Revenue</th> */}
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentRestaurants.map((restaurant) => (
                                        <tr key={restaurant.id}>
                                            <td>
                                                <div>
                                                    <div className="font-medium">{restaurant.name}</div>
                                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                        {restaurant.slug}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{getPlanBadge(restaurant.subscription?.plan)}</td>
                                            <td>{getStatusBadge(restaurant.status)}</td>
                                            {/* <td className="font-medium">₹0</td> */}
                                            <td>
                                                <Link to={`/restaurants/${restaurant.id}`} className="btn btn-ghost">
                                                    <MoreHorizontal size={18} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
