import { CreditCard, TrendingUp, DollarSign, RefreshCw } from 'lucide-react';
import { useSubscriptionStats } from '../hooks/useSubscriptionStats';

const getPaymentStatusBadge = (status: string) => {
    switch (status) {
        case 'SUCCESS':
            return <span className="badge success">Success</span>;
        case 'PENDING':
            return <span className="badge warning">Pending</span>;
        case 'FAILED':
            return <span className="badge error">Failed</span>;
        default:
            return <span className="badge">{status}</span>;
    }
};

export default function Subscriptions() {
    const { stats, monthlyRevenue, recentPayments, loading, refresh } = useSubscriptionStats();

    if (loading && stats.length === 0) {
        return (
            <div className="p-8 flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <>
            <header className="page-header flex items-center justify-between">
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Subscriptions</h1>
                    <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                        Manage subscription plans and payments
                    </p>
                </div>
                <button className="btn btn-ghost" onClick={refresh} title="Refresh">
                    <RefreshCw size={18} />
                </button>
            </header>

            <div className="page-content animate-fadeIn">
                {/* Subscription Stats */}
                <div className="stats-grid">
                    {stats.map((stat) => (
                        <div key={stat.label} className="stat-card">
                            <div className="stat-icon purple">
                                <CreditCard size={24} />
                            </div>
                            <div className="stat-info">
                                <div className="stat-label">{stat.label}</div>
                                <div className="stat-value">{stat.count}</div>
                                <div className="text-secondary" style={{ fontSize: '0.875rem' }}>
                                    Revenue: {stat.revenue}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Revenue Overview */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="card-header">
                        <h2 className="card-title flex items-center gap-sm">
                            <TrendingUp size={20} />
                            Revenue Overview
                        </h2>
                    </div>
                    <div className="card-content">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
                                <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>This Month</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-success)' }}>
                                    {monthlyRevenue ? `₹${monthlyRevenue.current.toLocaleString()}` : '-'}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
                                <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Last Month</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                                    {monthlyRevenue ? `₹${monthlyRevenue.last.toLocaleString()}` : '-'}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
                                <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Growth</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-success)' }}>
                                    {monthlyRevenue ? `+${monthlyRevenue.growth}%` : '-'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Payments */}
                <div className="card">
                    <div className="card-header flex items-center justify-between">
                        <h2 className="card-title flex items-center gap-sm">
                            <DollarSign size={20} />
                            Recent Payments
                        </h2>
                        <button className="btn btn-ghost">View All</button>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Restaurant</th>
                                    <th>Plan</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentPayments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td className="font-medium">{payment.restaurant}</td>
                                        <td>{payment.plan}</td>
                                        <td className="font-medium">{payment.amount}</td>
                                        <td className="text-secondary">{payment.date}</td>
                                        <td>{getPaymentStatusBadge(payment.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
