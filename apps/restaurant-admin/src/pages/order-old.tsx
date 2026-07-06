import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, TrendingUp, Calendar, Package, ChevronLeft, ChevronRight, LayoutGrid, List, Check, X, ArrowUpDown, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { updateOrderStatus, updatePaymentStatus } from '../services/supabaseService';
import type { DashboardOrder } from '../services/supabaseService';
import { useDashboardOrders, useInvalidateQueries, queryKeys, useRevenueData } from '../hooks/useSupabaseQuery';
// import OrderDetailModal from '../components/OrderDetailModal';// ── Status transition rules ──────────────────────────────────────────
// Once an order is "ready", it can ONLY go to "cancelled".
// Once "cancelled", no further changes allowed.
const getAvailableStatuses = (currentStatus: string) => {
    const st = currentStatus.toLowerCase();
    if (st === 'ready') return [{ value: 'ready', label: 'Ready' }, { value: 'cancelled', label: 'Cancelled' }];
    if (st === 'cancelled') return [{ value: 'cancelled', label: 'Cancelled' }];
    // For pending/preparing — full forward flow
    return [
        { value: 'pending', label: 'Placed' },
        { value: 'preparing', label: 'Preparing' },
        { value: 'ready', label: 'Ready' },
        { value: 'cancelled', label: 'Cancelled' },
    ];
};


