import React, { useCallback, useMemo, useState } from 'react';
import { Download, Calendar, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Sidebar from '../components/sidebar';
import { useAuth } from '../context/AuthContext';
import { useTabVisibilityRefetch } from '../hooks/useTabVisibilityRefetch';
import { getReportsSummary, type ReportsSummary } from '../services/supabaseService';
import './reports.css';

const emptySummary: ReportsSummary = {
    metrics: {
        revenue: { value: 0, change: 0, isPositive: true },
        orders: { value: 0, change: 0, isPositive: true },
        avgOrderValue: { value: 0, change: 0, isPositive: true },
        activeTables: { value: 0, change: 0, isPositive: true },
    },
    revenueData: [],
    categorySales: [],
    topItems: [],
};

const Reports: React.FC = () => {
    const { activeRestaurantId } = useAuth();
    const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('week');
    const [summary, setSummary] = useState<ReportsSummary>(emptySummary);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [initialLoad, setInitialLoad] = useState(true);

    const fetchReports = useCallback(async () => {
        if (!activeRestaurantId) {
            setSummary(emptySummary);
            setLoading(false);
            return;
        }

        if (initialLoad) setLoading(true);
        setError(null);

        try {
            const data = await getReportsSummary(activeRestaurantId, timeframe);
            setSummary(data);
        } catch (err) {
            console.error('Failed to load reports', err);
            setError('Failed to load report data.');
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    }, [activeRestaurantId, timeframe, initialLoad]);

    const { refetching } = useTabVisibilityRefetch(fetchReports, {
        enabled: !!activeRestaurantId,
        autoRefreshInterval: 45000,
        refetchOnMount: true,
    });

    const maxRevenue = useMemo(
        () => Math.max(...summary.revenueData.map(d => d.amount), 1),
        [summary.revenueData]
    );

    const formatCurrency = (val: number) => `Rs ${val.toLocaleString()}`;

    const exportReport = () => {
        const payload = {
            timeframe,
            generatedAt: new Date().toISOString(),
            summary,
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tablekard-report-${timeframe}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="reports-container">
            <Sidebar />

            <div className="reports-main-content">
                <div className="reports-header">
                    <h1 className="reports-page-title">Reports & Analytics</h1>
                    <div className="reports-header-right">
                        <div className="reports-user-avatar">RA</div>
                    </div>
                </div>

                {error && <div style={{ color: '#F56565', marginBottom: '16px' }}>{error}</div>}

                <div className="reports-filters">
                    <button className={`report-filter-btn ${timeframe === 'today' ? 'active' : ''}`} onClick={() => setTimeframe('today')}>
                        Today
                    </button>
                    <button className={`report-filter-btn ${timeframe === 'week' ? 'active' : ''}`} onClick={() => setTimeframe('week')}>
                        This Week
                    </button>
                    <button className={`report-filter-btn ${timeframe === 'month' ? 'active' : ''}`} onClick={() => setTimeframe('month')}>
                        This Month
                    </button>
                    <button className="report-filter-btn" disabled>
                        <Calendar size={16} /> Custom Range
                    </button>

                    <button className="report-export-btn" onClick={exportReport}>
                        <Download size={16} /> Export Report
                    </button>
                </div>

                <div className="metrics-grid">
                    <div className="metric-card">
                        <div className="metric-card-top-bar metric-card-blue"></div>
                        <h3 className="metric-title">Total Revenue</h3>
                        <div className="metric-value">{loading && !refetching ? '...' : formatCurrency(summary.metrics.revenue.value)}</div>
                        <div className={`metric-change ${summary.metrics.revenue.isPositive ? 'change-positive' : 'change-negative'}`}>
                            {summary.metrics.revenue.isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            {summary.metrics.revenue.change}% vs last {timeframe}
                        </div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-card-top-bar metric-card-green"></div>
                        <h3 className="metric-title">Total Orders</h3>
                        <div className="metric-value">{loading && !refetching ? '...' : summary.metrics.orders.value}</div>
                        <div className={`metric-change ${summary.metrics.orders.isPositive ? 'change-positive' : 'change-negative'}`}>
                            {summary.metrics.orders.isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            {summary.metrics.orders.change}% vs last {timeframe}
                        </div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-card-top-bar metric-card-purple"></div>
                        <h3 className="metric-title">Avg. Order Value</h3>
                        <div className="metric-value">{loading && !refetching ? '...' : formatCurrency(summary.metrics.avgOrderValue.value)}</div>
                        <div className={`metric-change ${summary.metrics.avgOrderValue.isPositive ? 'change-positive' : 'change-negative'}`}>
                            {summary.metrics.avgOrderValue.isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            {summary.metrics.avgOrderValue.change}% vs last {timeframe}
                        </div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-card-top-bar metric-card-orange"></div>
                        <h3 className="metric-title">Active Tables</h3>
                        <div className="metric-value">{loading && !refetching ? '...' : summary.metrics.activeTables.value}</div>
                        <div className={`metric-change ${summary.metrics.activeTables.isPositive ? 'change-positive' : 'change-negative'}`}>
                            {summary.metrics.activeTables.isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            {Math.abs(summary.metrics.activeTables.change)}% vs last {timeframe}
                        </div>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <div className="dashboard-card-header">
                            <h3 className="dashboard-card-title">Revenue Overview</h3>
                        </div>
                        <div className="chart-container">
                            {(loading && !refetching ? [] : summary.revenueData).map((data) => {
                                const heightPercentage = maxRevenue ? (data.amount / maxRevenue) * 100 : 0;
                                return (
                                    <div key={data.day} className="chart-bar-group">
                                        <div className="chart-tooltip">{formatCurrency(data.amount)}</div>
                                        <div className="chart-bar" style={{ height: `${heightPercentage}%` }}></div>
                                        <span className="chart-label">{data.day}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="dashboard-card-header">
                            <h3 className="dashboard-card-title">Sales by Category</h3>
                        </div>
                        <div className="category-list">
                            {loading ? (
                                <div style={{ color: '#A0AEC0' }}>Loading categories...</div>
                            ) : summary.categorySales.length === 0 ? (
                                <div style={{ color: '#A0AEC0' }}>No category sales available</div>
                            ) : (
                                summary.categorySales.map((cat) => (
                                    <div key={cat.name} className="category-item">
                                        <div className="category-info">
                                            <span className="category-name">{cat.name}</span>
                                            <span className="category-value">{cat.percentage}%</span>
                                        </div>
                                        <div className="category-progress-bg">
                                            <div
                                                className="category-progress-fill"
                                                style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="dashboard-card">
                        <div className="dashboard-card-header">
                            <h3 className="dashboard-card-title">Top Selling Items</h3>
                        </div>
                        <table className="top-items-table">
                            <thead>
                                <tr>
                                    <th>Item Name</th>
                                    <th>Quantity Sold</th>
                                    <th>Revenue</th>
                                    <th>Trend</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && !refetching ? (
                                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>Loading items...</td></tr>
                                ) : summary.topItems.length === 0 ? (
                                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>No item sales yet</td></tr>
                                ) : (
                                    summary.topItems.map((item) => (
                                        <tr key={item.name}>
                                            <td>
                                                <div className="item-name-cell">
                                                    <span className={`item-rank rank-${item.rank}`}>{item.rank}</span>
                                                    {item.name}
                                                </div>
                                            </td>
                                            <td>{item.sold}</td>
                                            <td>{formatCurrency(item.revenue)}</td>
                                            <td>
                                                {item.trend === 'up' ? (
                                                    <span className="trend-up"><TrendingUp size={16} /> Up</span>
                                                ) : (
                                                    <span className="trend-down"><TrendingDown size={16} /> Down</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
