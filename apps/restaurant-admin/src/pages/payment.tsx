import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Download, Calendar, CreditCard, CheckCircle, Search, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updatePaymentStatus } from '../services/supabaseService';
import { useNavigate } from 'react-router-dom';

import { usePaymentTransactions, useInvalidateQueries, queryKeys } from '../hooks/useSupabaseQuery';
import { useQueryClient } from '@tanstack/react-query';

// Main Payment Component
const Payment: React.FC = () => {
  const { activeRestaurantId } = useAuth();
  const [selectedDateRange, setSelectedDateRange] = useState<string>('today');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [monthOffset, setMonthOffset] = useState<number>(0);

  const [visibleCount, setVisibleCount] = useState(20);
  const loadMoreRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    setWeekOffset(0);
    setMonthOffset(0);
  }, [selectedDateRange]);

  useEffect(() => {
    setVisibleCount(20);
  }, [selectedDateRange, selectedPaymentMethod, selectedPaymentStatus, customDate, searchQuery, weekOffset, monthOffset]);

  // React Query: cached, auto-retries, refetches on tab focus
  const { data: allTransactions = [], isLoading: loading } = usePaymentTransactions(activeRestaurantId);
  const { invalidatePayments } = useInvalidateQueries();
  const queryClient = useQueryClient();

  const transactions = allTransactions;

  // Filter transactions based on selected filters
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const methodMatch = selectedPaymentMethod === 'all' ||
      (selectedPaymentMethod === 'Online'
        ? transaction.paymentMethod.toLowerCase() !== 'cash'
        : transaction.paymentMethod.toLowerCase() === selectedPaymentMethod.toLowerCase());
    const statusMatch = selectedPaymentStatus === 'all' || transaction.paymentStatus === selectedPaymentStatus;

    // Date range filtering
    const tDate = new Date(transaction.createdAt);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

    let dateMatch = true;
    if (selectedDateRange === 'today') {
      dateMatch = tDate >= startOfToday;
    } else if (selectedDateRange === 'yesterday') {
      dateMatch = tDate >= startOfYesterday && tDate < startOfToday;
    } else if (selectedDateRange === 'week') {
      const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const startOfWeekN = new Date(startOfThisWeek);
      startOfWeekN.setDate(startOfWeekN.getDate() - weekOffset * 7);
      const endOfWeekN = new Date(startOfWeekN);
      endOfWeekN.setDate(endOfWeekN.getDate() + 7);
      dateMatch = tDate >= startOfWeekN && tDate < endOfWeekN;
    } else if (selectedDateRange === 'month') {
      const startOfMonthN = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
      const endOfMonthN = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 1);
      dateMatch = tDate >= startOfMonthN && tDate < endOfMonthN;
    } else if (selectedDateRange === 'all') {
      dateMatch = true;
    } else if (selectedDateRange === 'custom' && customDate) {
      const selectedDay = new Date(customDate).toDateString();
      dateMatch = tDate.toDateString() === selectedDay;
    }

    return matchesSearch && methodMatch && statusMatch && dateMatch;
  });

  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleCount < filteredTransactions.length) {
        setVisibleCount(prev => prev + 20);
      }
    }, { rootMargin: '200px' });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [visibleCount, filteredTransactions.length]);

  const filteredRevenue = useMemo(() => {
    let totalRevenue = 0;
    let totalOrders = 0;

    filteredTransactions.forEach(t => {
      totalOrders++;
      if (t.paymentStatus.toLowerCase() === 'paid') {
        totalRevenue += t.amount;
      }
    });

    return { totalRevenue, totalOrders };
  }, [filteredTransactions]);

  const handleExportReport = () => {
    if (filteredTransactions.length === 0) {
      alert("No transactions to export for the selected filters.");
      return;
    }

    const headers = ["Order ID", "Date", "Customer", "Amount", "Method", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map(t => [
        t.orderNumber,
        new Date(t.createdAt).toLocaleString().replace(/,/g, ''),
        `"${(t.customerName || 'Walk-in').replace(/"/g, '""')}"`,
        t.amount,
        t.paymentMethod,
        t.paymentStatus
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payment_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (id: string) => {
    navigate(`/payments/${id}`);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!activeRestaurantId) return;

    const qKey = queryKeys.payments(activeRestaurantId);
    const previousPayments = queryClient.getQueryData<any[]>(qKey);

    // 1. Optimistically update the cache
    queryClient.setQueryData(qKey, (old: any[] | undefined) => {
      if (!old) return [];
      return old.map(transaction => {
        if (transaction.id === id) {
          return {
            ...transaction,
            paymentStatus: newStatus.charAt(0).toUpperCase() + newStatus.slice(1),
            statusColor: newStatus.toLowerCase()
          };
        }
        return transaction;
      });
    });

    try {
      await updatePaymentStatus(id, newStatus);
      // Optional: refetch in background to ensure sync
      invalidatePayments(activeRestaurantId);
    } catch (err) {
      console.error('Failed to update status', err);
      // 2. Rollback if failed
      if (previousPayments) {
        queryClient.setQueryData(qKey, previousPayments);
      }
      alert('Failed to update status');
    }
  };



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


  return (
    <div className="animate-[fadeIn_0.3s_ease-in-out]">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#111] dark:text-tk-text m-0 tracking-tight leading-tight">Payments & Billing</h1>
            <p className="text-[14px] font-medium text-tk-text-secondary mt-1">Manage and track your transactions</p>
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#111] dark:bg-white text-white dark:text-[#111] rounded-xl text-[14px] font-bold cursor-pointer transition-all duration-300 hover:bg-[#333] dark:hover:bg-[#f5f5f5] shadow-sm hover:shadow" onClick={handleExportReport}>
            <Download size={16} />
            <span>Export Report</span>
          </button>
        </div>

        {/* Revenue Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[450px] w-full pt-1 mb-6 mt-4 sm:mt-0">
          <div className="bg-tk-bg-card p-3 sm:p-3 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-[11px] sm:text-xs text-tk-text-secondary font-medium">Total Revenue</h3>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-tk-burgundy-bg flex items-center justify-center text-tk-burgundy">
                <CreditCard size={14} />
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div className="text-[16px] sm:text-[20px] font-bold text-tk-text">₹{loading ? '...' : filteredRevenue.totalRevenue.toLocaleString()}</div>
            </div>
          </div>
          
          <div className="bg-tk-bg-card p-3 sm:p-3 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-[11px] sm:text-xs text-tk-text-secondary font-medium">Total Orders</h3>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-tk-burgundy-bg flex items-center justify-center text-tk-burgundy">
                <CheckCircle size={14} />
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div className="text-[16px] sm:text-[20px] font-bold text-tk-text">{loading ? '...' : filteredRevenue.totalOrders.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Tabs & Controls - Exactly matching Order Page */}
        <div className="sticky top-0 z-30 py-2 bg-tk-bg-card shadow-sm border-b border-tk-border flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto flex-1 pb-1 pl-12 md:pl-0">
            {/* Date Filter */}
            <div className="flex items-center gap-2 bg-tk-bg-surface px-3 py-1.5 rounded-full border border-tk-border shadow-sm">
              <Calendar size={14} className="text-tk-text-secondary" />
              <select
                className="border-none outline-none text-[13px] font-bold text-tk-text bg-transparent cursor-pointer py-1"
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
                <option value="custom">Custom</option>
              </select>
              {selectedDateRange === 'custom' && (
                <input
                  type="date"
                  className="border-l border-tk-border pl-2 ml-2 text-[13px] font-bold bg-transparent outline-none text-tk-text"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                />
              )}
            </div>

            {selectedDateRange === 'week' && (
              <div className="flex items-center gap-2 bg-tk-bg-surface px-2 py-1.5 rounded-full border border-tk-border shadow-sm">
                <button
                  type="button"
                  className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-tk-bg-hover text-tk-text-secondary transition-all disabled:opacity-40"
                  onClick={() => setWeekOffset(prev => prev + 1)}
                  title="Previous Week"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[12px] font-bold text-tk-text min-w-[120px] text-center select-none">{getWeekDateRange(weekOffset)}</span>
                <button
                  type="button"
                  className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-tk-bg-hover text-tk-text-secondary transition-all disabled:opacity-40"
                  onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
                  disabled={weekOffset === 0}
                  title="Next Week"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}

            {selectedDateRange === 'month' && (
              <div className="flex items-center gap-2 bg-tk-bg-surface px-2 py-1.5 rounded-full border border-tk-border shadow-sm">
                <button
                  type="button"
                  className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-tk-bg-hover text-tk-text-secondary transition-all disabled:opacity-40"
                  onClick={() => setMonthOffset(prev => prev + 1)}
                  title="Previous Month"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[12px] font-bold text-tk-text min-w-[120px] text-center select-none">{getMonthLabel(monthOffset)}</span>
                <button
                  type="button"
                  className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-tk-bg-hover text-tk-text-secondary transition-all disabled:opacity-40"
                  onClick={() => setMonthOffset(prev => Math.max(0, prev - 1))}
                  disabled={monthOffset === 0}
                  title="Next Month"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}

            {/* Method Filter */}
            <div className="flex items-center gap-2 bg-tk-bg-surface px-3 py-1.5 rounded-full border border-tk-border shadow-sm">
              <CreditCard size={14} className="text-tk-text-secondary" />
              <select
                className="border-none outline-none text-[13px] font-bold text-tk-text bg-transparent cursor-pointer py-1"
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              >
                <option value="all">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 bg-tk-bg-surface px-3 py-1.5 rounded-full border border-tk-border shadow-sm">
              <CheckCircle size={14} className="text-tk-text-secondary" />
              <select
                className="border-none outline-none text-[13px] font-bold text-tk-text bg-transparent cursor-pointer py-1"
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pb-2 w-full xl:w-auto xl:ml-4">
            <div className="flex bg-tk-bg-surface border border-tk-border rounded-full p-0.5 shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 sm:p-1.5 rounded-full transition-colors flex items-center justify-center ${viewMode === 'table' ? 'bg-tk-burgundy/10 text-tk-burgundy' : 'text-tk-text-secondary hover:text-tk-text'}`}
                title="Table View"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 sm:p-1.5 rounded-full transition-colors flex items-center justify-center ${viewMode === 'grid' ? 'bg-tk-burgundy/10 text-tk-burgundy' : 'text-tk-text-secondary hover:text-tk-text'}`}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
            </div>

            <div className="relative w-full sm:w-[240px] shrink-0">
              <Search className="absolute left-3 top-[calc(50%)] -translate-y-1/2 text-tk-text-secondary" size={14} />
              <input
                type="text"
                placeholder="Search by Order ID or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[36px] sm:h-[32px] pl-9 pr-8 bg-tk-bg-surface border border-tk-border rounded-full text-tk-text text-[14px] sm:text-[13px] focus:outline-none focus:border-tk-burgundy transition-colors"
              />
            </div>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
            {loading ? (
              <div className="col-span-full py-12 text-center text-tk-text-secondary font-medium">Loading transactions...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="col-span-full py-12 text-center text-tk-text-secondary font-medium">No transactions found matching the selected filters</div>
            ) : (
              filteredTransactions.slice(0, visibleCount).map((transaction) => (
                <div key={transaction.id} onClick={() => handleView(transaction.id)} className="bg-tk-bg-card rounded-[16px] shadow-sm border border-tk-border p-4 flex flex-col gap-4 cursor-pointer transition-all duration-300 hover:shadow-md hover:border-tk-burgundy/30">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[14px] text-tk-text">{transaction.orderNumber}</span>
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold ${transaction.statusColor === 'paid' ? 'bg-[#F0FFF4] text-[#38A169]' : transaction.statusColor === 'pending' ? 'bg-[#FFFFF0] text-[#D69E2E]' : transaction.statusColor === 'failed' ? 'bg-[#FFF5F5] text-[#E53E3E]' : 'bg-[#FAF5FF] text-[#805AD5]'}`}>
                      {transaction.paymentStatus}
                    </span>
                  </div>
                  <div>
                    <div className="text-[24px] font-extrabold text-[#111] dark:text-tk-text tracking-tight mb-1">₹{transaction.amount.toLocaleString()}</div>
                    <div className="text-[13px] font-medium text-tk-text-secondary">{transaction.customerName}</div>
                  </div>
                  <div className="flex justify-between items-center text-[12px] font-medium text-tk-text-secondary border-t border-tk-border pt-3 mt-1">
                    <span>{transaction.dateTime}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${transaction.paymentMethod.toLowerCase() === 'cash' ? 'bg-[#FFF0E6] text-[#E55A28]' : 'bg-[#EBF8FF] text-[#2B6CB0]'}`}>
                      {transaction.paymentMethod}
                    </span>
                  </div>
                </div>
              ))
            )}
            {visibleCount < filteredTransactions.length && (
              <div ref={loadMoreRef} className="col-span-full py-6 text-center text-tk-text-secondary text-[12px] font-medium">
                Loading more transactions...
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-tk-bg-card rounded-[24px] shadow-sm border border-tk-border overflow-hidden relative">
            <div className="w-full pb-8">
              <div className="overflow-x-auto tk-table-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
                  <thead>
                    <tr>
                      <th className="sticky top-0 z-40 bg-tk-bg-card py-3 px-4 shadow-[inset_0_-2px_0_0_var(--tk-border)] text-[13px] font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border w-[15%] shadow-sm">
                        Order ID
                      </th>
                      <th className="sticky top-0 z-40 bg-tk-bg-card py-3 px-4 shadow-[inset_0_-2px_0_0_var(--tk-border)] text-[13px] font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border w-[20%] shadow-sm">
                        Customer Name
                      </th>
                      <th className="sticky top-0 z-40 bg-tk-bg-card py-3 px-4 shadow-[inset_0_-2px_0_0_var(--tk-border)] text-[13px] font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border w-[20%] shadow-sm">
                        Date & Time
                      </th>
                      <th className="sticky top-0 z-40 bg-tk-bg-card py-3 px-4 shadow-[inset_0_-2px_0_0_var(--tk-border)] text-[13px] font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border w-[15%] shadow-sm">
                        Method
                      </th>
                      <th className="sticky top-0 z-40 bg-tk-bg-card py-3 px-4 shadow-[inset_0_-2px_0_0_var(--tk-border)] text-[13px] font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border w-[15%] shadow-sm">
                        Status
                      </th>
                      <th className="sticky top-0 z-40 bg-tk-bg-card py-3 px-4 shadow-[inset_0_-2px_0_0_var(--tk-border)] text-[13px] font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border w-[15%] shadow-sm text-right">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-tk-text-secondary text-sm">
                          Loading transactions...
                        </td>
                      </tr>
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-tk-text-secondary text-sm">
                          No transactions found matching the selected filters
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.slice(0, visibleCount).map((transaction) => (
                        <tr key={transaction.id} onClick={() => handleView(transaction.id)} className="border-b border-tk-border last:border-b-0 hover:bg-tk-burgundy/5 transition-colors group bg-tk-bg-card cursor-pointer">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[14px] text-tk-text flex items-center gap-2">
                              {transaction.orderNumber}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-[14px] text-tk-text">
                              {transaction.customerName}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-[13px] text-tk-text-secondary font-medium">
                              {transaction.dateTime}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold ${transaction.paymentMethod.toLowerCase() === 'cash' ? 'bg-[#FFF0E6] text-[#E55A28]' : 'bg-[#EBF8FF] text-[#2B6CB0]'}`}>
                              {transaction.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                            <div className="relative flex items-center inline-block">
                              <select
                                className={`appearance-none outline-none border border-tk-border px-3 py-1.5 pr-7 rounded-xl text-[12px] font-bold cursor-pointer hover:shadow-sm transition-all shadow-sm ${transaction.statusColor === 'paid' ? 'bg-[#F0FFF4] text-[#38A169] hover:border-[#38A169]/30' : transaction.statusColor === 'pending' ? 'bg-[#FFFFF0] text-[#D69E2E] hover:border-[#D69E2E]/30' : transaction.statusColor === 'failed' ? 'bg-[#FFF5F5] text-[#E53E3E] hover:border-[#E53E3E]/30' : 'bg-[#FAF5FF] text-[#805AD5] hover:border-[#805AD5]/30'}`}
                                value={transaction.paymentStatus}
                                onChange={(e) => handleStatusChange(transaction.id, e.target.value)}
                              >
                                <option value="Paid">Paid</option>
                                <option value="Pending">Pending</option>
                                <option value="Failed">Failed</option>
                                <option value="Refunded">Refunded</option>
                              </select>
                              <div className="absolute right-2 pointer-events-none text-tk-text-secondary opacity-70">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="font-extrabold text-[16px] text-[#111] dark:text-tk-text tracking-tight">
                              ₹{transaction.amount.toLocaleString()}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                    {visibleCount < filteredTransactions.length && (
                      <tr ref={loadMoreRef}>
                        <td colSpan={6} className="text-center p-6 text-tk-text-secondary text-[12px] font-medium">
                          Loading more transactions...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Payment;