const Order: React.FC = () => {
    const { activeRestaurantId } = useAuth();
    const [selectedTable, setSelectedTable] = useState('All Tables');
    const [selectedPayment, setSelectedPayment] = useState('Payment Method');
    const [selectedStatus, setSelectedStatus] = useState('Status');
    const [selectedDateRange, setSelectedDateRange] = useState<string>('today');
    const [customDate, setCustomDate] = useState<string>('');
    const [weekOffset, setWeekOffset] = useState<number>(0);
    const [monthOffset, setMonthOffset] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(null);
    const [visibleCount, setVisibleCount] = useState(20);
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_high' | 'amount_low'>('oldest');
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

    useEffect(() => {
        setWeekOffset(0);
        setMonthOffset(0);
    }, [selectedDateRange]);

    // Reset visible count when filters change
    useEffect(() => {
        setVisibleCount(20);
    }, [searchQuery, selectedTable, selectedPayment, selectedStatus, selectedDateRange, customDate, weekOffset, monthOffset]);

    const { data: orders = [], isLoading: loading } = useDashboardOrders(activeRestaurantId);
    const { data: revenueData = [], isLoading: loadingRevenue } = useRevenueData(activeRestaurantId);
    const { invalidateOrders } = useInvalidateQueries();
    const queryClient = useQueryClient();

    const activeDetailOrder = useMemo(() => {
        if (!selectedOrder) return null;
        return orders.find(o => o.id === selectedOrder.id) || selectedOrder;
    }, [orders, selectedOrder]);

    // const handleItemStatusChange = async (itemId: string, nextStatus: string) => {
    //     if (!activeRestaurantId) return;
    //     try {
    //         await updateOrderItemStatus(itemId, nextStatus);
    //         invalidateOrders(activeRestaurantId);
    //     } catch (err) {
    //         console.error('Failed to update item status', err);
    //     }
    // };

    // ── Stats ─────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const startOfLastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 7);

        let today = 0, yesterday = 0, week = 0, lastWeek = 0;

        revenueData.forEach(r => {
            const [year, month, day] = r.revenueDate.split('-');
            const rDate = new Date(Number(year), Number(month) - 1, Number(day));
            const rTime = rDate.getTime();

            if (rTime === startOfToday.getTime()) {
                today += r.totalOrders;
            } else if (rTime === startOfYesterday.getTime()) {
                yesterday += r.totalOrders;
            }

            if (rDate >= startOfWeek) {
                week += r.totalOrders;
            } else if (rDate >= startOfLastWeek && rDate < startOfWeek) {
                lastWeek += r.totalOrders;
            }
        });

        const todayChange = yesterday === 0 ? (today > 0 ? 100 : 0) : Math.round(((today - yesterday) / yesterday) * 100);
        const weekChange = lastWeek === 0 ? (week > 0 ? 100 : 0) : Math.round(((week - lastWeek) / lastWeek) * 100);

        return { today, week, todayChange, weekChange };
    }, [revenueData]);



    const handleStatusChange = async (orderId: string, nextStatus: string) => {
        if (!activeRestaurantId) return;

        const queryKey = queryKeys.dashboardOrders(activeRestaurantId);
        const previousOrders = queryClient.getQueryData<any[]>(queryKey);

        queryClient.setQueryData(queryKey, (old: any[] | undefined) => {
            if (!old) return [];
            return old.map(order => {
                if (order.id === orderId) {
                    let statusColor = 'yellow';
                    const st = nextStatus.toLowerCase();
                    if (st === 'preparing') statusColor = 'blue';
                    else if (st === 'ready') statusColor = 'green';
                    else if (st === 'cancelled') statusColor = 'red';

                    return {
                        ...order,
                        status: nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1),
                        statusColor
                    };
                }
                return order;
            });
        });

        try {
            await updateOrderStatus(orderId, nextStatus.toLowerCase() as any);
            invalidateOrders(activeRestaurantId);
        } catch (err) {
            console.error('Failed to update status', err);
            if (previousOrders) {
                queryClient.setQueryData(queryKey, previousOrders);
            }
        }
    };

    const handlePaymentStatusChange = async (orderId: string, newStatus: string) => {
        if (!activeRestaurantId) return;

        const queryKey = queryKeys.dashboardOrders(activeRestaurantId);
        const previousOrders = queryClient.getQueryData<any[]>(queryKey);

        queryClient.setQueryData(queryKey, (old: any[] | undefined) => {
            if (!old) return [];
            return old.map(order => {
                if (order.id === orderId) {
                    return {
                        ...order,
                        paymentStatus: newStatus.charAt(0).toUpperCase() + newStatus.slice(1),
                        paymentStatusColor: newStatus.toLowerCase()
                    };
                }
                return order;
            });
        });

        try {
            await updatePaymentStatus(orderId, newStatus);
            invalidateOrders(activeRestaurantId);
        } catch (err) {
            console.error('Failed to update payment status', err);
            if (previousOrders) {
                queryClient.setQueryData(queryKey, previousOrders);
            }
        }
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const matchesSearch =
                o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.items.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTable = selectedTable === 'All Tables' || o.table === selectedTable;
            const matchesPayment =
                selectedPayment === 'Payment Method' ||
                o.paymentMethod.toLowerCase() === selectedPayment.toLowerCase();
            const matchesStatus =
                selectedStatus === 'Status' ||
                o.status.toLowerCase() === selectedStatus.toLowerCase();
            const matchesDate = (() => {
                const tDate = new Date(o.createdAt);
                const now = new Date();
                const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

                if (selectedDateRange === 'today') {
                    return tDate >= startOfToday;
                } else if (selectedDateRange === 'yesterday') {
                    return tDate >= startOfYesterday && tDate < startOfToday;
                } else if (selectedDateRange === 'week') {
                    const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
                    const startOfWeekN = new Date(startOfThisWeek);
                    startOfWeekN.setDate(startOfWeekN.getDate() - weekOffset * 7);
                    const endOfWeekN = new Date(startOfWeekN);
                    endOfWeekN.setDate(endOfWeekN.getDate() + 7);
                    return tDate >= startOfWeekN && tDate < endOfWeekN;
                } else if (selectedDateRange === 'month') {
                    const startOfMonthN = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
                    const endOfMonthN = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 1);
                    return tDate >= startOfMonthN && tDate < endOfMonthN;
                } else if (selectedDateRange === 'all') {
                    return true;
                } else if (selectedDateRange === 'custom' && customDate) {
                    const selectedDay = new Date(customDate).toDateString();
                    return tDate.toDateString() === selectedDay;
                }
                return true;
            })();
            return matchesSearch && matchesTable && matchesPayment && matchesStatus && matchesDate;
        });
    }, [orders, searchQuery, selectedTable, selectedPayment, selectedStatus, selectedDateRange, customDate, weekOffset, monthOffset]);

    // Helper to get week start and end dates
    const getWeekDateRange = (offset: number) => {
        const now = new Date();
        const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
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

    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!loadMoreRef.current) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && visibleCount < filteredOrders.length) {
                setVisibleCount(prev => prev + 20);
            }
        }, { rootMargin: '200px' });

        observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [visibleCount, filteredOrders.length]);

    return (
        <>
            {/* Header */}
            <div className="flex justify-between items-start mb-6 max-md:flex-col max-md:gap-3 max-md:mt-4">
                <div>
                    <h1 className="text-[26px] font-bold text-[#0F172A] m-0 max-md:ml-16 dark:text-tk-text">Orders</h1>
                    <p className="text-[13px] text-[#475569] mt-1 mb-0 dark:text-tk-text-secondary max-md:ml-16">Manage and track all your restaurant orders</p>
                </div>
                <div className="flex items-center gap-3 max-md:w-full">
                    <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border-[1.5px] border-[#E2E8F0] w-[240px] transition-all duration-200 focus-within:border-tk-burgundy focus-within:shadow-[0_0_0_3px_rgba(139,58,30,0.06)] max-md:w-full dark:bg-tk-bg-card dark:border-tk-border">
                        <Search size={16} color="#94A3B8" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            className="border-none outline-none text-[13px] text-[#0F172A] bg-transparent w-full placeholder:text-[#94A3B8] dark:text-tk-text dark:placeholder:text-tk-text-muted"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 gap-6 mb-8 max-md:grid-cols-1">
                <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(0,0,0,0.02)] relative overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] border-[1.5px] border-transparent dark:bg-tk-bg-card dark:border-tk-border">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#8B3A1E] to-[#D4816B]"></div>
                    <h3 className="text-sm text-[#4A5568] mb-3 font-medium mt-1 normal-case tracking-normal dark:text-tk-text-secondary">Total Orders Today</h3>
                    <div className="text-4xl font-bold text-[#1A202C] mb-3 dark:text-tk-text">{loadingRevenue ? '...' : stats.today}</div>
                    <div className="flex items-center text-[13px]">
                        <span
                            className={`font-medium ${stats.todayChange >= 0 ? 'text-[#68D391]' : 'text-[#E53E3E]'}`}
                        >
                            {stats.todayChange > 0 ? '+' : ''}{stats.todayChange}% vs yesterday
                        </span>
                        <TrendingUp
                            size={16}
                            color={stats.todayChange >= 0 ? '#68D391' : '#E53E3E'}
                            className="ml-auto"
                            style={stats.todayChange < 0 ? { transform: 'rotate(180deg)' } : undefined}
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(0,0,0,0.02)] relative overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] border-[1.5px] border-transparent dark:bg-tk-bg-card dark:border-tk-border">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#5C7A7A] to-[#8AABAB]"></div>
                    <h3 className="text-sm text-[#4A5568] mb-3 font-medium mt-1 normal-case tracking-normal dark:text-tk-text-secondary">Total Orders This Week</h3>
                    <div className="text-4xl font-bold text-[#1A202C] mb-3 dark:text-tk-text">{loadingRevenue ? '...' : stats.week}</div>
                    <div className="flex items-center text-[13px]">
                        <span
                            className={`font-medium ${stats.weekChange >= 0 ? 'text-[#7F9CF5]' : 'text-[#E53E3E]'}`}
                        >
                            {stats.weekChange > 0 ? '+' : ''}{stats.weekChange}% vs last week
                        </span>
                        <TrendingUp
                            size={16}
                            color={stats.weekChange >= 0 ? '#7F9CF5' : '#E53E3E'}
                            className="ml-auto"
                            style={stats.weekChange < 0 ? { transform: 'rotate(180deg)' } : undefined}
                        />
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                <div className="flex gap-2 items-center flex-wrap max-md:flex-col max-md:w-full max-md:items-stretch">
                    <div className="relative flex items-center max-md:w-full">
                        <Calendar size={14} className="absolute left-3 text-[#475569] pointer-events-none z-[1]" />
                        <select
                            className="px-3 py-2 pl-8 bg-white border-[1.5px] border-[#E2E8F0] rounded-lg text-[13px] font-medium text-[#334155] cursor-pointer outline-none transition-colors duration-200 focus:border-tk-burgundy max-md:w-full dark:bg-tk-bg-card dark:border-tk-border dark:text-tk-text appearance-none pr-8 bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%2210%22_height=%2210%22_viewBox=%220_0_24_24%22_fill=%22none%22_stroke=%22%2394A3B8%22_stroke-width=%223%22_stroke-linecap=%22round%22_stroke-linejoin=%22round%22%3E%3Cpath_d=%22m6_9_6_6_6-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_10px_center]"
                            value={selectedDateRange}
                            onChange={(e) => setSelectedDateRange(e.target.value)}
                        >
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="week">Week</option>
                            <option value="month">Month</option>
                            <option value="all">All</option>
                            <option value="custom">Custom Range</option>
                        </select>
                        {selectedDateRange === 'custom' && (
                            <input
                                type="date"
                                className="px-3 py-2 ml-2 bg-white border-[1.5px] border-[#E2E8F0] rounded-lg text-[13px] font-medium text-[#334155] outline-none transition-colors duration-200 focus:border-tk-burgundy min-w-[140px] dark:bg-tk-bg-card dark:border-tk-border dark:text-tk-text"
                                value={customDate}
                                onChange={(e) => setCustomDate(e.target.value)}
                            />
                        )}
                    </div>

                    {selectedDateRange === 'week' && (
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-[#E2E8F0] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] h-[38px] max-md:w-full max-md:justify-center dark:bg-tk-bg-card dark:border-tk-border">
                            <button
                                type="button"
                                className="flex items-center justify-center w-7 h-7 rounded-md border border-[#E2E8F0] bg-[#F7FAFC] text-[#4A5568] cursor-pointer transition-all duration-200 p-0 hover:not-disabled:bg-[#EDF2F7] hover:not-disabled:text-[#1A202C] hover:not-disabled:border-[#CBD5E0] disabled:opacity-40 disabled:cursor-not-allowed dark:bg-tk-bg-elevated dark:border-tk-border dark:text-tk-text"
                                onClick={() => setWeekOffset(prev => prev + 1)}
                                title="Previous Week"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-[13px] font-semibold text-[#2D3748] min-w-[140px] text-center select-none dark:text-tk-text">{getWeekDateRange(weekOffset)}</span>
                            <button
                                type="button"
                                className="flex items-center justify-center w-7 h-7 rounded-md border border-[#E2E8F0] bg-[#F7FAFC] text-[#4A5568] cursor-pointer transition-all duration-200 p-0 hover:not-disabled:bg-[#EDF2F7] hover:not-disabled:text-[#1A202C] hover:not-disabled:border-[#CBD5E0] disabled:opacity-40 disabled:cursor-not-allowed dark:bg-tk-bg-elevated dark:border-tk-border dark:text-tk-text"
                                onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
                                disabled={weekOffset === 0}
                                title="Next Week"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}

                    {selectedDateRange === 'month' && (
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-[#E2E8F0] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] h-[38px] max-md:w-full max-md:justify-center dark:bg-tk-bg-card dark:border-tk-border">
                            <button
                                type="button"
                                className="flex items-center justify-center w-7 h-7 rounded-md border border-[#E2E8F0] bg-[#F7FAFC] text-[#4A5568] cursor-pointer transition-all duration-200 p-0 hover:not-disabled:bg-[#EDF2F7] hover:not-disabled:text-[#1A202C] hover:not-disabled:border-[#CBD5E0] disabled:opacity-40 disabled:cursor-not-allowed dark:bg-tk-bg-elevated dark:border-tk-border dark:text-tk-text"
                                onClick={() => setMonthOffset(prev => prev + 1)}
                                title="Previous Month"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-[13px] font-semibold text-[#2D3748] min-w-[140px] text-center select-none dark:text-tk-text">{getMonthLabel(monthOffset)}</span>
                            <button
                                type="button"
                                className="flex items-center justify-center w-7 h-7 rounded-md border border-[#E2E8F0] bg-[#F7FAFC] text-[#4A5568] cursor-pointer transition-all duration-200 p-0 hover:not-disabled:bg-[#EDF2F7] hover:not-disabled:text-[#1A202C] hover:not-disabled:border-[#CBD5E0] disabled:opacity-40 disabled:cursor-not-allowed dark:bg-tk-bg-elevated dark:border-tk-border dark:text-tk-text"
                                onClick={() => setMonthOffset(prev => Math.max(0, prev - 1))}
                                disabled={monthOffset === 0}
                                title="Next Month"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}

                    <select className="px-3 py-2 pr-8 bg-white border-[1.5px] border-[#E2E8F0] rounded-lg text-[13px] font-medium text-[#334155] cursor-pointer outline-none transition-colors duration-200 focus:border-tk-burgundy max-md:w-full appearance-none bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%2210%22_height=%2210%22_viewBox=%220_0_24_24%22_fill=%22none%22_stroke=%22%2394A3B8%22_stroke-width=%223%22_stroke-linecap=%22round%22_stroke-linejoin=%22round%22%3E%3Cpath_d=%22m6_9_6_6_6-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_10px_center] dark:bg-tk-bg-card dark:border-tk-border dark:text-tk-text" value={selectedTable} onChange={e => setSelectedTable(e.target.value)}>
                        <option value="All Tables">All Tables</option>
                        {Array.from(new Set(orders.map(o => o.table))).map(table => (
                            table !== 'N/A' && <option key={table} value={table}>{table}</option>
                        ))}
                    </select>

                    <select className="px-3 py-2 pr-8 bg-white border-[1.5px] border-[#E2E8F0] rounded-lg text-[13px] font-medium text-[#334155] cursor-pointer outline-none transition-colors duration-200 focus:border-tk-burgundy max-md:w-full appearance-none bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%2210%22_height=%2210%22_viewBox=%220_0_24_24%22_fill=%22none%22_stroke=%22%2394A3B8%22_stroke-width=%223%22_stroke-linecap=%22round%22_stroke-linejoin=%22round%22%3E%3Cpath_d=%22m6_9_6_6_6-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_10px_center] dark:bg-tk-bg-card dark:border-tk-border dark:text-tk-text" value={selectedPayment} onChange={e => setSelectedPayment(e.target.value)}>
                        <option value="Payment Method">All Payment</option>
                        <option value="cash">Cash</option>
                        <option value="online">Online</option>
                    </select>

                    <select className="px-3 py-2 pr-8 bg-white border-[1.5px] border-[#E2E8F0] rounded-lg text-[13px] font-medium text-[#334155] cursor-pointer outline-none transition-colors duration-200 focus:border-tk-burgundy max-md:w-full appearance-none bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%2210%22_height=%2210%22_viewBox=%220_0_24_24%22_fill=%22none%22_stroke=%22%2394A3B8%22_stroke-width=%223%22_stroke-linecap=%22round%22_stroke-linejoin=%22round%22%3E%3Cpath_d=%22m6_9_6_6_6-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_10px_center] dark:bg-tk-bg-card dark:border-tk-border dark:text-tk-text" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                        <option value="Status">All Status</option>
                        <option value="pending">Placed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Orders List */}
            <div className="bg-white rounded-2xl border border-[#EEF2F6] p-6 dark:bg-tk-bg-card dark:border-tk-border">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-semibold text-[#0F172A] m-0 dark:text-tk-text">All Orders</h2>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-[#475569] font-medium bg-[#F1F5F9] px-3 py-1 rounded-full dark:bg-tk-bg-hover dark:text-tk-text-secondary">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</span>

                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-tk-border bg-tk-bg-surface hover:bg-tk-bg-hover text-tk-text-secondary hover:text-tk-text text-[12px] font-semibold transition-colors whitespace-nowrap h-[32px] shrink-0"
                            >
                                <ArrowUpDown size={13} />
                                <span className="opacity-70 font-medium">Sort:</span>
                                {sortBy === 'newest' && 'Newest'}
                                {sortBy === 'oldest' && 'Oldest'}
                                {sortBy === 'amount_high' && 'High to Low'}
                                {sortBy === 'amount_low' && 'Low to High'}
                                <ChevronDown size={14} className="ml-1" />
                            </button>
                            {isSortDropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-[180px] bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-[fadeIn_0.15s_ease-out] dark:bg-tk-bg-surface dark:border-tk-border">
                                    {[
                                        { value: 'newest', label: 'Newest First' },
                                        { value: 'oldest', label: 'Oldest First' },
                                        { value: 'amount_high', label: 'Amount: High to Low' },
                                        { value: 'amount_low', label: 'Amount: Low to High' }
                                    ].map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => { setSortBy(option.value as any); setIsSortDropdownOpen(false); }}
                                            className={`w-full text-left px-4 py-2 text-[13px] font-medium transition-colors ${sortBy === option.value ? 'bg-tk-burgundy/10 text-tk-burgundy' : 'text-tk-text hover:bg-tk-bg-hover'}`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex bg-white border border-[#E2E8F0] rounded-full p-0.5 dark:bg-tk-bg-surface dark:border-tk-border">
                            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${viewMode === 'table' ? 'bg-tk-burgundy/10 text-tk-burgundy' : 'text-[#94A3B8] hover:text-[#0F172A] dark:text-tk-text-secondary dark:hover:text-tk-text'}`} title="Table View">
                                <List size={16} />
                            </button>
                            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${viewMode === 'grid' ? 'bg-tk-burgundy/10 text-tk-burgundy' : 'text-[#94A3B8] hover:text-[#0F172A] dark:text-tk-text-secondary dark:hover:text-tk-text'}`} title="Grid View">
                                <LayoutGrid size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col gap-3">
                        <div className="h-[120px] rounded-xl bg-gradient-to-r from-[#F1F5F9] via-[#E2E8F0] to-[#F1F5F9] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
                        <div className="h-[120px] rounded-xl bg-gradient-to-r from-[#F1F5F9] via-[#E2E8F0] to-[#F1F5F9] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
                        <div className="h-[120px] rounded-xl bg-gradient-to-r from-[#F1F5F9] via-[#E2E8F0] to-[#F1F5F9] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-[60px_20px] text-center">
                        <Package size={48} className="text-[#94A3B8] dark:text-tk-text-muted" />
                        <h3 className="text-base font-semibold text-[#475569] mt-4 mb-1 dark:text-tk-text">No orders found</h3>
                        <p className="text-[13px] text-[#475569] m-0 dark:text-tk-text-secondary">Try adjusting your filters or search query</p>
                    </div>
                ) : (
                    <>

                        {viewMode === 'table' ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
                                    <thead>
                                        <tr className="bg-[#F8FAFC] dark:bg-tk-bg-hover">
                                            <th className="py-3 px-4 text-sm font-semibold text-[#475569] border-b-2 border-[#E2E8F0] dark:text-tk-text-secondary dark:border-tk-border w-[5%] text-center">#</th>
                                            <th className="py-3 px-4 text-sm font-semibold text-[#475569] border-b-2 border-[#E2E8F0] dark:text-tk-text-secondary dark:border-tk-border w-[15%]">Details</th>
                                            <th className="py-3 px-4 text-sm font-semibold text-[#475569] border-b-2 border-[#E2E8F0] dark:text-tk-text-secondary dark:border-tk-border w-[20%]">Customer & Items</th>
                                            <th className="py-3 px-4 text-sm font-semibold text-[#475569] border-b-2 border-[#E2E8F0] dark:text-tk-text-secondary dark:border-tk-border w-[35%]">Status & Tracking</th>
                                            <th className="py-3 px-4 text-sm font-semibold text-[#475569] border-b-2 border-[#E2E8F0] dark:text-tk-text-secondary dark:border-tk-border w-[25%]">Payment & Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.slice(0, visibleCount).map((order, idx) => {
                                            const st = order.status.toLowerCase();
                                            const availableStatuses = getAvailableStatuses(st);
                                            const isLocked = st === 'cancelled';
                                            const selectColorClass = st === 'pending' ? 'bg-[#FEF3C7] text-[#92400E] dark:bg-[#FEF3C726] dark:text-[#FCD34D]' :
                                                st === 'preparing' ? 'bg-[#DBEAFE] text-[#1E40AF] dark:bg-[#DBEAFE26] dark:text-[#93C5FD]' :
                                                    (st === 'ready' || st === 'served' || st === 'completed') ? 'bg-[#D1FAE5] text-[#065F46] dark:bg-[#D1FAE526] dark:text-[#6EE7B7]' :
                                                        'bg-[#FEE2E2] text-[#991B1B] dark:bg-[#FEE2E226] dark:text-[#FCA5A5]';
                                            const paymentStatusColorClass = order.paymentStatusColor === 'paid' ? 'bg-[#D1FAE5] text-[#065F46] dark:bg-[#D1FAE526] dark:text-[#6EE7B7]' :
                                                order.paymentStatusColor === 'pending' ? 'bg-[#FEF3C7] text-[#92400E] dark:bg-[#FEF3C726] dark:text-[#FCD34D]' :
                                                    order.paymentStatusColor === 'failed' ? 'bg-[#FEE2E2] text-[#991B1B] dark:bg-[#FEE2E226] dark:text-[#FCA5A5]' :
                                                        'bg-[#EDE9FE] text-[#5B21B6] dark:bg-[#EDE9FE26] dark:text-[#C4B5FD]';

                                            const getStatusIdx = (status: string) => {
                                                switch (status?.toUpperCase()) {
                                                    case 'PENDING': return -1;
                                                    case 'CONFIRMED': return 0;
                                                    case 'PREPARING': return 1;
                                                    case 'READY': return 2;
                                                    case 'COMPLETED':
                                                    case 'SERVED': return 2;
                                                    default: return -1;
                                                }
                                            };
                                            const currentIndex = getStatusIdx(order.status);

                                            return (
                                                <tr key={order.id} className="border-b border-[#EEF2F6] hover:bg-tk-burgundy/5 transition-colors cursor-pointer dark:border-tk-border group" onClick={() => setSelectedOrder(order)}>
                                                    <td className="py-4 px-4 text-sm text-[#475569] font-medium text-center dark:text-tk-text-secondary">{idx + 1}</td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-[14px] text-[#0F172A] dark:text-tk-text">{order.orderNumber}</span>
                                                            <span className="text-[11px] text-[#64748B] font-medium mt-0.5 dark:text-tk-text-secondary">{order.time}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className="font-semibold text-[13px] text-[#1E293B] dark:text-tk-text">{order.customerName}</span>
                                                            <div className="flex gap-1.5 flex-wrap">
                                                                <span className="inline-flex items-center text-[10px] font-semibold text-[#334155] bg-[#F1F5F9] py-0.5 px-1.5 rounded capitalize dark:bg-tk-bg-hover dark:text-tk-text-secondary">{order.table}</span>
                                                                <span className="inline-flex items-center text-[10px] font-semibold bg-[#EEF2FF] text-[#4338CA] py-0.5 px-1.5 rounded capitalize dark:bg-[rgba(67,56,202,0.2)] dark:text-[#818CF8]">{order.orderType?.replace('_', ' ')}</span>
                                                            </div>
                                                            <div className="text-[11px] text-[#475569] line-clamp-1 mt-1 dark:text-tk-text-secondary" title={order.items}>{order.items}</div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex flex-col gap-3">
                                                            <select
                                                                className={`w-max text-[11px] font-bold py-1 pr-6 pl-2.5 rounded-lg border-none cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%228%22_height=%228%22_viewBox=%220_0_24_24%22_fill=%22none%22_stroke=%22currentColor%22_stroke-width=%223%22_stroke-linecap=%22round%22_stroke-linejoin=%22round%22%3E%3Cpath_d=%22m6_9_6_6_6-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_8px_center] outline-none disabled:opacity-70 ${selectColorClass}`}
                                                                value={st === 'pending' ? 'pending' : st}
                                                                onChange={(e) => { e.stopPropagation(); handleStatusChange(order.id, e.target.value); }}
                                                                disabled={isLocked}
                                                            >
                                                                {availableStatuses.map(s => (
                                                                    <option key={s.value} value={s.value} className="bg-white text-[#334155] font-medium normal-case dark:bg-tk-bg-card dark:text-tk-text">{s.label}</option>
                                                                ))}
                                                            </select>
                                                            <div className="flex items-center w-full max-w-[280px] pt-1" onClick={(e) => e.stopPropagation()}>

                                                                {order.status === 'CANCELLED' ? (
                                                                    <div className="flex-1 flex items-center relative pb-3">
                                                                        <div className="flex flex-col items-center relative group">
                                                                            <div className="w-5 h-5 rounded-full flex items-center justify-center border-[2px] z-10 bg-[#E53E3E] border-[#E53E3E]">
                                                                                <Check size={12} className="text-white" strokeWidth={3} />
                                                                            </div>
                                                                            <span className="absolute top-6 text-[9px] font-medium text-[#E53E3E] whitespace-nowrap">Placed</span>
                                                                        </div>
                                                                        <div className="flex-1 h-[2px] mx-1 bg-[#E53E3E] mt-[-6px]"></div>
                                                                        <div className="flex flex-col items-center relative group">
                                                                            <div className="w-5 h-5 rounded-full flex items-center justify-center border-[2px] z-10 bg-[#E53E3E] border-[#E53E3E]">
                                                                                <X size={12} className="text-white" strokeWidth={3} />
                                                                            </div>
                                                                            <span className="absolute top-6 text-[9px] font-bold text-[#E53E3E] whitespace-nowrap">Cancelled</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex-1 flex items-center relative pb-3">
                                                                        {[
                                                                            { label: 'Accept', value: 'CONFIRMED' },
                                                                            { label: 'Preparing', value: 'PREPARING' },
                                                                            { label: 'Ready', value: 'READY' }
                                                                        ].map((step, stepIdx, arr) => {
                                                                            const isCompleted = stepIdx <= currentIndex;
                                                                            const isNext = stepIdx === currentIndex + 1;
                                                                            const isLast = stepIdx === arr.length - 1;
                                                                            return (
                                                                                <React.Fragment key={step.value}>
                                                                                    <div className="flex flex-col items-center relative group">
                                                                                        <button
                                                                                            onClick={(e) => { e.stopPropagation(); if (isNext) handleStatusChange(order.id, step.value.toLowerCase()); }}
                                                                                            disabled={!isNext}
                                                                                            className={`w-5 h-5 rounded-full flex items-center justify-center border-[2px] z-10 transition-colors ${isCompleted ? 'bg-[#16a34a] border-[#16a34a] text-white' : isNext ? 'bg-white border-[#16a34a] cursor-pointer hover:bg-[#16a34a] hover:text-white' : 'bg-white border-[#E2E8F0] cursor-default'}`}
                                                                                        >
                                                                                            {isCompleted && <Check size={12} className="text-white" strokeWidth={3} />}
                                                                                        </button>
                                                                                        <span className={`absolute top-6 text-[9px] font-medium whitespace-nowrap ${isCompleted || isNext ? 'text-[#0F172A] dark:text-tk-text' : 'text-[#A0AEC0]'}`}>{step.label}</span>
                                                                                    </div>
                                                                                    {!isLast && (
                                                                                        <div className={`flex-1 h-[2px] mx-1 transition-colors mt-[-6px] ${stepIdx < currentIndex ? 'bg-[#16a34a]' : 'bg-[#E2E8F0]'}`} />
                                                                                    )}
                                                                                </React.Fragment>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex flex-col items-start gap-2">
                                                            <span className="text-base font-bold text-[#0F172A] dark:text-tk-text">₹{order.total.toLocaleString('en-IN')}</span>
                                                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                                <span className="text-[11px] font-semibold text-[#334155] bg-[#F8FAFC] py-1 px-2 rounded-md capitalize dark:bg-tk-bg-hover dark:text-tk-text-secondary">{order.paymentMethod}</span>
                                                                <select
                                                                    className={`text-[11px] font-bold py-1 pr-5 pl-2 rounded-lg border-none cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%2210%22_height=%2210%22_viewBox=%220_0_24_24%22_fill=%22none%22_stroke=%22currentColor%22_stroke-width=%223%22_stroke-linecap=%22round%22_stroke-linejoin=%22round%22%3E%3Cpath_d=%22m6_9_6_6_6-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_6px_center] outline-none dark:bg-tk-bg-card dark:border-tk-border ${paymentStatusColorClass}`}
                                                                    value={order.paymentStatus}
                                                                    onChange={(e) => handlePaymentStatusChange(order.id, e.target.value)}
                                                                >
                                                                    <option value="Paid">Paid</option>
                                                                    <option value="Pending">Pending</option>
                                                                    <option value="Failed">Failed</option>
                                                                    <option value="Refunded">Refunded</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-3.5 max-md:grid-cols-1">
                                {filteredOrders.slice(0, visibleCount).map((order) => {
                                    const st = order.status.toLowerCase();
                                    const availableStatuses = getAvailableStatuses(st);
                                    const isLocked = st === 'cancelled';

                                    const statusBorderClass = st === 'pending' ? 'before:bg-[#F59E0B]' :
                                        st === 'preparing' ? 'before:bg-[#3B82F6]' :
                                            (st === 'ready' || st === 'served' || st === 'completed') ? 'before:bg-[#10B981]' :
                                                'before:bg-[#EF4444]';

                                    const selectColorClass = st === 'pending' ? 'bg-[#FEF3C7] text-[#92400E] dark:bg-[#FEF3C726] dark:text-[#FCD34D]' :
                                        st === 'preparing' ? 'bg-[#DBEAFE] text-[#1E40AF] dark:bg-[#DBEAFE26] dark:text-[#93C5FD]' :
                                            (st === 'ready' || st === 'served' || st === 'completed') ? 'bg-[#D1FAE5] text-[#065F46] dark:bg-[#D1FAE526] dark:text-[#6EE7B7]' :
                                                'bg-[#FEE2E2] text-[#991B1B] dark:bg-[#FEE2E226] dark:text-[#FCA5A5]';

                                    const paymentStatusColorClass = order.paymentStatusColor === 'paid' ? 'bg-[#D1FAE5] text-[#065F46] dark:bg-[#D1FAE526] dark:text-[#6EE7B7]' :
                                        order.paymentStatusColor === 'pending' ? 'bg-[#FEF3C7] text-[#92400E] dark:bg-[#FEF3C726] dark:text-[#FCD34D]' :
                                            order.paymentStatusColor === 'failed' ? 'bg-[#FEE2E2] text-[#991B1B] dark:bg-[#FEE2E226] dark:text-[#FCA5A5]' :
                                                'bg-[#EDE9FE] text-[#5B21B6] dark:bg-[#EDE9FE26] dark:text-[#C4B5FD]';

                                    const getStatusIdx = (status: string) => {
                                        switch (status?.toUpperCase()) {
                                            case 'PENDING': return -1;
                                            case 'CONFIRMED': return 0;
                                            case 'PREPARING': return 1;
                                            case 'READY': return 2;
                                            case 'COMPLETED':
                                            case 'SERVED': return 2;
                                            default: return -1;
                                        }
                                    };
                                    const currentIndex = getStatusIdx(order.status);
                                    return (
                                        <div
                                            className={`bg-white border border-[#EEF2F6] rounded-xl p-0 cursor-pointer transition-all duration-200 overflow-hidden relative hover:border-tk-burgundy/50 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:-translate-y-[1px] dark:bg-tk-bg-card dark:border-tk-border before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] ${statusBorderClass}`}
                                            key={order.id}
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            <div className="flex justify-between items-center pt-3.5 px-4 pb-0">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-xs font-medium text-[#0F172A] dark:text-tk-text">{order.orderNumber}</span>
                                                    <span className="text-[11px] text-[#475569] font-medium dark:text-tk-text-secondary">{order.time}</span>
                                                </div>
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <select
                                                        className={`text-[11px] font-bold py-1 pr-6 pl-2.5 rounded-lg border-none cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%228%22_height=%228%22_viewBox=%220_0_24_24%22_fill=%22none%22_stroke=%22currentColor%22_stroke-width=%223%22_stroke-linecap=%22round%22_stroke-linejoin=%22round%22%3E%3Cpath_d=%22m6_9_6_6_6-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_8px_center] transition-opacity duration-200 uppercase tracking-[0.3px] outline-none disabled:cursor-not-allowed disabled:opacity-70 dark:bg-tk-bg-card dark:border-tk-border ${selectColorClass}`}
                                                        value={st === 'pending' ? 'pending' : st}
                                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                        disabled={isLocked}
                                                    >
                                                        {availableStatuses.map(s => (
                                                            <option key={s.value} value={s.value} className="bg-white text-[#334155] font-medium normal-case dark:bg-tk-bg-card dark:text-tk-text">{s.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="pt-2.5 px-4 pb-0">
                                                <div className="text-[14px] font-semibold text-[#1E293B] mb-1.5 dark:text-tk-text">{order.customerName}</div>
                                                <div className="flex gap-1.5 flex-wrap">
                                                    <span className="inline-flex items-center text-[10px] font-semibold text-[#334155] bg-[#F1F5F9] py-0.5 px-2 rounded-[5px] capitalize dark:bg-tk-bg-hover dark:text-tk-text-secondary">{order.table}</span>
                                                    <span className="inline-flex items-center text-[10px] font-semibold bg-[#EEF2FF] text-[#4338CA] py-0.5 px-2 rounded-[5px] capitalize dark:bg-[rgba(67,56,202,0.2)] dark:text-[#818CF8]">{order.orderType?.replace('_', ' ')}</span>
                                                </div>
                                            </div>

                                            <div className="px-4 py-2 text-xs text-[#475569] leading-[1.4] whitespace-nowrap overflow-hidden text-ellipsis border-t border-dashed border-[#F1F5F9] mt-2 dark:text-tk-text-secondary dark:border-tk-border dark:border-t-solid" title={order.items}>
                                                {order.items}
                                            </div>

                                            <div className="px-4 py-3 bg-[#F8FAFC] dark:bg-tk-bg-hover border-t border-solid border-[#F1F5F9] dark:border-tk-border" onClick={(e) => e.stopPropagation()}>
                                                {order.status === 'CANCELLED' ? (
                                                    <div className="flex-1 flex items-center relative">
                                                        <div className="flex flex-col items-center relative group">
                                                            <div className="w-5 h-5 rounded-full flex items-center justify-center border-[2px] z-10 bg-[#E53E3E] border-[#E53E3E]">
                                                                <Check size={12} className="text-white" strokeWidth={3} />
                                                            </div>
                                                            <span className="absolute top-6 text-[9px] font-medium text-[#E53E3E] whitespace-nowrap">Placed</span>
                                                        </div>
                                                        <div className="flex-1 h-[2px] mx-1 bg-[#E53E3E]"></div>
                                                        <div className="flex flex-col items-center relative group">
                                                            <div className="w-5 h-5 rounded-full flex items-center justify-center border-[2px] z-10 bg-[#E53E3E] border-[#E53E3E]">
                                                                <X size={12} className="text-white" strokeWidth={3} />
                                                            </div>
                                                            <span className="absolute top-6 text-[9px] font-bold text-[#E53E3E] whitespace-nowrap">Cancelled</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex-1 flex items-center relative">
                                                        {[
                                                            { label: 'Accept', value: 'CONFIRMED' },
                                                            { label: 'Preparing', value: 'PREPARING' },
                                                            { label: 'Ready', value: 'READY' }
                                                        ].map((step, stepIdx, arr) => {
                                                            const isCompleted = stepIdx <= currentIndex;
                                                            const isNext = stepIdx === currentIndex + 1;
                                                            const isLast = stepIdx === arr.length - 1;
                                                            return (
                                                                <React.Fragment key={step.value}>
                                                                    <div className="flex flex-col items-center relative group">
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); if (isNext) handleStatusChange(order.id, step.value.toLowerCase()); }}
                                                                            disabled={!isNext}
                                                                            className={`w-5 h-5 rounded-full flex items-center justify-center border-[2px] z-10 transition-colors ${isCompleted ? 'bg-[#16a34a] border-[#16a34a] text-white' : isNext ? 'bg-white border-[#16a34a] cursor-pointer hover:bg-[#16a34a] hover:text-white' : 'bg-white border-[#E2E8F0] cursor-default'}`}
                                                                        >
                                                                            {isCompleted && <Check size={12} className="text-white" strokeWidth={3} />}
                                                                        </button>
                                                                        <span className={`absolute top-6 text-[9px] font-medium whitespace-nowrap ${isCompleted || isNext ? 'text-[#0F172A] dark:text-tk-text' : 'text-[#A0AEC0]'}`}>{step.label}</span>
                                                                    </div>
                                                                    {!isLast && (
                                                                        <div className={`flex-1 h-[2px] mx-1 transition-colors ${stepIdx < currentIndex ? 'bg-[#16a34a]' : 'bg-[#E2E8F0]'}`} />
                                                                    )}
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-center py-2.5 px-4 pb-3 border-t border-solid border-[#F8FAFC] dark:border-tk-border">
                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <span className="text-[12px] font-semibold text-[#334155] bg-[#EEF2F6] py-1 px-2 rounded-md capitalize dark:bg-tk-bg-hover dark:text-tk-text-secondary">{order.paymentMethod}</span>
                                                    <select
                                                        className={`text-[11px] font-bold py-1 pr-5 pl-2 rounded-lg border-none cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%2210%22_height=%2210%22_viewBox=%220_0_24_24%22_fill=%22none%22_stroke=%22currentColor%22_stroke-width=%223%22_stroke-linecap=%22round%22_stroke-linejoin=%22round%22%3E%3Cpath_d=%22m6_9_6_6_6-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_6px_center] outline-none dark:bg-tk-bg-card dark:border-tk-border ${paymentStatusColorClass}`}
                                                        value={order.paymentStatus}
                                                        onChange={(e) => handlePaymentStatusChange(order.id, e.target.value)}
                                                    >
                                                        <option value="Paid">Paid</option>
                                                        <option value="Pending">Pending</option>
                                                        <option value="Failed">Failed</option>
                                                        <option value="Refunded">Refunded</option>
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-base font-bold text-[#0F172A] dark:text-tk-text">₹{order.total.toLocaleString('en-IN')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {visibleCount < filteredOrders.length && (
                            <div ref={loadMoreRef} className="text-center p-6 text-[#475569] text-[13px]">
                                Loading more orders...
                            </div>
                        )}
                    </>
                )}
            </div>
            {activeDetailOrder && (
                <div />
            )}
        </>
    );
};

export default Order;
