import React, { useState, useEffect } from 'react';
import { Download, Calendar, ArrowUpRight, ArrowDownRight, Loader2, Info, ChevronLeft, ChevronRight, X, Eye, TrendingUp, Package, Activity, Percent, Calculator, Users } from 'lucide-react';
import RevenueOrdersModal from '../components/RevenueOrdersModal';
import './reports.css';
import { useAuth } from '../context/AuthContext';
import {
    getAnalyticsSummary,
    getActiveTablesCount,
    getBestSellingDishes,
    getRevenueData,
    getPeakHourData,
    getAdvancedAnalytics,
    getRecentFeedback
} from '../services/supabaseService';
import type {
    AnalyticsSummary,
    BestSellingDish,
    RevenueRecord,
    PeakHourData,
    RevenueBreakdown,
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
    if (intensity < 0.5) return '#7F9CF5';
    if (intensity < 0.75) return '#4C51BF';
    return '#312E81';
};

const Reports: React.FC = () => {
    const { activeRestaurantId } = useAuth();
    const [timeframe, setTimeframe] = useState('week');
    const [weekOffset, setWeekOffset] = useState<number>(0);
    const [monthOffset, setMonthOffset] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const [summary, setSummary] = useState<AnalyticsSummary>({
        totalRevenue: 0,
        totalOrders: 0,
        revenueChange: 0,
        ordersChange: 0
    });
    const [activeTables, setActiveTables] = useState(0);
    const [topItems, setTopItems] = useState<BestSellingDish[]>([]);
    const [showAllItemsModal, setShowAllItemsModal] = useState(false);
    const [revenueHistory, setRevenueHistory] = useState<RevenueRecord[]>([]);

    // ── Revenue Orders Modal state ──
    const [ordersModalOpen, setOrdersModalOpen]   = useState(false);
    const [ordersModalStart, setOrdersModalStart] = useState<Date>(new Date());
    const [ordersModalEnd, setOrdersModalEnd]     = useState<Date>(new Date());
    const [ordersModalLabel, setOrdersModalLabel] = useState('');
    // Persisted active range for the "View" button
    const [activeDateRange, setActiveDateRange]   = useState<{ start: Date; end: Date } | null>(null);
    const [peakData, setPeakData] = useState<PeakHourData>(
        Array.from({ length: 7 }, () => Array(24).fill(0))
    );
    const [advanced, setAdvanced] = useState<RevenueBreakdown | null>(null);
    const [feedbackData, setFeedbackData] = useState<FeedbackRecord[]>([]);

    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const formatCurrency = (val: number) => `₹${val.toLocaleString()}`;

    // Helper to get week start and end dates
    const getWeekDateRange = (offset: number) => {
        const now = new Date();
        // Week starts on Monday (getDay(): 0=Sun,1=Mon,...6=Sat → subtract getDay()-1, clamp Sun to -6)
        const dayOfWeek = now.getDay(); // 0=Sun
        const daysFromMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMon);
        const startOfWeek = new Date(startOfThisWeek);
        startOfWeek.setDate(startOfWeek.getDate() - offset * 7);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        const formatDate = (d: Date) => {
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        };
        return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}, ${endOfWeek.getFullYear()}`;
    };

    // Helper to get month label
    const getMonthLabel = (offset: number) => {
        const now = new Date();
        const targetMonth = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        return targetMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    useEffect(() => {
        setWeekOffset(0);
        setMonthOffset(0);
    }, [timeframe]);

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
                // Week starts on Monday
                const dayOfWeek = now.getDay(); // 0=Sun
                const daysFromMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMon);
                startDate = new Date(startOfThisWeek);
                startDate.setDate(startDate.getDate() - weekOffset * 7);
                startDate.setHours(0, 0, 0, 0);

                endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 7);
                endDate.setMilliseconds(endDate.getMilliseconds() - 1);
            } else if (timeframe === 'month') {
                startDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
                startDate.setHours(0, 0, 0, 0);

                endDate = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 1);
                endDate.setMilliseconds(endDate.getMilliseconds() - 1);
            } else if (timeframe === 'all') {
                startDate = new Date(0);
                endDate = new Date();
            } else if (timeframe === 'custom' && customStart && customEnd) {
                startDate = new Date(customStart);
                endDate = new Date(customEnd);
                endDate.setHours(23, 59, 59, 999);
            }

            const [
                analyticsSummary,
                tablesCount,
                bestDishes,
                revenueData,
                heatmap,
                advancedData,
                recentFeedback
            ] = await Promise.all([
                getAnalyticsSummary(activeRestaurantId, startDate, endDate),
                getActiveTablesCount(activeRestaurantId),
                getBestSellingDishes(activeRestaurantId, startDate, endDate),
                getRevenueData(activeRestaurantId, startDate, endDate),
                getPeakHourData(activeRestaurantId, startDate, endDate),
                getAdvancedAnalytics(activeRestaurantId, startDate, endDate),
                getRecentFeedback(activeRestaurantId)
            ]);

            setSummary(analyticsSummary);
            setActiveTables(tablesCount);
            setTopItems(bestDishes);

            // Build a complete day-by-day record for the selected range,
            // filling in zeros for days with no revenue data.
            const filledRevenue: RevenueRecord[] = [];
            let startDay = new Date(startDate);
            if (timeframe === 'all') {
                if (revenueData.length > 0) {
                    // Start from the earliest recorded revenue date (sorted ascending)
                    startDay = new Date(revenueData[0].revenueDate);
                } else {
                    // Fallback if no records exist: show the last 30 days of zeros
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    startDay = thirtyDaysAgo;
                }
            }
            startDay.setHours(0, 0, 0, 0);
            const endDay = new Date(endDate);
            endDay.setHours(0, 0, 0, 0);

            // Prevent infinite or extremely long loops by capping the range at 5 years
            const dayDifference = Math.ceil((endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24));
            const maxDaysToLoop = 366 * 5;
            const loopEndDate = dayDifference > maxDaysToLoop ? new Date(startDay.getTime() + maxDaysToLoop * 24 * 60 * 60 * 1000) : endDay;

            const toISTDateKey = (dateObj: Date) => {
                const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
                const tzDate = new Date(dateObj.getTime() + IST_OFFSET_MS);
                return tzDate.toISOString().split('T')[0];
            };

            for (const d = new Date(startDay); d <= loopEndDate; d.setDate(d.getDate() + 1)) {
                const dateStr = toISTDateKey(d);
                const existing = revenueData.find(r => r.revenueDate === dateStr);
                filledRevenue.push(
                    existing ?? {
                        id: `zero-${dateStr}`,
                        restaurantId: activeRestaurantId,
                        revenueDate: dateStr,
                        totalOrders: 0,
                        totalRevenue: 0,
                        totalTax: 0,
                        totalDiscount: 0,
                        createdAt: d.toISOString(),
                        updatedAt: d.toISOString()
                    }
                );
            }
            setRevenueHistory(filledRevenue);
            setActiveDateRange({ start: startDate, end: endDate }); // persist for View button
            setPeakData(heatmap);
            setAdvanced(advancedData);
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
    }, [activeRestaurantId, timeframe, customStart, customEnd, weekOffset, monthOffset]);

    // For month view: aggregate daily revenue into weekly buckets so the chart stays readable.
    // For 'all' or long custom ranges: aggregate by month.
    // Each bucket carries dateStart/dateEnd for bar-click filtering.
    const getChartData = (): { label: string; revenue: number; orders: number; dateStart: Date; dateEnd: Date }[] => {
        if (revenueHistory.length === 0) return [];

        if (timeframe === 'month') {
            const buckets: { label: string; revenue: number; orders: number; dateStart: Date; dateEnd: Date }[] = [];
            let bucketRevenue = 0;
            let bucketOrders = 0;
            let bucketDayStart: Date | null = null;
            let bucketDayEnd: Date | null = null;

            revenueHistory.forEach((record, idx) => {
                const d = new Date(record.revenueDate);
                const dayOfMonth = d.getDate();
                
                // Group by calendar weeks starting on Monday
                const firstOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
                const firstDayOfWeek = firstOfMonth.getDay();
                const firstDayMon = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
                const bucketIndex = Math.floor((dayOfMonth - 1 + firstDayMon) / 7);

                if (bucketDayStart === null) bucketDayStart = d;
                bucketDayEnd = d;

                bucketRevenue += record.totalRevenue;
                bucketOrders  += record.totalOrders;

                const nextRecord       = revenueHistory[idx + 1];
                const nextBucketIndex  = nextRecord
                    ? Math.floor((new Date(nextRecord.revenueDate).getDate() - 1 + firstDayMon) / 7)
                    : -1;

                if (nextBucketIndex !== bucketIndex || !nextRecord) {
                    const s = new Date(bucketDayStart!);
                    s.setHours(0, 0, 0, 0);
                    const e = new Date(bucketDayEnd!);
                    e.setHours(23, 59, 59, 999);
                    buckets.push({
                        label:     `Wk ${bucketIndex + 1}`,
                        revenue:   bucketRevenue,
                        orders:    bucketOrders,
                        dateStart: s,
                        dateEnd:   e
                    });
                    bucketRevenue  = 0;
                    bucketOrders   = 0;
                    bucketDayStart = null;
                    bucketDayEnd   = null;
                }
            });

            return buckets;
        }

        // Group by month for 'all' or ranges > 31 days
        if (timeframe === 'all' || revenueHistory.length > 31) {
            const monthlyBuckets: Record<string, { label: string; revenue: number; orders: number; dateStart: Date; dateEnd: Date; date: Date }> = {};

            revenueHistory.forEach(record => {
                const d     = new Date(record.revenueDate);
                const year  = d.getFullYear();
                const month = d.getMonth();
                const key   = `${year}-${month.toString().padStart(2, '0')}`;

                if (!monthlyBuckets[key]) {
                    const mStart = new Date(year, month, 1, 0, 0, 0, 0);
                    const mEnd   = new Date(year, month + 1, 0, 23, 59, 59, 999);
                    monthlyBuckets[key] = {
                        label:     d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                        revenue:   0,
                        orders:    0,
                        dateStart: mStart,
                        dateEnd:   mEnd,
                        date:      d
                    };
                }
                monthlyBuckets[key].revenue += record.totalRevenue;
                monthlyBuckets[key].orders  += record.totalOrders;
            });

            return Object.values(monthlyBuckets).sort((a, b) => a.date.getTime() - b.date.getTime());
        }

        // Today / week: one bar per day
        return revenueHistory.map(record => {
            const d = new Date(record.revenueDate);
            const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
            const dayEnd   = new Date(d); dayEnd.setHours(23, 59, 59, 999);
            let label: string;
            if (revenueHistory.length > 14) {
                label = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            } else {
                label = d.toLocaleDateString('en-US', { weekday: 'short' });
            }
            return { label, revenue: record.totalRevenue, orders: record.totalOrders, dateStart: dayStart, dateEnd: dayEnd };
        });
    };

    const chartData  = getChartData();
    const maxChartRevenue = Math.max(...chartData.map(b => b.revenue), 1);

    // Opens the orders modal for the full currently-selected period
    const openOrdersModalForFullRange = () => {
        if (!activeDateRange) return;
        setOrdersModalStart(activeDateRange.start);
        setOrdersModalEnd(activeDateRange.end);
        setOrdersModalLabel(chartTitle());
        setOrdersModalOpen(true);
    };

    // Opens the orders modal filtered to a specific bar's date range
    const openOrdersModalForBar = (bar: { label: string; dateStart: Date; dateEnd: Date }) => {
        setOrdersModalStart(bar.dateStart);
        setOrdersModalEnd(bar.dateEnd);
        setOrdersModalLabel(bar.label);
        setOrdersModalOpen(true);
    };

    // Dynamic chart section title
    const chartTitle = (): string => {
        if (timeframe === 'today') return 'Revenue Overview (Today)';
        if (timeframe === 'week') return `Revenue Overview (${getWeekDateRange(weekOffset)})`;
        if (timeframe === 'month') return `Revenue Overview (${getMonthLabel(monthOffset)})`;
        if (timeframe === 'custom' && customStart && customEnd) return `Revenue Overview (${customStart} → ${customEnd})`;
        return 'Revenue Overview (All Time)';
    };

    // CSV Export handler
    const handleExportCSV = () => {
        const rows: string[][] = [
            ['Date', 'Total Revenue (₹)', 'Total Orders', 'Tax (₹)', 'Discount (₹)'],
            ...revenueHistory.map(r => [
                r.revenueDate,
                r.totalRevenue.toFixed(2),
                String(r.totalOrders),
                r.totalTax.toFixed(2),
                r.totalDiscount.toFixed(2)
            ]),
            [],
            ['Item Name', 'Units Sold', 'Revenue (₹)'],
            ...topItems.map(i => [i.name, String(i.sold), i.revenue.toFixed(2)])
        ];

        const csvContent = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tablekard_report_${timeframe}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Max count across all visible hours for heatmap scaling
    const peakMax = Math.max(
        ...DAYS.map((_, di) => Math.max(...HOURS.map(h => peakData[di]?.[h] ?? 0))),
        1
    );

    // ── Loading state ──
    if (loading && summary.totalRevenue === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="reports-loading-screen">
                    <div className="reports-loading-spinner" />
                    <p className="reports-loading-text">Generating your insights...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="reports-header">
                    <h1 className="reports-page-title">Reports & Analytics</h1>
                    <div className="reports-header-right">
                        {loading && <Loader2 className="animate-spin" size={20} style={{ color: '#4C51BF' }} />}
                    </div>
                </div>

                {/* Filters */}
                <div className="reports-filters">
                    <button className={`report-filter-btn ${timeframe === 'today' ? 'active' : ''}`} onClick={() => setTimeframe('today')}>Today</button>
                    <button className={`report-filter-btn ${timeframe === 'week' ? 'active' : ''}`} onClick={() => setTimeframe('week')}>Week</button>
                    <button className={`report-filter-btn ${timeframe === 'month' ? 'active' : ''}`} onClick={() => setTimeframe('month')}>Month</button>
                    <button className={`report-filter-btn ${timeframe === 'all' ? 'active' : ''}`} onClick={() => setTimeframe('all')}>All</button>

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

                    {timeframe === 'week' && (
                      <div className="pager-filter-group" style={{ height: '42px', marginLeft: '12px' }}>
                        <button
                          type="button"
                          className="pager-arrow-btn"
                          onClick={() => setWeekOffset(prev => prev + 1)}
                          title="Previous Week"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="pager-label">{getWeekDateRange(weekOffset)}</span>
                        <button
                          type="button"
                          className="pager-arrow-btn"
                          onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
                          disabled={weekOffset === 0}
                          title="Next Week"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}

                    {timeframe === 'month' && (
                      <div className="pager-filter-group" style={{ height: '42px', marginLeft: '12px' }}>
                        <button
                          type="button"
                          className="pager-arrow-btn"
                          onClick={() => setMonthOffset(prev => prev + 1)}
                          title="Previous Month"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="pager-label">{getMonthLabel(monthOffset)}</span>
                        <button
                          type="button"
                          className="pager-arrow-btn"
                          onClick={() => setMonthOffset(prev => Math.max(0, prev - 1))}
                          disabled={monthOffset === 0}
                          title="Next Month"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}

                    <button className="report-export-btn" onClick={handleExportCSV}>
                        <Download size={16} /> Export CSV
                    </button>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-[1200px] w-full mb-6">
                    <div className="bg-tk-bg-card p-3 sm:p-3 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                        <div className="flex justify-between items-start mb-2 relative">
                            <h3 className="text-[11px] sm:text-xs text-tk-text-secondary font-medium flex items-center gap-1">
                                Total Revenue
                                <span className="info-icon" style={{ position: 'relative', top: 'auto', right: 'auto' }}>
                                    <Info size={12} />
                                    <span className="tooltip">Total earnings from all paid orders in the selected timeframe.</span>
                                </span>
                            </h3>
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-tk-burgundy-bg flex items-center justify-center text-tk-burgundy">
                                <TrendingUp size={14} />
                            </div>
                        </div>
                        <div className="flex justify-between items-end">
                            <div className="text-[16px] sm:text-[20px] font-bold text-tk-text">{formatCurrency(summary.totalRevenue)}</div>
                            <div className={`flex items-center text-[10px] sm:text-[11px] font-medium ${summary.revenueChange >= 0 ? 'text-tk-success' : 'text-tk-error'}`}>
                                <TrendingUp size={10} className="mr-1 sm:w-[12px] sm:h-[12px]" style={summary.revenueChange < 0 ? { transform: 'rotate(180deg)' } : undefined} />
                                <span>{Math.abs(summary.revenueChange).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-tk-bg-card p-3 sm:p-3 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                        <div className="flex justify-between items-start mb-2 relative">
                            <h3 className="text-[11px] sm:text-xs text-tk-text-secondary font-medium flex items-center gap-1">
                                Total Orders
                                <span className="info-icon" style={{ position: 'relative', top: 'auto', right: 'auto' }}>
                                    <Info size={12} />
                                    <span className="tooltip">Number of successfully completed and paid orders.</span>
                                </span>
                            </h3>
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-tk-burgundy-bg flex items-center justify-center text-tk-burgundy">
                                <Package size={14} />
                            </div>
                        </div>
                        <div className="flex justify-between items-end">
                            <div className="text-[16px] sm:text-[20px] font-bold text-tk-text">{summary.totalOrders}</div>
                            <div className={`flex items-center text-[10px] sm:text-[11px] font-medium ${summary.ordersChange >= 0 ? 'text-tk-success' : 'text-tk-error'}`}>
                                <TrendingUp size={10} className="mr-1 sm:w-[12px] sm:h-[12px]" style={summary.ordersChange < 0 ? { transform: 'rotate(180deg)' } : undefined} />
                                <span>{Math.abs(summary.ordersChange).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-tk-bg-card p-3 sm:p-3 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                        <div className="flex justify-between items-start mb-2 relative">
                            <h3 className="text-[11px] sm:text-xs text-tk-text-secondary font-medium flex items-center gap-1">
                                Avg Order Value
                                <span className="info-icon" style={{ position: 'relative', top: 'auto', right: 'auto' }}>
                                    <Info size={12} />
                                    <span className="tooltip">Average amount spent per order (Total Revenue / Total Orders).</span>
                                </span>
                            </h3>
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-tk-burgundy-bg flex items-center justify-center text-tk-burgundy">
                                <Calculator size={14} />
                            </div>
                        </div>
                        <div className="flex justify-between items-end">
                            <div className="text-[16px] sm:text-[20px] font-bold text-tk-text">{formatCurrency(advanced?.aov || 0)}</div>
                            <div className={`flex items-center text-[10px] sm:text-[11px] font-medium ${(advanced?.aovChange || 0) >= 0 ? 'text-tk-success' : 'text-tk-error'}`}>
                                <TrendingUp size={10} className="mr-1 sm:w-[12px] sm:h-[12px]" style={(advanced?.aovChange || 0) < 0 ? { transform: 'rotate(180deg)' } : undefined} />
                                <span>{Math.abs(advanced?.aovChange || 0).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-tk-bg-card p-3 sm:p-3 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                        <div className="flex justify-between items-start mb-2 relative">
                            <h3 className="text-[11px] sm:text-xs text-tk-text-secondary font-medium flex items-center gap-1">
                                Active Tables
                                <span className="info-icon" style={{ position: 'relative', top: 'auto', right: 'auto' }}>
                                    <Info size={12} />
                                    <span className="tooltip">Total number of tables currently occupied by customers.</span>
                                </span>
                            </h3>
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-tk-burgundy-bg flex items-center justify-center text-tk-burgundy">
                                <Users size={14} />
                            </div>
                        </div>
                        <div className="flex justify-between items-end">
                            <div className="text-[16px] sm:text-[20px] font-bold text-tk-text">{activeTables}</div>
                            <div className="flex items-center text-[10px] sm:text-[11px] font-medium text-tk-text-secondary">
                                <span>Occupied</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-tk-bg-card p-3 sm:p-3 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                        <div className="flex justify-between items-start mb-2 relative">
                            <h3 className="text-[11px] sm:text-xs text-tk-text-secondary font-medium flex items-center gap-1">
                                Discount Impact
                                <span className="info-icon" style={{ position: 'relative', top: 'auto', right: 'auto' }}>
                                    <Info size={12} />
                                    <span className="tooltip">Total value of discounts given and their percentage of the subtotal.</span>
                                </span>
                            </h3>
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-tk-burgundy-bg flex items-center justify-center text-tk-error">
                                <Percent size={14} />
                            </div>
                        </div>
                        <div className="flex justify-between items-end">
                            <div className="text-[16px] sm:text-[20px] font-bold text-tk-text">{formatCurrency(advanced?.impactAnalysis?.totalDiscount || 0)}</div>
                            <div className="flex items-center text-[10px] sm:text-[11px] font-medium text-tk-text-secondary">
                                <span>{(advanced?.impactAnalysis?.discountRate || 0).toFixed(1)}% of subtotal</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-tk-bg-card p-3 sm:p-3 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                        <div className="flex justify-between items-start mb-2 relative">
                            <h3 className="text-[11px] sm:text-xs text-tk-text-secondary font-medium flex items-center gap-1">
                                Tax Collected
                                <span className="info-icon" style={{ position: 'relative', top: 'auto', right: 'auto' }}>
                                    <Info size={12} />
                                    <span className="tooltip">Total taxes collected and the calculated effective tax rate.</span>
                                </span>
                            </h3>
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-tk-burgundy-bg flex items-center justify-center text-tk-success">
                                <Activity size={14} />
                            </div>
                        </div>
                        <div className="flex justify-between items-end">
                            <div className="text-[16px] sm:text-[20px] font-bold text-tk-text">{formatCurrency(advanced?.impactAnalysis?.totalTax || 0)}</div>
                            <div className="flex items-center text-[10px] sm:text-[11px] font-medium text-tk-text-secondary">
                                <span>{(advanced?.impactAnalysis?.taxRate || 0).toFixed(1)}% eff. rate</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Revenue Chart + Top Categories */}
                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <div className="dashboard-card-header">
                            <h3 className="dashboard-card-title">
                                {chartTitle()}
                                <span className="info-icon">
                                    <Info size={14} />
                                    <span className="tooltip">Click any bar to filter orders for that period. Click 'View' to see all orders.</span>
                                </span>
                            </h3>
                            <button
                                className="view-all-btn rom-view-btn"
                                onClick={openOrdersModalForFullRange}
                            >
                                <Eye size={14} /> View
                            </button>
                        </div>
                        <div className="chart-container">
                            {chartData.length === 0 ? (
                                <div style={{ color: '#A0AEC0', margin: 'auto' }}>No data available</div>
                            ) : (
                                chartData.map((bar, index) => {
                                    const heightPercentage = (bar.revenue / maxChartRevenue) * 100;
                                    return (
                                        <div
                                            key={index}
                                            className="chart-bar-group chart-bar-clickable"
                                            onClick={() => openOrdersModalForBar(bar)}
                                            title={`View orders for ${bar.label}`}
                                        >
                                            <div className="chart-tooltip">{formatCurrency(bar.revenue)}</div>
                                            <div className="chart-bar" style={{ height: `${heightPercentage}%` }}></div>
                                            <span className="chart-label">{bar.label}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="dashboard-card breakdown-card">
                        <div className="dashboard-card-header">
                            <h3 className="dashboard-card-title">
                                Order & Payment Breakdown
                                <span className="info-icon">
                                    <Info size={14} />
                                    <span className="tooltip">Distribution of orders by type and payment method.</span>
                                </span>
                            </h3>
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
                                            <span className="donut-percentage">{Math.round(advanced?.orderTypeSplit.dineIn || 0)}%</span>
                                            <span className="donut-sublabel">Dine-in</span>
                                        </div>
                                    </div>
                                    <div className="donut-legend">
                                        <div className="legend-item"><div className="legend-color" style={{ background: '#4C51BF' }}></div> Dine-in</div>
                                        <div className="legend-item"><div className="legend-color" style={{ background: '#E2E8F0' }}></div> Takeaway</div>
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
                                            <span className="donut-percentage">{Math.round(advanced?.paymentMethodSplit.online || 0)}%</span>
                                            <span className="donut-sublabel">Online</span>
                                        </div>
                                    </div>
                                    <div className="donut-legend">
                                        <div className="legend-item"><div className="legend-color" style={{ background: '#48BB78' }}></div> Online</div>
                                        <div className="legend-item"><div className="legend-color" style={{ background: '#E2E8F0' }}></div> Cash</div>
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
                            <h3 className="dashboard-card-title">
                                Top Selling Items
                                <span className="info-icon">
                                    <Info size={14} />
                                    <span className="tooltip">List of your most popular items ranked by units sold and revenue.</span>
                                </span>
                            </h3>
                            <button
                                className="view-all-btn"
                                onClick={() => setShowAllItemsModal(true)}
                            >
                                View All
                            </button>
                        </div>
                        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
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
                                        topItems.slice(0, 3).map((item, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <div className="item-name-cell">
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
                    </div>

                    {/* Peak Hour Heatmap */}
                    <div className="dashboard-card heatmap-card">
                        <div className="dashboard-card-header">
                            <h3 className="dashboard-card-title">
                                Peak Hour Heatmap
                                <span className="info-icon">
                                    <Info size={14} />
                                    <span className="tooltip">Visual distribution of order density by day and hour.</span>
                                </span>
                            </h3>
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


                    {/* Recent Feedback */}
                    <div className="dashboard-card">
                        <div className="dashboard-card-header">
                            <h3 className="dashboard-card-title">
                                Recent Feedback
                                <span className="info-icon">
                                    <Info size={14} />
                                    <span className="tooltip">Latest customer ratings and qualitative comments.</span>
                                </span>
                            </h3>
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

                {/* All Items Modal */}
                {showAllItemsModal && (
                    <div className="reports-modal-overlay" onClick={() => setShowAllItemsModal(false)}>
                        <div className="reports-modal-content" onClick={e => e.stopPropagation()}>
                            <div className="reports-modal-header">
                                <div>
                                    <h2 className="reports-modal-title">All Selling Items</h2>
                                    <p className="reports-modal-subtitle">Performance breakdown of all items in your menu</p>
                                </div>
                                <button className="reports-modal-close" onClick={() => setShowAllItemsModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="reports-modal-body">
                                <table className="top-items-table">
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Item Name</th>
                                            <th>Units Sold</th>
                                            <th>Total Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topItems.map((item, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <span className={`item-rank-tag rank-${index + 1}`}>#{index + 1}</span>
                                                </td>
                                                <td>
                                                    <div className="item-name-cell">
                                                        <span className="item-emoji-box">{item.image}</span>
                                                        <span className="item-name-text">{item.name}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="item-sold-count">{item.sold}</span>
                                                </td>
                                                <td>
                                                    <span className="item-revenue-text">{formatCurrency(item.revenue)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="reports-modal-footer">
                                <button className="report-filter-btn active" onClick={() => setShowAllItemsModal(false)}>
                                    Close View
                                </button>
                            </div>
                        </div>
                    </div>
                )}

        {/* Revenue Orders Modal */}
        {ordersModalOpen && activeRestaurantId && (
            <RevenueOrdersModal
                restaurantId={activeRestaurantId}
                startDate={ordersModalStart}
                endDate={ordersModalEnd}
                periodLabel={ordersModalLabel}
                onClose={() => setOrdersModalOpen(false)}
            />
        )}
    </>
    );
};

export default Reports;
