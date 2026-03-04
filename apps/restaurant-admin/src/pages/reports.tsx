import React, { useState } from 'react';
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Sidebar from '../components/sidebar';
import './reports.css';

// --- Sample Data ---
const metrics = {
    revenue: { value: 124500, change: 12.5, isPositive: true },
    orders: { value: 342, change: 8.2, isPositive: true },
    avgOrderValue: { value: 364, change: 2.4, isPositive: true },
    activeTables: { value: 18, change: -5.0, isPositive: false },
};

const revenueData = [
    { day: 'Mon', amount: 12000 },
    { day: 'Tue', amount: 15500 },
    { day: 'Wed', amount: 14200 },
    { day: 'Thu', amount: 18000 },
    { day: 'Fri', amount: 24500 },
    { day: 'Sat', amount: 32000 },
    { day: 'Sun', amount: 28000 },
];
const maxRevenue = Math.max(...revenueData.map(d => d.amount));

const categorySales = [
    { name: 'Main Course', percentage: 45, color: '#4299E1' },
    { name: 'Starters', percentage: 25, color: '#48BB78' },
    { name: 'Beverages', percentage: 15, color: '#ED8936' },
    { name: 'Desserts', percentage: 15, color: '#9F7AEA' },
];

const topItems = [
    { rank: 1, name: 'Butter Chicken', sold: 124, revenue: 47120, trend: 'up' },
    { rank: 2, name: 'Chicken Biryani', sold: 98, revenue: 31360, trend: 'up' },
    { rank: 3, name: 'Paneer Tikka', sold: 85, revenue: 21250, trend: 'down' },
    { rank: 4, name: 'Garlic Naan', sold: 210, revenue: 12600, trend: 'up' },
    { rank: 5, name: 'Mango Lassi', sold: 76, revenue: 9120, trend: 'up' },
];

const Reports: React.FC = () => {
    const [timeframe, setTimeframe] = useState('week');

    const formatCurrency = (val: number) => `₹${val.toLocaleString()}`;

    return (
        <div className="reports-container">
            <Sidebar />

            <div className="reports-main-content">
                <div className="reports-header">
                    <h1 className="reports-page-title">Reports & Analytics</h1>
                    <div className="reports-header-right">
                        <div className="user-avatar">👨‍💼</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="reports-filters">
                    <button
                        className={`report-filter-btn ${timeframe === 'today' ? 'active' : ''}`}
                        onClick={() => setTimeframe('today')}
                    >
                        Today
                    </button>
                    <button
                        className={`report-filter-btn ${timeframe === 'week' ? 'active' : ''}`}
                        onClick={() => setTimeframe('week')}
                    >
                        This Week
                    </button>
                    <button
                        className={`report-filter-btn ${timeframe === 'month' ? 'active' : ''}`}
                        onClick={() => setTimeframe('month')}
                    >
                        This Month
                    </button>
                    <button className="report-filter-btn">
                        <Calendar size={16} /> Custom Range
                    </button>

                    <button className="report-export-btn">
                        <Download size={16} /> Export Report
                    </button>
                </div>

                {/* Key Metrics */}
                <div className="metrics-grid">
                    <div className="metric-card">
                        <div className="metric-card-top-bar metric-card-blue"></div>
                        <h3 className="metric-title">Total Revenue</h3>
                        <div className="metric-value">{formatCurrency(metrics.revenue.value)}</div>
                        <div className={`metric-change ${metrics.revenue.isPositive ? 'change-positive' : 'change-negative'}`}>
                            {metrics.revenue.isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            {metrics.revenue.change}% vs last {timeframe}
                        </div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-card-top-bar metric-card-green"></div>
                        <h3 className="metric-title">Total Orders</h3>
                        <div className="metric-value">{metrics.orders.value}</div>
                        <div className={`metric-change ${metrics.orders.isPositive ? 'change-positive' : 'change-negative'}`}>
                            {metrics.orders.isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            {metrics.orders.change}% vs last {timeframe}
                        </div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-card-top-bar metric-card-purple"></div>
                        <h3 className="metric-title">Avg. Order Value</h3>
                        <div className="metric-value">{formatCurrency(metrics.avgOrderValue.value)}</div>
                        <div className={`metric-change ${metrics.avgOrderValue.isPositive ? 'change-positive' : 'change-negative'}`}>
                            {metrics.avgOrderValue.isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            {metrics.avgOrderValue.change}% vs last {timeframe}
                        </div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-card-top-bar metric-card-orange"></div>
                        <h3 className="metric-title">Active Tables</h3>
                        <div className="metric-value">{metrics.activeTables.value}</div>
                        <div className={`metric-change ${metrics.activeTables.isPositive ? 'change-positive' : 'change-negative'}`}>
                            {metrics.activeTables.isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            {Math.abs(metrics.activeTables.change)}% vs last {timeframe}
                        </div>
                    </div>
                </div>

                {/* Charts & Categorical Data */}
                <div className="dashboard-grid">

                    {/* Revenue Chart */}
                    <div className="dashboard-card">
                        <div className="dashboard-card-header">
                            <h3 className="dashboard-card-title">Revenue Overview</h3>
                        </div>
                        <div className="chart-container">
                            {revenueData.map((data, index) => {
                                const heightPercentage = (data.amount / maxRevenue) * 100;
                                return (
                                    <div key={index} className="chart-bar-group">
                                        <div className="chart-tooltip">{formatCurrency(data.amount)}</div>
                                        <div className="chart-bar" style={{ height: `${heightPercentage}%` }}></div>
                                        <span className="chart-label">{data.day}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sales by Category */}
                    <div className="dashboard-card">
                        <div className="dashboard-card-header">
                            <h3 className="dashboard-card-title">Sales by Category</h3>
                        </div>
                        <div className="category-list">
                            {categorySales.map((cat, index) => (
                                <div key={index} className="category-item">
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
                            ))}
                        </div>
                    </div>

                </div>

                {/* Top Selling Items */}
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
                                {topItems.map((item, index) => (
                                    <tr key={index}>
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Reports;
