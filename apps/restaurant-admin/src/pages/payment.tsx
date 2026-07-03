import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Download, Calendar, CreditCard, CheckCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
    console.log('Exporting report...');
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
    <>
        <div className="flex justify-between items-center mb-8 max-md:flex-col max-md:items-start max-md:gap-4 max-md:mt-4">
          <h1 className="text-2xl font-semibold text-[#1A202C] m-0 max-md:ml-16">Payments & Billing</h1>
          <div className="flex items-center gap-4 max-md:w-full">
            <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(0,0,0,0.02)] w-[280px] max-md:w-full">
              <Search size={18} color="#718096" />
              <input
                type="text"
                placeholder="Search by Order ID or Name..."
                className="border-none outline-none text-sm text-[#1A202C] bg-transparent w-full placeholder:text-[#718096]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mb-4 mt-6">
          <h2 className="text-base font-semibold text-[#1A202C] m-0">Revenue Overview</h2>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8 max-xl:grid-cols-1">
          <div className="bg-white p-6 rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(0,0,0,0.02)] relative overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#8B3A1E] to-[#D4816B]"></div>
            <h3 className="text-sm text-[#4A5568] mb-3 font-medium mt-1">Total Revenue</h3>
            <div className="text-4xl font-bold text-[#1A202C] mb-3">₹ {loading ? '...' : filteredRevenue.totalRevenue.toLocaleString()}</div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(0,0,0,0.02)] relative overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#5C7A7A] to-[#8AABAB]"></div>
            <h3 className="text-sm text-[#4A5568] mb-3 font-medium mt-1">Total Orders</h3>
            <div className="text-4xl font-bold text-[#1A202C] mb-3">{loading ? '...' : filteredRevenue.totalOrders.toLocaleString()}</div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-8 gap-4 flex-wrap max-xl:flex-col max-xl:items-stretch">
          <div className="flex gap-3 flex-wrap max-xl:w-full max-md:flex-col">
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] max-xl:flex-1 max-xl:min-w-[150px] max-md:w-full">
              <Calendar size={16} color="#718096" />
              <select
                className="border-none outline-none text-sm font-medium text-[#1A202C] bg-transparent cursor-pointer min-w-[120px] max-md:w-full"
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
              >
                <option value="today" className="p-2">Today</option>
                <option value="yesterday" className="p-2">Yesterday</option>
                <option value="week" className="p-2">Week</option>
                <option value="month" className="p-2">Month</option>
                <option value="all" className="p-2">All</option>
                <option value="custom" className="p-2">Custom Range</option>
              </select>
              {selectedDateRange === 'custom' && (
                <input
                  type="date"
                  className="border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-sm text-[#1A202C] outline-none ml-2 bg-[#F7FAFC] transition-all duration-200 focus:border-tk-burgundy focus:shadow-[0_0_0_2px_rgba(79,117,92,0.1)]"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                />
              )}
            </div>

            {selectedDateRange === 'week' && (
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 border border-[#E2E8F0] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                <button
                  type="button"
                  className="flex items-center justify-center w-7 h-7 rounded-md border border-[#E2E8F0] bg-[#F7FAFC] text-[#4A5568] cursor-pointer transition-all duration-200 p-0 hover:not-disabled:bg-[#EDF2F7] hover:not-disabled:text-[#1A202C] hover:not-disabled:border-[#CBD5E0] disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => setWeekOffset(prev => prev + 1)}
                  title="Previous Week"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-semibold text-[#2D3748] min-w-[140px] text-center select-none">{getWeekDateRange(weekOffset)}</span>
                <button
                  type="button"
                  className="flex items-center justify-center w-7 h-7 rounded-md border border-[#E2E8F0] bg-[#F7FAFC] text-[#4A5568] cursor-pointer transition-all duration-200 p-0 hover:not-disabled:bg-[#EDF2F7] hover:not-disabled:text-[#1A202C] hover:not-disabled:border-[#CBD5E0] disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
                  disabled={weekOffset === 0}
                  title="Next Week"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {selectedDateRange === 'month' && (
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 border border-[#E2E8F0] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                <button
                  type="button"
                  className="flex items-center justify-center w-7 h-7 rounded-md border border-[#E2E8F0] bg-[#F7FAFC] text-[#4A5568] cursor-pointer transition-all duration-200 p-0 hover:not-disabled:bg-[#EDF2F7] hover:not-disabled:text-[#1A202C] hover:not-disabled:border-[#CBD5E0] disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => setMonthOffset(prev => prev + 1)}
                  title="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-semibold text-[#2D3748] min-w-[140px] text-center select-none">{getMonthLabel(monthOffset)}</span>
                <button
                  type="button"
                  className="flex items-center justify-center w-7 h-7 rounded-md border border-[#E2E8F0] bg-[#F7FAFC] text-[#4A5568] cursor-pointer transition-all duration-200 p-0 hover:not-disabled:bg-[#EDF2F7] hover:not-disabled:text-[#1A202C] hover:not-disabled:border-[#CBD5E0] disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => setMonthOffset(prev => Math.max(0, prev - 1))}
                  disabled={monthOffset === 0}
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] max-xl:flex-1 max-xl:min-w-[150px] max-md:w-full">
              <CreditCard size={16} color="#718096" />
              <select
                className="border-none outline-none text-sm font-medium text-[#1A202C] bg-transparent cursor-pointer min-w-[120px] max-md:w-full"
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              >
                <option value="all" className="p-2">All Methods</option>
                <option value="Cash" className="p-2">Cash</option>
                <option value="Online" className="p-2">Online</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] max-xl:flex-1 max-xl:min-w-[150px] max-md:w-full">
              <CheckCircle size={16} color="#718096" />
              <select
                className="border-none outline-none text-sm font-medium text-[#1A202C] bg-transparent cursor-pointer min-w-[120px] max-md:w-full"
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              >
                <option value="all" className="p-2">All Status</option>
                <option value="Paid" className="p-2">Paid</option>
                <option value="Pending" className="p-2">Pending</option>
                <option value="Failed" className="p-2">Failed</option>
                <option value="Refunded" className="p-2">Refunded</option>
              </select>
            </div>
          </div>

          <button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-tk-burgundy text-white border-none rounded-xl text-sm font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_12px_rgba(139,58,30,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(139,58,30,0.4)] hover:bg-[#6B2A15] max-xl:w-full" onClick={handleExportReport}>
            <Download size={16} />
            <span>Export Report</span>
          </button>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(0,0,0,0.02)] max-md:overflow-visible">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-[#1A202C] m-0">Payments Table</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 max-md:block max-md:min-w-full">
              <thead className="max-md:hidden">
                <tr className="border-b-2 border-[#E2E8F0]">
                  <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#4A5568] border-b-2 border-[#E2E8F0] whitespace-nowrap">Order ID</th>
                  <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#4A5568] border-b-2 border-[#E2E8F0] whitespace-nowrap">Customer Name</th>
                  <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#4A5568] border-b-2 border-[#E2E8F0] whitespace-nowrap">Date & Time</th>
                  <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#4A5568] border-b-2 border-[#E2E8F0] whitespace-nowrap">Payment Method</th>
                  <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#4A5568] border-b-2 border-[#E2E8F0] whitespace-nowrap">Payment Status</th>
                  <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#4A5568] border-b-2 border-[#E2E8F0] whitespace-nowrap">Amount</th>
                </tr>
              </thead>
              <tbody className="max-md:block max-md:w-full">
                {loading ? (
                  <tr className="max-md:block max-md:w-full">
                    <td colSpan={6} className="text-center p-8 text-[#718096] max-md:block max-md:w-full">
                      Loading transactions...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr className="max-md:block max-md:w-full">
                    <td colSpan={6} className="text-center p-8 text-[#718096] max-md:block max-md:w-full">
                      No transactions found matching the selected filters
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.slice(0, visibleCount).map((transaction) => (
                    <tr key={transaction.id} onClick={() => handleView(transaction.id)} className="transition-colors duration-200 hover:bg-[#F7FAFC] cursor-pointer max-md:block max-md:w-full">
                      <td data-label="Order ID" className="p-4 text-sm text-[#1A202C] max-md:block max-md:w-full">
                        <div className="font-semibold text-[#1A202C] text-sm">{transaction.orderNumber}</div>
                      </td>
                      <td data-label="Customer Name" className="p-4 text-sm text-[#1A202C] max-md:block max-md:w-full">
                        <div className="text-[#1A202C] text-sm font-medium">{transaction.customerName}</div>
                      </td>
                      <td data-label="Date & Time" className="p-4 text-sm text-[#1A202C] max-md:block max-md:w-full">
                        <div className="text-[#1A202C] text-[13px]">{transaction.dateTime}</div>
                      </td>
                      <td data-label="Payment Method" className="p-4 text-sm text-[#1A202C] max-md:block max-md:w-full">
                        <span className={`inline-block px-3.5 py-1.5 rounded-xl text-xs font-semibold ${transaction.paymentMethod.toLowerCase() === 'cash' ? 'bg-[#FED7D7] text-[#742A2A]' : 'bg-[#EBF8FF] text-[#2B6CB0]'}`}>
                          {transaction.paymentMethod}
                        </span>
                      </td>
                      <td data-label="Payment Status" onClick={(e) => e.stopPropagation()} className="p-4 text-sm text-[#1A202C] max-md:block max-md:w-full">
                        <select
                          className={`inline-block px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer outline-none ${transaction.statusColor === 'paid' ? 'bg-[#C6F6D5] text-[#22543D]' : transaction.statusColor === 'pending' ? 'bg-[#FEEA9A] text-[#744210]' : transaction.statusColor === 'failed' ? 'bg-[#FED7D7] text-[#742A2A]' : 'bg-[#E9D8FD] text-[#553C9A]'}`}
                          value={transaction.paymentStatus}
                          onChange={(e) => handleStatusChange(transaction.id, e.target.value)}
                          title="Change payment status"
                        >
                          <option value="Paid">Paid</option>
                          <option value="Pending">Pending</option>
                          <option value="Failed">Failed</option>
                          <option value="Refunded">Refunded</option>
                        </select>
                      </td>
                      <td data-label="Amount" className="p-4 text-sm text-[#1A202C] max-md:block max-md:w-full">
                        <div className="font-bold text-tk-burgundy text-[15px]">₹{transaction.amount.toLocaleString()}</div>
                      </td>
                    </tr>
                  ))
                )}
                {visibleCount < filteredTransactions.length && (
                  <tr ref={loadMoreRef} className="max-md:block max-md:w-full">
                    <td colSpan={6} className="text-center p-6 text-[#4A5568] text-[13px] max-md:block max-md:w-full">
                      Loading more transactions...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
    </>
  );
};

export default Payment;