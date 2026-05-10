import React, { useState, useEffect } from 'react';
import { Download, Calendar, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import Sidebar from '../components/sidebar';
import './reports.css';
import { useAuth } from '../context/AuthContext';
import { 
    getAnalyticsSummary, 
    getActiveTablesCount, 
    getTotalMenuItemsCount,
    getBestSellingDishes,
    getRevenueData,
    getPeakHourData,
    getAdvancedAnalytics,
    getBCGMatrixData,
    getRecentFeedback
} from '../services/supabaseService';
import type {
    AnalyticsSummary,
    BestSellingDish,
    RevenueRecord,
    PeakHourData,
    RevenueBreakdown,
    BCGItem,
    FeedbackRecord
} from '../services/supabaseService';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
// Show only relevant hours (6am – 11pm) to keep the grid readable
const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
const HOUR_LABELS = ['6a', '7a', '8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p', '10p', '11p'];

const heatColor = (count: number, max: number): string => {
    if (max === 0 || count === 0) return '#F0F4F8';
    const intensity = count / max;
    if (intensity < 0.25) return '#C3DAFE';
    if (intensity < 0.5)  return '#7F9CF5';
    if (intensity < 0.75) return '#4C51BF';
    return '#312E81';
};

const Reports: React.FC = () => {
    const { activeRestaurantId } = useAuth();
    const [timeframe, setTimeframe] = useState('week');
    const [loading, setLoading] = useState(true);
    
    const [summary, setSummary] = useState<AnalyticsSummary>({
        totalRevenue: 0,
        totalOrders: 0,
        revenueChange: 0,
        ordersChange: 0
    });
    const [activeTables, setActiveTables] = useState(0);
    const [totalMenuItems, setTotalMenuItems] = useState(0);
    const [topItems, setTopItems] = useState<BestSellingDish[]>([]);
    const [revenueHistory, setRevenueHistory] = useState<RevenueRecord[]>([]);
    const [peakData, setPeakData] = useState<PeakHourData>(
        Array.from({ length: 7 }, () => Array(24).fill(0))
    );
    const [advanced, setAdvanced] = useState<RevenueBreakdown | null>(null);
    const [bcgData, setBcgData] = useState<BCGItem[]>([]);
    const [feedbackData, setFeedbackData] = useState<FeedbackRecord[]>([]);
    
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const formatCurrency = (val: number) => `₹${val.toLocaleString()}`;

    const fetchData = async () => {
        if (!activeRestaurantId) return;
        setLoading(true);
        try {
            const now = new Date();
            let startDate = new Date();
            let endDate = new Date();

            if (timeframe === 'today') {
                startDate.setHours(0, 0, 0, 0);
            } else if (timeframe === 'week') {
                startDate.setDate(now.getDate() - 7);
            } else if (timeframe === 'month') {
                startDate.setMonth(now.getMonth() - 1);
            } else if (timeframe === 'custom' && customStart && customEnd) {
                startDate = new Date(customStart);
                endDate = new Date(customEnd);
                endDate.setHours(23, 59, 59, 999);
            }

            const [
                analyticsSummary,
                tablesCount,
                itemsCount,
                bestDishes,
                revenueData,
                heatmap,
                advancedData,
                bcgMatrix,
                recentFeedback
            ] = await Promise.all([
                getAnalyticsSummary(activeRestaurantId, startDate, endDate),
                getActiveTablesCount(activeRestaurantId),
                getTotalMenuItemsCount(activeRestaurantId),
                getBestSellingDishes(activeRestaurantId),
                getRevenueData(activeRestaurantId),
                getPeakHourData(activeRestaurantId),
                getAdvancedAnalytics(activeRestaurantId, startDate, endDate),
                getBCGMatrixData(activeRestaurantId),
                getRecentFeedback(activeRestaurantId)
            ]);

            setSummary(analyticsSummary);
            setActiveTables(tablesCount);
            setTotalMenuItems(itemsCount);
            setTopItems(bestDishes.slice(0, 5));
            setRevenueHistory(revenueData.slice(0, 7).reverse());
            setPeakData(heatmap);
            setAdvanced(advancedData);
            setBcgData(bcgMatrix);
            setFeedbackData(recentFeedback);
        } catch (error) {
            console.error("Error fetching report data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (timeframe === 'custom') {
            if (customStart && customEnd) fetchData();
        } else {
            fetchData();
        }
    }, [activeRestaurantId, timeframe, customStart, customEnd]);

    const maxRevenue = Math.max(...revenueHistory.map(d => d.totalRevenue), 1);

    // Max count across all visible hours for heatmap scaling
    const peakMax = Math.max(
        ...DAYS.map((_, di) => Math.max(...HOURS.map(h => peakData[di]?.[h] ?? 0))),
        1
    );

    return (
        <div className="reports-container">
            <Sidebar />

            <div className="reports-main-content">
                <div className="reports-header">
                    <h1 className="reports-page-title">Reports & Analytics</h1>
                    <div className="reports-header-right">
                        {loading && <Loader2 className="animate-spin" size={20} style={{ color: '#4C51BF' }} />}
                        <div className="reports-user-avatar">👨‍💼</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="reports-filters">
                    <button className={`report-filter-btn ${timeframe === 'today' ? 'active' : ''}`} onClick={() => setTimeframe('today')}>Today</button>
                    <button className={`report-filter-btn ${timeframe === 'week'  ? 'active' : ''}`} onClick={() => setTimeframe('week')}>This Week</button>
                    <button className={`report-filter-btn ${timeframe === 'month' ? 'active' : ''}`} onClick={() => setTimeframe('month')}>This Month</button>

                    <div className="custom-range-container">
                        <button className={`report-filter-btn ${timeframe === 'custom' ? 'active' : ''}`} onClick={() => setTimeframe('custom')}>
                            <Calendar size={16} /> Custom Range
                        </button>
                        {timeframe === 'custom' && (
                            <div className="custom-date-inputs">
                                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="date-input" />
                                <span className="date-separator">to</span>
                                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="date-input" />
                            </div>
                        )}
                    </div>

                    <button className="report-export-btn">
                        <Download size={16} /> Export Report
                    </button>
                </div>

                {/* Key Metrics */}
                <div className="metrics-grid">
                    <div className="metric-card">
                        <div className="metric-card-top-bar metric-card-blue"></div>
                        <h3 className="metric-title">Total Revenue</h3>
                        <div className="metric-value">{formatCurrency(summary.totalRevenue)}</div>
                        <div className={`metric-change ${summary.revenueChange >= 0 ? 'change-positive' : 'change-negative'}`}>
                            {summary.revenueChange >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            {Math.abs(summary.revenueChange).toFixed(1)}% vs last {timeframe}
                        </div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-card-top-bar metric-card-green"></div>
                        <h3 className="metric-title">Total Orders</h3>
                        <div className="metric-value">{summary.totalOrders}</div>
                        <div className={`metric-change ${summary.ordersChange >= 0 ? 'change-positive' : 'change-negative'}`}>
                            {summary.ordersChange >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            {Math.abs(summary.ordersChange).toFixed(1)}% vs last {timeframe}
                        </div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-card-top-bar metric-card-purple"></div>
                        <h3 className="metric-title">Average Order Value</h3>
                        <div className="metric-value">{formatCurrency(advanced?.aov || 0)}</div>
                        <div className={`metric-change ${(advanced?.aovChange || 0) >= 0 ? 'change-positive' : 'change-negative'}`}>
                            {(advanced?.aovChange || 0) >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            {Math.abs(advanced?.aovChange || 0).toFixed(1)}% vs last {timeframe}
                        </div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-card-top-bar metric-card-orange"></div>
                        <h3 className="metric-title">Active Tables</h3>
                        <div className="metric-value">{activeTables}</div>
                        <div className="metric-change" style={{ color: '#718096' }}>Currently Occupied</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-card-top-bar" style={{ background: 'linear-gradient(to right, #E53E3E, #C53030)' }}></div>
                        <h3 className="metric-title">Discount Impact</h3>
                        <div className="metric-value">{formatCurrency(advanced?.impactAnalysis?.totalDiscount || 0)}</div>
                        <div className="metric-change" style={{ color: '#718096' }}>{(advanced?.impactAnalysis?.discountRate || 0).toFixed(1)}% of subtotal</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-card-top-bar" style={{ background: 'linear-gradient(to right, #3182CE, #2B6CB0)' }}></div>
                        <h3 className="metric-title">Tax Collected</h3>
                        <div className="metric-value">{formatCurrency(advanced?.impactAnalysis?.totalTax || 0)}</div>
                        <div className="metric-change" style={{ color: '#718096' }}>{(advanced?.impactAnalysis?.taxRate || 0).toFixed(1)}% effective rate</div>
                    </div>
                </div>

                {/* Revenue Chart + Top Categories */}
                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <div className="dashboard-card-header">
                            <h3 className="dashboard-card-title">Revenue Overview (Last 7 Days)</h3>
                        </div>
                        <div className="chart-container">
                            {revenueHistory.length === 0 ? (
                                <div style={{ color: '#A0AEC0', margin: 'auto' }}>No data available</div>
                            ) : (
                                revenueHistory.map((data, index) => {
                                    const heightPercentage = (data.totalRevenue / maxRevenue) * 100;
                                    const dayName = new Date(data.revenueDate).toLocaleDateString('en-US', { weekday: 'short' });
                                    return (
                                        <div key={index} className="chart-bar-group">
                                            <div className="chart-tooltip">{formatCurrency(data.totalRevenue)}</div>
                                            <div className="chart-bar" style={{ height: `${heightPercentage}%` }}></div>
                                            <span className="chart-label">{dayName}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="dashboard-card breakdown-card">
                        <div className="dashboard-card-header">
                            <h3 className="dashboard-card-title">Order & Payment Breakdown</h3>
                        </div>
                        <div className="breakdown-container">
                            <div className="donut-section">
                                <h4 className="donut-title">Order Type</h4>
                                <div className="donut-content">
                                    <div className="donut-chart" style={{
                                        background: `conic-gradient(#4C51BF 0% ${advanced?.orderTypeSplit.dineIn || 0}%, #E2E8F0 ${advanced?.orderTypeSplit.dineIn || 0}% 100%)`
                                    }}>
                                        <div className="donut-hole"></div>
                                        <div className="donut-label">
                                            <span style={{ fontWeight: 600, fontSize: '18px', color: '#1A202C' }}>{Math.round(advanced?.orderTypeSplit.dineIn || 0)}%</span>
                                            <span style={{ fontSize: '11px', color: '#718096' }}>Dine-in</span>
                                        </div>
                                    </div>
                                    <div className="donut-legend">
                                        <div className="legend-item"><div className="legend-color" style={{background: '#4C51BF'}}></div> Dine-in</div>
                                        <div className="legend-item"><div className="legend-color" style={{background: '#E2E8F0'}}></div> Takeaway</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="breakdown-separator"></div>

                            <div className="donut-section">
                                <h4 className="donut-title">Payment Method</h4>
                                <div className="donut-content">
                                    <div className="donut-chart" style={{
                                        background: `conic-gradient(#48BB78 0% ${advanced?.paymentMethodSplit.online || 0}%, #E2E8F0 ${advanced?.paymentMethodSplit.online || 0}% 100%)`
                                    }}>
                                        <div className="donut-hole"></div>
                                        <div className="donut-label">
                                            <span style={{ fontWeight: 600, fontSize: '18px', color: '#1A202C' }}>{Math.round(advanced?.paymentMethodSplit.online || 0)}%</span>
                                            <span style={{ fontSize: '11px', color: '#718096' }}>Online</span>
                                        </div>
                                    </div>
                                    <div className="donut-legend">
                                        <div className="legend-item"><div className="legend-color" style={{background: '#48BB78'}}></div> Online</div>
                                        <div className="legend-item"><div className="legend-color" style={{background: '#E2E8F0'}}></div> Cash</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Selling Items  +  Peak Hour Heatmap — side by side */}
                <div className="dashboard-grid bottom-section-grid">

                    {/* Top Selling Items (shortened) */}
                    <div className="dashboard-card">
                        <div className="dashboard-card-header">
                            <h3 className="dashboard-card-title">Top Selling Items</h3>
                            <span className="card-subtitle">All-time sales</span>
                        </div>
                        <table className="top-items-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Sold</th>
                                    <th>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topItems.length === 0 ? (
                                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: '#A0AEC0' }}>No sales recorded</td></tr>
                                ) : (
                                    topItems.slice(0, 5).map((item, index) => (
                                        <tr key={index}>
                                            <td>
                                                <div className="item-name-cell">
                                                    <span className="item-emoji-box">{item.image}</span>
                                                    <span className={`item-rank-tag rank-${index + 1}`}>#{index + 1}</span>
                                                    <span className="item-name-text">{item.name}</span>
                                                </div>
                                            </td>
                                            <td>{item.sold}</td>
                                            <td>{formatCurrency(item.revenue)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Peak Hour Heatmap */}
                    <div className="dashboard-card heatmap-card">
                        <div className="dashboard-card-header">
                            <h3 className="dashboard-card-title">Peak Hour Heatmap</h3>
                            <span className="card-subtitle">Orders by day & hour</span>
                        </div>

                        <div className="heatmap-wrapper">
                            {/* Hour labels across the top */}
                            <div className="heatmap-hour-labels">
                                <div className="heatmap-day-label-spacer" />
                                {HOUR_LABELS.map((label, i) => (
                                    <div key={i} className="heatmap-hour-label">{label}</div>
                                ))}
                            </div>

                            {/* Grid rows (one per day) */}
                            {DAYS.map((day, di) => (
                                <div key={di} className="heatmap-row">
                                    <div className="heatmap-day-label">{day}</div>
                                    {HOURS.map((hour, hi) => {
                                        const count = peakData[di]?.[hour] ?? 0;
                                        return (
                                            <div
                                                key={hi}
                                                className="heatmap-cell"
                                                style={{ backgroundColor: heatColor(count, peakMax) }}
                                                title={`${day} ${HOUR_LABELS[hi]}: ${count} order${count !== 1 ? 's' : ''}`}
                                            />
                                        );
                                    })}
                                </div>
                            ))}

                            {/* Legend */}
                            <div className="heatmap-legend">
                                <span className="heatmap-legend-label">Low</span>
                                {['#F0F4F8', '#C3DAFE', '#7F9CF5', '#4C51BF', '#312E81'].map((c, i) => (
                                    <div key={i} className="heatmap-legend-cell" style={{ backgroundColor: c }} />
                                ))}
                                <span className="heatmap-legend-label">High</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Full Width Sections: BCG & Feedback */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '32px' }}>
                    {/* BCG Matrix */}
                    <div className="dashboard-card">
                        <div className="dashboard-card-header">
                            <h3 className="dashboard-card-title">Menu Item Performance</h3>
                            <span className="card-subtitle">BCG Matrix (Revenue vs. Volume)</span>
                        </div>
                        <div className="bcg-wrapper">
                            <div className="bcg-axis bcg-y-axis">Revenue ➔</div>
                            <div className="bcg-axis bcg-x-axis">Sales Volume ➔</div>
                            <div className="bcg-grid">
                                <div className="bcg-quadrant bcg-star">
                                    <h4 className="bcg-title">Stars <span className="bcg-desc">(High Volume, High Revenue)</span></h4>
                                    <div className="bcg-items">
                                        {bcgData.filter(i => i.category === 'star').map(i => <span key={i.id} className="bcg-pill">{i.name}</span>)}
                                        {bcgData.filter(i => i.category === 'star').length === 0 && <span className="bcg-empty">None yet</span>}
                                    </div>
                                </div>
                                <div className="bcg-quadrant bcg-gem">
                                    <h4 className="bcg-title">Hidden Gems <span className="bcg-desc">(Low Volume, High Revenue)</span></h4>
                                    <div className="bcg-items">
                                        {bcgData.filter(i => i.category === 'gem').map(i => <span key={i.id} className="bcg-pill">{i.name}</span>)}
                                        {bcgData.filter(i => i.category === 'gem').length === 0 && <span className="bcg-empty">None yet</span>}
                                    </div>
                                </div>
                                <div className="bcg-quadrant bcg-cow">
                                    <h4 className="bcg-title">Cash Cows <span className="bcg-desc">(High Volume, Low Revenue)</span></h4>
                                    <div className="bcg-items">
                                        {bcgData.filter(i => i.category === 'cow').map(i => <span key={i.id} className="bcg-pill">{i.name}</span>)}
                                        {bcgData.filter(i => i.category === 'cow').length === 0 && <span className="bcg-empty">None yet</span>}
                                    </div>
                                </div>
                                <div className="bcg-quadrant bcg-dog">
                                    <h4 className="bcg-title">Dead Weight <span className="bcg-desc">(Low Volume, Low Revenue)</span></h4>
                                    <div className="bcg-items">
                                        {bcgData.filter(i => i.category === 'dog').map(i => <span key={i.id} className="bcg-pill">{i.name}</span>)}
                                        {bcgData.filter(i => i.category === 'dog').length === 0 && <span className="bcg-empty">None yet</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Feedback */}
                    <div className="dashboard-card">
                        <div className="dashboard-card-header">
                            <h3 className="dashboard-card-title">Recent Feedback</h3>
                            <span className="card-subtitle">Latest customer reviews</span>
                        </div>
                        <div className="feedback-list">
                            {feedbackData.length === 0 ? (
                                <div style={{ color: '#A0AEC0', textAlign: 'center', padding: '24px', fontSize: '14px', fontFamily: 'Poppins' }}>No feedback yet</div>
                            ) : (
                                feedbackData.map(fb => (
                                    <div key={fb.id} className="feedback-item">
                                        <div className="feedback-header">
                                            <span className="feedback-rating">{'⭐'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}</span>
                                            <span className="feedback-name">{fb.customerName}</span>
                                            <span className="feedback-date">{new Date(fb.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {fb.comment && <div className="feedback-comment">"{fb.comment}"</div>}
                                        {fb.orderItems && <div className="feedback-items">Ordered: {fb.orderItems}</div>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Reports;



