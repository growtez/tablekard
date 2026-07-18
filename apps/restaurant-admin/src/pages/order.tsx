import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TrendingUp, X, CheckCircle, Package, Check, ChevronDown, Search, ArrowUpDown, List, LayoutGrid, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useDashboardOrders, useInvalidateQueries, useRevenueData } from '../hooks/useSupabaseQuery';
import { updateOrderStatus, updatePaymentStatus } from '../services/supabaseService';
import type { DashboardOrder } from '../services/supabaseService';


interface OrderDetailsDialogProps {
  order: DashboardOrder | null;
  onClose: () => void;
  onUpdateStatus?: (orderId: string, status: string) => void;
  onCancel?: (order: DashboardOrder) => void;
  onMarkPaid?: (orderId: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({ 
  order, 
  onClose, 
  onUpdateStatus, 
  onCancel,
  onMarkPaid,
  onPrev,
  onNext,
  hasPrev,
  hasNext
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4 animate-[fadeIn_0.2s_ease]" onClick={onClose}>
      <div className="bg-tk-bg-card rounded-2xl p-4 sm:p-5 max-w-[420px] w-full max-h-[85vh] overflow-auto border-[1.5px] border-tk-border shadow-[0_20px_60px_rgba(0,0,0,0.12)] animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center pb-3 border-b border-tk-border mb-4">
          <h2 className="text-base font-normal text-tk-text">{order.orderNumber}</h2>
          <div className="flex items-center gap-1">
            {onPrev && (
              <button 
                disabled={!hasPrev}
                onClick={onPrev}
                className="bg-transparent border-none cursor-pointer p-1.5 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-tk-bg-hover disabled:opacity-30 disabled:hover:bg-transparent"
                title="Previous Order"
              >
                <ChevronLeft size={20} color="#718096" />
              </button>
            )}
            {onNext && (
              <button 
                disabled={!hasNext}
                onClick={onNext}
                className="bg-transparent border-none cursor-pointer p-1.5 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-tk-bg-hover disabled:opacity-30 disabled:hover:bg-transparent"
                title="Next Order"
              >
                <ChevronRight size={20} color="#718096" />
              </button>
            )}
            <button className="bg-transparent border-none cursor-pointer p-1.5 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-tk-bg-hover" onClick={onClose}>
              <X size={20} color="#718096" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[11px] text-tk-text-secondary mb-0.5">Table</div>
              <div className="text-sm font-semibold text-tk-text truncate">{order.table}</div>
            </div>
            <div>
              <div className="text-[11px] text-tk-text-secondary mb-0.5">Time</div>
              <div className="text-sm font-semibold text-tk-text whitespace-nowrap">{order.time}</div>
            </div>
            <div>
              <div className="text-[11px] text-tk-text-secondary mb-0.5">Customer</div>
              <div className="text-sm font-semibold text-tk-text truncate">{order.customer?.split(' ')[0] || ''}</div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="text-xs text-tk-text-secondary mb-1.5">Items Ordered</div>
            <div className="flex flex-col gap-2">
              {order.rawItems && order.rawItems.map((item, idx) => (
                <div key={idx} className="flex justify-between p-2 bg-tk-bg-hover rounded-xl">
                  <div>
                    <div className="text-xs font-semibold text-tk-text">{item.name}</div>
                    <div className="text-[10px] text-tk-text-secondary">Qty: {item.quantity}</div>
                  </div>
                  <div className="text-xs font-semibold text-tk-text">₹{item.price || 0}</div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-2 border-t border-tk-border mt-1.5">
                <span className="text-xs font-semibold text-tk-text">Total</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-tk-burgundy">₹{order.total}</span>
                  <div className="flex items-center gap-1">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold whitespace-nowrap ${order.isPaid ? 'bg-[#C6F6D5] text-[#22543D]' : 'bg-[#FEF2F2] text-[#E53E3E]'}`}>
                      {order.isPaid ? `Paid` : 'Pending'}
                    </span>
                    {!order.isPaid && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onMarkPaid && onMarkPaid(order.id); }}
                        className="p-0.5 bg-[#C6F6D5] text-[#22543D] rounded hover:bg-[#9AE6B4] transition-colors flex items-center justify-center shrink-0"
                        title="Mark Paid"
                      >
                        <CheckCircle size={10} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking Progress Bar */}
          <div className="py-2 border-t border-b border-tk-border border-dashed my-1">
            <div className="text-[11px] text-tk-text-secondary mb-3">Order Status Tracking</div>
            <div className="flex items-center justify-between w-full px-2">
              {order.status?.toUpperCase() === 'CANCELLED' ? (
                <div className="flex-1 flex items-center relative">
                  <div className="flex flex-col items-center relative group">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center border-[2px] z-10 bg-[#E53E3E] border-[#E53E3E]">
                      <Check size={12} className="text-white" strokeWidth={3} />
                    </div>
                    <span className="absolute top-6 text-[9px] font-medium text-[#E53E3E] whitespace-nowrap">Placed</span>
                  </div>
                  <div className="flex-1 h-[2px] mx-1 transition-colors bg-[#E53E3E]"></div>
                  <div className="flex flex-col items-center relative group">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center border-[2px] z-10 bg-[#E53E3E] border-[#E53E3E]">
                      <X size={12} className="text-white" strokeWidth={3} />
                    </div>
                    <span className="absolute top-6 text-[9px] font-bold text-[#E53E3E] whitespace-nowrap">Cancelled</span>
                  </div>
                </div>
              ) : (
                <>
                  {[
                    { label: 'Accept', value: 'CONFIRMED' },
                    { label: 'Preparing', value: 'PREPARING' },
                    { label: 'Ready', value: 'READY' }
                  ].map((step, stepIdx, arr) => {
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
                    const isCompleted = stepIdx <= currentIndex;
                    const isNext = stepIdx === currentIndex + 1;
                    const isLast = stepIdx === arr.length - 1;

                    return (
                      <React.Fragment key={step.value}>
                        <div className="flex flex-col items-center relative group">
                          <button
                            onClick={() => {
                              if (isNext && onUpdateStatus) onUpdateStatus(order.id, step.value);
                            }}
                            disabled={!isNext || !onUpdateStatus}
                            className={`w-5 h-5 rounded-full flex items-center justify-center border-[2px] z-10 transition-all duration-300 relative group/btn
                            ${isCompleted ? 'bg-[#16a34a] border-[#16a34a] text-white' :
                                isNext && onUpdateStatus ? 'bg-white border-[#16a34a] cursor-pointer hover:bg-[#16a34a] hover:text-white hover:scale-110 active:scale-95' :
                                  'bg-white border-[#E2E8F0] cursor-default'}
                          `}
                          >
                            {isNext && onUpdateStatus && (
                              <span className="absolute inset-0 rounded-full border border-dashed border-[#16a34a]/60 animate-[spin_6s_linear_infinite]" style={{ margin: '-4px' }} />
                            )}
                            {isNext && onUpdateStatus && (
                              <span className="absolute inset-0 rounded-full bg-[#16a34a]/10 animate-ping" style={{ margin: '-1px' }} />
                            )}
                            {(isCompleted || (isNext && onUpdateStatus)) && (
                              <Check size={12} className={`text-white transition-all duration-300 ${isCompleted ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover/btn:opacity-100 group-hover/btn:scale-100'}`} strokeWidth={3} />
                            )}
                          </button>
                          <span className={`absolute top-6 text-[9px] font-medium whitespace-nowrap
                          ${isCompleted || (isNext && onUpdateStatus) ? 'text-tk-text' : 'text-[#A0AEC0]'}
                        `}>
                            {step.label}
                          </span>
                        </div>
                        {!isLast && (
                          <div className={`flex-1 h-[2px] mx-1 transition-colors
                          ${stepIdx < currentIndex ? 'bg-[#16a34a]' : 'bg-[#E2E8F0]'}
                        `} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </>
              )}
            </div>
            {/* Spacer for absolute top-6 labels */}
            <div className="h-6"></div>
          </div>

          <div className="flex justify-start items-center mt-1">
            {onCancel && order.status?.toUpperCase() !== 'CANCELLED' && order.status?.toUpperCase() !== 'COMPLETED' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(order);
                }}
                className="px-2.5 py-1 bg-[#FEF2F2] text-[#E53E3E] border border-[#FC8181] rounded text-[11px] font-semibold hover:bg-[#FED7D7] transition-colors cursor-pointer"
              >
                Cancel Order
              </button>
            )}
            {order.status?.toUpperCase() === 'CANCELLED' && (
              <span className="px-2.5 py-1 bg-[#FEF2F2] text-[#E53E3E] rounded text-[11px] font-bold">
                Cancelled
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Order: React.FC = () => {
  const { activeRestaurantId } = useAuth();

  const { data: orders = [], isLoading } = useDashboardOrders(activeRestaurantId);
  useRevenueData(activeRestaurantId);
  const { invalidateOrders } = useInvalidateQueries();

  const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<DashboardOrder | null>(null);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>(location.state?.activeTab || 'All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [monthOffset, setMonthOffset] = useState<number>(0);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWeekOffset(0);
    setMonthOffset(0);
  }, [selectedDateRange]);

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

  const getMonthLabel = (offset: number) => {
    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return targetMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_high' | 'amount_low'>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setIsDateDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePaymentComplete = async (paymentId: string) => {
    try {
      await updatePaymentStatus(paymentId, 'paid');
      if (activeRestaurantId) invalidateOrders(activeRestaurantId);
    } catch (err) {
      console.error(err);
      alert('Failed to update payment status');
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, status: string) => {
    try {
      await updatePaymentStatus(orderId, status);
      if (activeRestaurantId) invalidateOrders(activeRestaurantId);
    } catch (err) {
      console.error(err);
      alert('Failed to update payment status');
    }
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      await updateOrderStatus(orderId, nextStatus as any);
      if (activeRestaurantId) invalidateOrders(activeRestaurantId);
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const dateFilteredOrders = useMemo(() => {
    return orders.filter(order => {
      const tDate = new Date(order.createdAt);
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
    });
  }, [orders, selectedDateRange, weekOffset, monthOffset, customDate]);

  const activeOrders = dateFilteredOrders.filter(order => {
    const s = order.status?.toUpperCase();
    return s !== 'COMPLETED' && s !== 'CANCELLED' && (s !== 'READY' || !order.isPaid);
  });
  const completedOrders = dateFilteredOrders.filter(order => {
    const s = order.status?.toUpperCase();
    return s === 'COMPLETED' || (s === 'READY' && order.isPaid);
  });
  const cancelledOrders = dateFilteredOrders.filter(order => order.status?.toUpperCase() === 'CANCELLED');

  const now = new Date();
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const startOfLastWeek = new Date(startOfThisWeek.getTime() - 7 * 86400000);

  let ordersToday = 0;
  let ordersYesterday = 0;
  let ordersThisWeek = 0;
  let ordersLastWeek = 0;

  orders.forEach(order => {
    const orderDate = new Date(order.createdAt);
    if (isSameDay(orderDate, now)) {
      ordersToday++;
    } else if (isSameDay(orderDate, yesterday)) {
      ordersYesterday++;
    }
    if (orderDate >= startOfThisWeek) {
      ordersThisWeek++;
    } else if (orderDate >= startOfLastWeek && orderDate < startOfThisWeek) {
      ordersLastWeek++;
    }
  });

  const todayChange = ordersYesterday === 0 ? (ordersToday > 0 ? 100 : 0) : Math.round(((ordersToday - ordersYesterday) / ordersYesterday) * 100);
  const weekChange = ordersLastWeek === 0 ? (ordersThisWeek > 0 ? 100 : 0) : Math.round(((ordersThisWeek - ordersLastWeek) / ordersLastWeek) * 100);

  const tabs = ['All', 'Completed', 'Active', 'Cancelled'];

  const tabCounts: Record<string, number> = {
    'All': dateFilteredOrders.length,
    'Active': activeOrders.length,
    'Completed': completedOrders.length,
    'Cancelled': cancelledOrders.length,
  };

  const filteredOrders = () => {
    let result = dateFilteredOrders;
    switch (activeTab) {
      case 'Active': result = activeOrders; break;
      case 'Completed': result = completedOrders; break;
      case 'Cancelled': result = cancelledOrders; break;
      case 'All': default: result = dateFilteredOrders; break;
    }

    if (searchTerm) {
      const lowerQuery = searchTerm.toLowerCase();
      result = result.filter(order => {
        const paymentStatusText = order.isPaid ? 'paid' : 'pending';
        return (
          (order.orderNumber && order.orderNumber.toLowerCase().includes(lowerQuery)) ||
          (order.customer && order.customer.toLowerCase().includes(lowerQuery)) ||
          (order.table && order.table.toLowerCase().includes(lowerQuery)) ||
          (order.paymentMethod && order.paymentMethod.toLowerCase().includes(lowerQuery)) ||
          (order.total && order.total.toString().includes(lowerQuery)) ||
          paymentStatusText.includes(lowerQuery)
        );
      });
    }

    result = result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      if (sortBy === 'newest') return dateB - dateA;
      if (sortBy === 'oldest') return dateA - dateB;
      if (sortBy === 'amount_high') return b.total - a.total;
      if (sortBy === 'amount_low') return a.total - b.total;
      return 0;
    });

    return result;
  };

  const getCardColorClass = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
      case 'CONFIRMED':
        return 'bg-[#F0F9FF] border-[#BAE6FD] dark:bg-[#38BDF8]/[0.22] dark:border-[#38BDF8]/65';
      case 'PREPARING':
        return 'bg-[#FFFBEB] border-[#FDE68A] dark:bg-[#FBBF24]/[0.22] dark:border-[#FBBF24]/65';
      case 'READY':
      case 'COMPLETED':
      case 'SERVED':
        return 'bg-[#F0FDF4] border-[#BBF7D0] dark:bg-[#4ADE80]/[0.22] dark:border-[#4ADE80]/65';
      case 'CANCELLED':
        return 'bg-[#FEF2F2] border-[#FECACA] dark:bg-[#F87171]/[0.22] dark:border-[#F87171]/65';
      default:
        return 'bg-tk-bg-surface border-tk-border';
    }
  };

  const getRowColorClass = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
      case 'CONFIRMED':
        return 'bg-[#F0F9FF]/80 hover:bg-[#E0F2FE] dark:bg-[#38BDF8]/[0.22] dark:hover:bg-[#38BDF8]/[0.32]';
      case 'PREPARING':
        return 'bg-[#FFFBEB]/80 hover:bg-[#FEF3C7] dark:bg-[#FBBF24]/[0.22] dark:hover:bg-[#FBBF24]/[0.32]';
      case 'READY':
      case 'COMPLETED':
      case 'SERVED':
        return 'bg-[#F0FDF4]/80 hover:bg-[#DCFCE7] dark:bg-[#4ADE80]/[0.22] dark:hover:bg-[#4ADE80]/[0.32]';
      case 'CANCELLED':
        return 'bg-[#FEF2F2]/80 hover:bg-[#FEE2E2] dark:bg-[#F87171]/[0.22] dark:hover:bg-[#F87171]/[0.32]';
      default:
        return 'hover:bg-tk-burgundy/5';
    }
  };

  return (
    <>
      <style>{`
        .tk-table-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(113, 128, 150, 0.35) transparent;
        }
        .tk-table-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .tk-table-scroll::-webkit-scrollbar-track { background: transparent; }
        .tk-table-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(113, 128, 150, 0.32);
          border-radius: 999px; border: 2px solid transparent; background-clip: padding-box;
        }
        .tk-table-scroll::-webkit-scrollbar-thumb:hover { background-color: rgba(113, 128, 150, 0.55); }
        .tk-table-scroll::-webkit-scrollbar-corner { background: transparent; }
      `}</style>

      <div className="flex-shrink-0">
        <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 flex-wrap max-md:-mt-[52px] max-md:mb-[8px]">
          <div className="flex items-center gap-2 sm:gap-4 max-md:ml-[56px]">
            <h1 className="text-[20px] sm:text-[22px] font-semibold text-tk-text whitespace-nowrap">Orders Management</h1>
          </div>
        </div>

        <div className="grid grid-rows-[1fr] opacity-100">
          <div className="overflow-hidden">
            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-[850px] w-full pt-1 mb-6 mt-4 sm:mt-0 overflow-x-auto no-scrollbar pb-1">
              {/* Card 1 */}
              <div className="bg-tk-bg-card p-3 sm:p-2.5 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md min-w-[145px] sm:min-w-0 shrink-0">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-[11px] sm:text-xs text-tk-text-secondary font-medium">Orders Today</h3>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-tk-burgundy-bg flex items-center justify-center text-tk-burgundy">
                    <TrendingUp size={14} />
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="text-[16px] sm:text-[20px] font-bold text-tk-text">{isLoading ? '...' : ordersToday}</div>
                  <div className={`flex items-center text-[10px] sm:text-[11px] font-medium ${todayChange >= 0 ? 'text-tk-success' : 'text-tk-error'}`}>
                    <TrendingUp size={10} className="mr-1 sm:w-[12px] sm:h-[12px]" style={todayChange < 0 ? { transform: 'rotate(180deg)' } : undefined} />
                    <span>{Math.abs(todayChange)}%</span>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-tk-bg-card p-3 sm:p-2.5 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md min-w-[145px] sm:min-w-0 shrink-0">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-[11px] sm:text-xs text-tk-text-secondary font-medium">Orders This Week</h3>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-tk-burgundy-bg flex items-center justify-center text-tk-burgundy">
                    <TrendingUp size={14} />
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="text-[16px] sm:text-[20px] font-bold text-tk-text">{isLoading ? '...' : ordersThisWeek}</div>
                  <div className={`flex items-center text-[10px] sm:text-[11px] font-medium ${weekChange >= 0 ? 'text-tk-success' : 'text-tk-error'}`}>
                    <TrendingUp size={10} className="mr-1 sm:w-[12px] sm:h-[12px]" style={weekChange < 0 ? { transform: 'rotate(180deg)' } : undefined} />
                    <span>{Math.abs(weekChange)}%</span>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-tk-bg-card p-3 sm:p-2.5 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md min-w-[145px] sm:min-w-0 shrink-0">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-[11px] sm:text-xs text-tk-text-secondary font-medium">Active Orders</h3>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-tk-burgundy-bg flex items-center justify-center text-tk-burgundy">
                    <Package size={14} />
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="text-[16px] sm:text-[20px] font-bold text-tk-text">{isLoading ? '...' : activeOrders.length}</div>
                  <div className="flex items-center text-[10px] sm:text-[11px] font-medium text-tk-text-secondary">
                    <span>Currently processing</span>
                  </div>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-tk-bg-card p-3 sm:p-2.5 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md min-w-[145px] sm:min-w-0 shrink-0">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-[11px] sm:text-xs text-tk-text-secondary font-medium">Total Orders</h3>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-tk-burgundy-bg flex items-center justify-center text-tk-burgundy">
                    <Package size={14} />
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="text-[16px] sm:text-[20px] font-bold text-tk-text">{isLoading ? '...' : orders.length}</div>
                  <div className="flex items-center text-[10px] sm:text-[11px] font-medium text-tk-text-secondary">
                    <span>All time</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-tk-border mb-4 transition-all duration-300" />
      </div>

      {/* Tabs & Controls */}
      <div
        className="sticky top-2 z-50 py-2.5 px-4 bg-[var(--tk-info-bar-bg)] backdrop-blur-md shadow-[var(--tk-info-bar-shadow)] border border-[var(--tk-info-bar-border)] rounded-2xl flex flex-col gap-2 mb-6 transition-all mx-1"
      >
        <div className="flex gap-4 sm:gap-8 overflow-x-auto hide-scrollbar pt-1 pb-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${activeTab === tab
                ? 'text-tk-burgundy border-b-2 border-tk-burgundy'
                : 'text-tk-text-secondary hover:text-tk-text'
                }`}
            >
              {tab} <span className="ml-1 opacity-75">({tabCounts[tab]})</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
          {/* Date Filter on the left */}
          <div className="flex flex-wrap items-center gap-4 pb-1">
            <div className="relative" ref={dateDropdownRef}>
              <button
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                className={`pb-2 text-sm font-semibold whitespace-nowrap transition-colors duration-200 flex items-center gap-1.5 cursor-pointer ${
                  selectedDateRange !== 'all' || isDateDropdownOpen
                    ? 'text-tk-burgundy border-b-2 border-tk-burgundy'
                    : 'text-tk-text-secondary hover:text-tk-text'
                }`}
              >
                <Calendar size={14} />
                <span>Date: {
                  selectedDateRange === 'all' ? 'All Time' :
                  selectedDateRange === 'today' ? 'Today' :
                  selectedDateRange === 'yesterday' ? 'Yesterday' :
                  selectedDateRange === 'week' ? 'This Week' :
                  selectedDateRange === 'month' ? 'This Month' :
                  selectedDateRange === 'custom' ? 'Custom' : 'All Time'
                }</span>
                <ChevronDown size={14} className="opacity-70" />
              </button>

              {isDateDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-[160px] bg-tk-bg-surface border border-tk-border rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-[fadeIn_0.15s_ease-out]">
                  {[
                    { value: 'all', label: 'All Time' },
                    { value: 'today', label: 'Today' },
                    { value: 'yesterday', label: 'Yesterday' },
                    { value: 'week', label: 'This Week' },
                    { value: 'month', label: 'This Month' },
                    { value: 'custom', label: 'Custom' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedDateRange(option.value);
                        setIsDateDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-[13px] font-medium transition-colors ${
                        selectedDateRange === option.value
                          ? 'bg-tk-burgundy/10 text-tk-burgundy'
                          : 'text-tk-text hover:bg-tk-bg-hover'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedDateRange === 'custom' && (
              <div className="flex items-center pb-2">
                <input
                  type="date"
                  className="px-3 py-1 rounded-full border border-tk-border text-[12px] font-bold bg-tk-bg-surface outline-none text-tk-text focus:border-tk-burgundy"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                />
              </div>
            )}

            {selectedDateRange === 'week' && (
              <div className="flex items-center gap-2 bg-tk-bg-surface px-2 py-1 rounded-full border border-tk-border shadow-sm pb-2 mb-2">
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
              <div className="flex items-center gap-2 bg-tk-bg-surface px-2 py-1 rounded-full border border-tk-border shadow-sm pb-2 mb-2">
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
          </div>

          {/* Controls on the right, on the same line as the date filter */}
          <div className="flex flex-row items-center gap-2 sm:gap-3 pb-2 w-full md:w-auto">
            {/* 1. Sort Dropdown */}
            <div className="relative shrink-0" ref={sortDropdownRef}>
              <button
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="flex justify-between items-center gap-1.5 px-3 py-1.5 rounded-full border border-tk-border bg-tk-bg-surface hover:bg-tk-bg-hover text-tk-text-secondary hover:text-tk-text text-[12px] font-semibold transition-colors whitespace-nowrap h-[32px] shrink-0"
              >
                <div className="flex items-center gap-1.5">
                  <ArrowUpDown size={13} />
                  <span className="opacity-70 font-medium hidden sm:inline">Sort:</span>
                  <span>
                    {sortBy === 'newest' && 'Newest'}
                    {sortBy === 'oldest' && 'Oldest'}
                    {sortBy === 'amount_high' && 'High-Low'}
                    {sortBy === 'amount_low' && 'Low-High'}
                  </span>
                </div>
                <ChevronDown size={14} className="sm:hidden ml-0.5" />
              </button>

              {isSortDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-[180px] bg-tk-bg-surface border border-tk-border rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-[fadeIn_0.15s_ease-out]">
                  {[
                    { value: 'newest', label: 'Newest First' },
                    { value: 'oldest', label: 'Oldest First' },
                    { value: 'amount_high', label: 'Amount: High to Low' },
                    { value: 'amount_low', label: 'Amount: Low to High' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value as any);
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-[13px] font-medium transition-colors ${sortBy === option.value
                        ? 'bg-tk-burgundy/10 text-tk-burgundy'
                        : 'text-tk-text hover:bg-tk-bg-hover'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Grid/Table Toggle */}
            <div className="flex bg-tk-bg-surface border border-tk-border rounded-full p-0.5 shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-xl transition-all duration-200 flex items-center justify-center ${viewMode === 'table' ? 'bg-tk-text text-tk-bg-surface shadow-sm' : 'text-tk-text-secondary hover:bg-tk-bg-hover hover:text-tk-text'}`}
                title="Table View"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-all duration-200 flex items-center justify-center ${viewMode === 'grid' ? 'bg-tk-text text-tk-bg-surface shadow-sm' : 'text-tk-text-secondary hover:bg-tk-bg-hover hover:text-tk-text'}`}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
            </div>

            {/* 3. Search Bar */}
            <div className="relative w-full min-w-[100px] sm:w-[240px] shrink">
              <Search className="absolute left-2.5 top-[calc(50%)] -translate-y-1/2 text-tk-text-secondary" size={14} />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[32px] pl-8 pr-7 bg-tk-bg-surface border border-tk-border rounded-full text-tk-text text-[13px] focus:outline-none focus:border-tk-burgundy transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-[calc(50%)] -translate-y-1/2 text-tk-text-secondary hover:text-tk-text focus:outline-none flex items-center justify-center p-0"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div ref={tableScrollRef} className="w-full pb-8">
        {viewMode === 'table' ? (
          <>
            {/* Mobile card view (hidden on sm+) */}
            <div className="flex flex-col gap-3 sm:hidden">
              {isLoading ? (
                <div className="py-8 text-center text-tk-text-secondary text-sm">Loading orders...</div>
              ) : filteredOrders().length === 0 ? (
                <div className="py-12 text-center text-tk-text-secondary text-sm font-medium">No orders found.</div>
              ) : (
                filteredOrders().map((order, idx) => {
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
                      key={idx}
                      className={`border rounded-xl p-3.5 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-tk-burgundy/50 transition-all cursor-pointer ${getCardColorClass(order.status)}`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      {/* Top row: order number + amount */}
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="font-semibold text-tk-text text-sm">{order.orderNumber}</span>
                          <span className="text-[11px] text-tk-text-secondary mt-0.5">{order.time} · {order.table}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-tk-text text-base">₹{order.total}</span>
                          <span
                            className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              order.paymentStatus?.toLowerCase() === 'paid' ? 'bg-[#C6F6D5] text-[#22543D]' : 
                              order.paymentStatus?.toLowerCase() === 'refunded' ? 'bg-[#EDF2F7] text-[#4A5568]' : 
                              'bg-[#FEF2F2] text-[#E53E3E]'
                            }`}
                          >
                            <select
                              value={order.paymentStatus?.toLowerCase() || 'pending'}
                              onChange={(e) => {
                                handleUpdatePaymentStatus(order.id, e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-transparent border-none outline-none text-[10px] font-bold text-inherit cursor-pointer focus:outline-none py-0.5"
                            >
                              <option value="pending" className="text-tk-text bg-tk-bg-surface font-semibold">Pending</option>
                              <option value="paid" className="text-tk-text bg-tk-bg-surface font-semibold">Paid</option>
                              <option value="refunded" className="text-tk-text bg-tk-bg-surface font-semibold">Refunded</option>
                            </select>
                            {order.paymentStatus?.toLowerCase() === 'paid' && order.paymentMethod && (
                              <span className="opacity-80 font-semibold border-l border-current pl-1 ml-0.5">
                                {order.paymentMethod}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Customer & Date */}
                      <div className="flex justify-between items-end text-[12px] text-tk-text-secondary">
                        <span className="font-semibold text-tk-text">{order.customer}</span>
                        <span className="text-[11px]">{new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>

                      {/* Tracking stepper */}
                      <div className="pt-2 border-t border-tk-border" onClick={(e) => e.stopPropagation()}>
                        {order.status?.toUpperCase() === 'CANCELLED' ? (
                          <div className="flex-1 flex items-center relative">
                            <div className="flex flex-col items-center relative">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center border-[2px] bg-[#E53E3E] border-[#E53E3E]">
                                <Check size={12} className="text-white" strokeWidth={3} />
                              </div>
                              <span className="absolute top-6 text-[9px] font-medium text-[#E53E3E] whitespace-nowrap">Placed</span>
                            </div>
                            <div className="flex-1 h-[2px] mx-1 bg-[#E53E3E]"></div>
                            <div className="flex flex-col items-center relative">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center border-[2px] bg-[#E53E3E] border-[#E53E3E]">
                                <X size={12} className="text-white" strokeWidth={3} />
                              </div>
                              <span className="absolute top-6 text-[9px] font-bold text-[#E53E3E] whitespace-nowrap">Cancelled</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center w-full pb-5">
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
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isNext) handleUpdateStatus(order.id, step.value);
                                      }}
                                      disabled={!isNext}
                                      className={`w-5 h-5 rounded-full flex items-center justify-center border-[2px] z-10 transition-all duration-300 relative group/btn
                                        ${isCompleted ? 'bg-[#16a34a] border-[#16a34a] text-white' :
                                          isNext ? 'bg-white border-[#16a34a] cursor-pointer hover:bg-[#16a34a] hover:text-white hover:scale-110 active:scale-95' :
                                            'bg-white border-[#E2E8F0] cursor-default'}`}
                                    >
                                      {isNext && <span className="absolute inset-0 rounded-full border border-dashed border-[#16a34a]/60 animate-[spin_6s_linear_infinite]" style={{ margin: '-4px' }} />}
                                      {isNext && <span className="absolute inset-0 rounded-full bg-[#16a34a]/10 animate-ping" style={{ margin: '-1px' }} />}
                                      {(isCompleted || isNext) && (
                                        <Check size={12} className={`text-white transition-all duration-300 ${isCompleted ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover/btn:opacity-100 group-hover/btn:scale-100'}`} strokeWidth={3} />
                                      )}
                                    </button>
                                    <span className={`absolute top-6 text-[9px] font-medium whitespace-nowrap ${isCompleted || isNext ? 'text-tk-text' : 'text-[#A0AEC0]'}`}>
                                      {step.label}
                                    </span>
                                  </div>
                                  {!isLast && (
                                    <div className={`flex-1 h-[2px] mx-1 transition-colors ${stepIdx < currentIndex ? 'bg-[#16a34a]' : 'bg-[#E2E8F0]'}`} />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        )}
                        <div className="flex justify-between items-center mt-1">
                          {order.status?.toUpperCase() !== 'CANCELLED' && order.status?.toUpperCase() !== 'COMPLETED' ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); setOrderToCancel(order); }}
                              className="px-2.5 py-1 bg-[#FEF2F2] text-[#E53E3E] border border-[#FC8181] rounded-lg text-[11px] font-semibold hover:bg-[#FED7D7] transition-colors"
                            >
                              Cancel
                            </button>
                          ) : order.status?.toUpperCase() === 'CANCELLED' ? (
                            <span className="px-2.5 py-1 bg-[#FEF2F2] text-[#E53E3E] rounded-lg text-[11px] font-bold">Cancelled</span>
                          ) : <div />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop table view (hidden on mobile) */}
            {/* Desktop table view (hidden on mobile) */}
            <div className="hidden sm:block overflow-x-auto tk-table-scroll bg-tk-bg-surface border border-tk-border rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <table className="w-full text-left border-collapse table-fixed min-w-[950px]">
                <thead>
                  <tr>
                    <th className="sticky top-0 z-40 bg-tk-bg-hover py-3.5 px-4 text-[13px] font-bold text-tk-text-secondary whitespace-nowrap border-b border-tk-border w-[6%] text-center">
                      Sl No
                    </th>
                    <th className="sticky top-0 z-40 bg-tk-bg-hover py-3.5 px-4 text-[13px] font-bold text-tk-text-secondary whitespace-nowrap border-b border-tk-border w-[17%]">
                      Order Details
                    </th>
                    <th className="sticky top-0 z-40 bg-tk-bg-hover py-3.5 px-4 text-[13px] font-bold text-tk-text-secondary whitespace-nowrap border-b border-tk-border w-[17%]">
                      Customer Info
                    </th>
                    <th className="sticky top-0 z-40 bg-tk-bg-hover py-3.5 px-4 text-[13px] font-bold text-tk-text-secondary whitespace-nowrap border-b border-tk-border w-[12%]">
                      Date
                    </th>
                    <th className="sticky top-0 z-40 bg-tk-bg-hover py-3.5 px-4 text-[13px] font-bold text-tk-text-secondary whitespace-nowrap border-b border-tk-border w-[20%]">
                      Payment Info
                    </th>
                    <th className="sticky top-0 z-40 bg-tk-bg-hover py-3.5 px-4 text-[13px] font-bold text-tk-text-secondary whitespace-nowrap border-b border-tk-border w-[28%]">
                      Order Tracking
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-tk-text-secondary text-sm">Loading orders...</td>
                    </tr>
                  ) : filteredOrders().length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-tk-text-secondary">
                        <p className="text-sm font-medium">
                          {activeTab === 'Active Orders'
                            ? 'No active orders right now.'
                            : activeTab === 'Completed'
                              ? 'No completed orders yet.'
                              : 'No orders found.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders().map((order, idx) => (
                      <tr key={idx} className={`border-b border-tk-border last:border-b-0 transition-colors group hover:bg-tk-bg-hover ${getRowColorClass(order.status)}`}>
                        <td className="py-4 px-4 text-[13px] text-tk-text-secondary font-semibold text-center">{idx + 1}</td>
                        <td className="py-3 px-4 text-sm text-tk-text cursor-pointer" onClick={() => setSelectedOrder(order)}>
                          <div className="flex flex-col">
                            <span className="font-semibold">{order.orderNumber}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-tk-text cursor-pointer" onClick={() => setSelectedOrder(order)}>
                          <div className="flex flex-col">
                            <span className="font-semibold">{order.customer}</span>
                            <span className="text-xs text-tk-text-secondary font-medium mt-0.5">{order.table}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-tk-text cursor-pointer" onClick={() => setSelectedOrder(order)}>
                          <div className="flex flex-col">
                            <span className="font-semibold">{new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span className="text-xs text-tk-text-secondary font-medium mt-0.5">{order.time}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm cursor-pointer" onClick={() => setSelectedOrder(order)}>
                          <div className="flex flex-col items-start gap-1.5">
                            <span className="text-tk-text font-semibold">₹ {order.total}</span>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                                  order.paymentStatus?.toLowerCase() === 'paid' ? 'bg-[#C6F6D5] text-[#22543D]' : 
                                  order.paymentStatus?.toLowerCase() === 'refunded' ? 'bg-[#EDF2F7] text-[#4A5568]' : 
                                  'bg-[#FEF2F2] text-[#E53E3E]'
                                }`}
                              >
                                <select
                                  value={order.paymentStatus?.toLowerCase() || 'pending'}
                                  onChange={(e) => {
                                    handleUpdatePaymentStatus(order.id, e.target.value);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="bg-transparent border-none outline-none text-[11px] font-bold text-inherit cursor-pointer py-0.5 focus:outline-none"
                                >
                                  <option value="pending" className="text-tk-text bg-tk-bg-surface font-semibold">Pending</option>
                                  <option value="paid" className="text-tk-text bg-tk-bg-surface font-semibold">Paid</option>
                                  <option value="refunded" className="text-tk-text bg-tk-bg-surface font-semibold">Refunded</option>
                                </select>
                                {order.paymentStatus?.toLowerCase() === 'paid' && order.paymentMethod && (
                                  <span className="opacity-80 font-semibold border-l border-current pl-1 ml-0.5">
                                    {order.paymentMethod}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex items-center w-full min-w-[250px] max-w-[400px] gap-4 pb-4 pt-2 px-2" onClick={(e) => e.stopPropagation()}>
                            {order.status?.toUpperCase() === 'CANCELLED' ? (
                              <div className="flex-1 flex items-center relative">
                                <div className="flex flex-col items-center relative group">
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center border-[2px] z-10 bg-[#E53E3E] border-[#E53E3E]">
                                    <Check size={14} className="text-white" strokeWidth={3} />
                                  </div>
                                  <span className="absolute top-7 text-[10px] font-medium text-[#E53E3E] whitespace-nowrap">Placed</span>
                                </div>
                                <div className="flex-1 h-[2px] mx-1 transition-colors mt-[-4px] bg-[#E53E3E]"></div>
                                <div className="flex flex-col items-center relative group">
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center border-[2px] z-10 bg-[#E53E3E] border-[#E53E3E]">
                                    <X size={14} className="text-white" strokeWidth={3} />
                                  </div>
                                  <span className="absolute top-7 text-[10px] font-bold text-[#E53E3E] whitespace-nowrap">Cancelled</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1 flex items-center relative">
                                {[
                                  { label: 'Accept', value: 'CONFIRMED' },
                                  { label: 'Preparing', value: 'PREPARING' },
                                  { label: 'Ready', value: 'READY' }
                                ].map((step, idx, arr) => {
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
                                  const isCompleted = idx <= currentIndex;
                                  const isNext = idx === currentIndex + 1;
                                  const isLast = idx === arr.length - 1;

                                  return (
                                    <React.Fragment key={step.value}>
                                      <div className="flex flex-col items-center relative group">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (isNext) handleUpdateStatus(order.id, step.value);
                                          }}
                                          disabled={!isNext}
                                          className={`w-6 h-6 rounded-full flex items-center justify-center border-[2px] z-10 transition-all duration-300 relative group/btn
                                        ${isCompleted ? 'bg-[#16a34a] border-[#16a34a] text-white' :
                                              isNext ? 'bg-white border-[#16a34a] cursor-pointer hover:bg-[#16a34a] hover:text-white hover:scale-110 active:scale-95' :
                                                'bg-white border-[#E2E8F0] cursor-default'}
                                      `}
                                          title={isNext ? `Mark as ${step.label}` : ''}
                                        >
                                          {isNext && (
                                            <span className="absolute inset-0 rounded-full border border-dashed border-[#16a34a]/60 animate-[spin_6s_linear_infinite]" style={{ margin: '-4px' }} />
                                          )}
                                          {isNext && (
                                            <span className="absolute inset-0 rounded-full bg-[#16a34a]/10 animate-ping" style={{ margin: '-1px' }} />
                                          )}
                                          {(isCompleted || isNext) && (
                                            <Check size={14} className={`text-white transition-all duration-300 ${isCompleted ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover/btn:opacity-100 group-hover/btn:scale-100'}`} strokeWidth={3} />
                                          )}
                                        </button>
                                        <span className={`absolute top-7 text-[10px] font-medium whitespace-nowrap
                                      ${isCompleted || isNext ? 'text-tk-text' : 'text-[#A0AEC0]'}
                                    `}>
                                          {step.label}
                                        </span>
                                      </div>
                                      {!isLast && (
                                        <div className={`flex-1 h-[2px] mx-1 transition-colors mt-[-4px]
                                      ${idx < currentIndex ? 'bg-[#16a34a]' : 'bg-[#E2E8F0]'}
                                    `} />
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            )}
                            {order.status?.toUpperCase() !== 'CANCELLED' && order.status?.toUpperCase() !== 'COMPLETED' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOrderToCancel(order);
                                }}
                                className="px-3 py-1.5 bg-[#FEF2F2] text-[#E53E3E] border border-[#FC8181] rounded-lg text-xs font-semibold hover:bg-[#FED7D7] transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                            {order.status?.toUpperCase() === 'CANCELLED' && (
                              <span className="px-3 py-1.5 bg-[#FEF2F2] text-[#E53E3E] rounded-lg text-xs font-bold">
                                Cancelled
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 p-2 sm:p-4 min-w-full">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-tk-text-secondary text-sm">Loading orders...</div>
            ) : filteredOrders().length === 0 ? (
              <div className="col-span-full py-12 text-center text-tk-text-secondary font-medium">No orders found.</div>
            ) : (
              filteredOrders().map((order, idx) => {
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
                  <div key={idx} className={`border rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-tk-burgundy/50 transition-all cursor-pointer relative group ${getCardColorClass(order.status)}`} onClick={() => setSelectedOrder(order)}>
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="font-medium text-tk-text text-xs">{order.orderNumber}</span>
                        <span className="text-[10px] text-tk-text-secondary font-semibold mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-tk-text-secondary font-medium mt-0.5">{order.time}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-tk-text text-lg">₹ {order.total}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                              order.paymentStatus?.toLowerCase() === 'paid' ? 'bg-[#C6F6D5] text-[#22543D]' : 
                              order.paymentStatus?.toLowerCase() === 'refunded' ? 'bg-[#EDF2F7] text-[#4A5568]' : 
                              'bg-[#FEF2F2] text-[#E53E3E]'
                            }`}
                          >
                            <select
                              value={order.paymentStatus?.toLowerCase() || 'pending'}
                              onChange={(e) => {
                                handleUpdatePaymentStatus(order.id, e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-transparent border-none outline-none text-[11px] font-bold text-inherit cursor-pointer py-0.5 focus:outline-none"
                            >
                              <option value="pending" className="text-tk-text bg-tk-bg-surface font-semibold">Pending</option>
                              <option value="paid" className="text-tk-text bg-tk-bg-surface font-semibold">Paid</option>
                              <option value="refunded" className="text-tk-text bg-tk-bg-surface font-semibold">Refunded</option>
                            </select>
                            {order.paymentStatus?.toLowerCase() === 'paid' && order.paymentMethod && (
                              <span className="opacity-80 font-semibold border-l border-current pl-1 ml-0.5">
                                {order.paymentMethod}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between text-sm items-center mt-1">
                      <div className="flex flex-col">
                        <span className="font-semibold text-tk-text">{order.customer}</span>
                        <span className="text-xs text-tk-text-secondary">{order.table}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-4 border-t border-tk-border w-full">
                      <div className="flex items-center justify-between w-full px-2" onClick={(e) => e.stopPropagation()}>
                        {order.status?.toUpperCase() === 'CANCELLED' ? (
                          <div className="flex-1 flex items-center relative">
                            <div className="flex flex-col items-center relative group">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center border-[2px] z-10 bg-[#E53E3E] border-[#E53E3E]">
                                <Check size={14} className="text-white" strokeWidth={3} />
                              </div>
                              <span className="absolute top-7 text-[10px] font-medium text-[#E53E3E] whitespace-nowrap">Placed</span>
                            </div>
                            <div className="flex-1 h-[2px] mx-1 transition-colors bg-[#E53E3E]"></div>
                            <div className="flex flex-col items-center relative group">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center border-[2px] z-10 bg-[#E53E3E] border-[#E53E3E]">
                                <X size={14} className="text-white" strokeWidth={3} />
                              </div>
                              <span className="absolute top-7 text-[10px] font-bold text-[#E53E3E] whitespace-nowrap">Cancelled</span>
                            </div>
                          </div>
                        ) : (
                          <>
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
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isNext) handleUpdateStatus(order.id, step.value);
                                      }}
                                      disabled={!isNext}
                                      className={`w-6 h-6 rounded-full flex items-center justify-center border-[2px] z-10 transition-all duration-300 relative group/btn
                                      ${isCompleted ? 'bg-[#16a34a] border-[#16a34a] text-white' :
                                          isNext ? 'bg-white border-[#16a34a] cursor-pointer hover:bg-[#16a34a] hover:text-white hover:scale-110 active:scale-95' :
                                            'bg-white border-[#E2E8F0] cursor-default'}
                                    `}
                                    >
                                      {isNext && (
                                        <span className="absolute inset-0 rounded-full border border-dashed border-[#16a34a]/60 animate-[spin_6s_linear_infinite]" style={{ margin: '-4px' }} />
                                      )}
                                      {isNext && (
                                        <span className="absolute inset-0 rounded-full bg-[#16a34a]/10 animate-ping" style={{ margin: '-1px' }} />
                                      )}
                                      {(isCompleted || isNext) && (
                                        <Check size={14} className={`text-white transition-all duration-300 ${isCompleted ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover/btn:opacity-100 group-hover/btn:scale-100'}`} strokeWidth={3} />
                                      )}
                                    </button>
                                    <span className={`absolute top-7 text-[10px] font-medium whitespace-nowrap
                                    ${isCompleted || isNext ? 'text-tk-text' : 'text-[#A0AEC0]'}
                                  `}>
                                      {step.label}
                                    </span>
                                  </div>
                                  {!isLast && (
                                    <div className={`flex-1 h-[2px] mx-1 transition-colors
                                    ${stepIdx < currentIndex ? 'bg-[#16a34a]' : 'bg-[#E2E8F0]'}
                                  `} />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </>
                        )}
                      </div>
                      <div className="mt-8 flex justify-end">
                        {order.status?.toUpperCase() !== 'CANCELLED' && order.status?.toUpperCase() !== 'COMPLETED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOrderToCancel(order);
                            }}
                            className="px-3 py-1.5 bg-[#FEF2F2] text-[#E53E3E] border border-[#FC8181] rounded-lg text-xs font-semibold hover:bg-[#FED7D7] transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        {order.status?.toUpperCase() === 'CANCELLED' && (
                          <span className="px-3 py-1.5 bg-[#FEF2F2] text-[#E53E3E] rounded-lg text-xs font-bold">
                            Cancelled
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      {selectedOrder && (() => {
        const list = filteredOrders();
        const freshOrder = list.find(o => o.id === selectedOrder.id) || selectedOrder;
        const idx = list.findIndex(o => o.id === freshOrder.id);
        const hasPrev = idx > 0;
        const hasNext = idx >= 0 && idx < list.length - 1;
        const handlePrevOrder = () => {
          if (hasPrev) setSelectedOrder(list[idx - 1]);
        };
        const handleNextOrder = () => {
          if (hasNext) setSelectedOrder(list[idx + 1]);
        };

        return (
          <OrderDetailsDialog
            order={freshOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdateStatus={handleUpdateStatus}
            onCancel={(o) => setOrderToCancel(o)}
            onMarkPaid={handlePaymentComplete}
            onPrev={handlePrevOrder}
            onNext={handleNextOrder}
            hasPrev={hasPrev}
            hasNext={hasNext}
          />
        );
      })()}
      {orderToCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1100] p-4 animate-[fadeIn_0.2s_ease]" onClick={() => setOrderToCancel(null)}>
          <div className="bg-tk-bg-card rounded-[24px] p-6 max-w-[400px] w-full border-[1.5px] border-tk-border shadow-[0_20px_60px_rgba(0,0,0,0.12)] animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-tk-text mb-2">Cancel Order?</h3>
            <p className="text-tk-text-secondary text-sm mb-6">
              Are you sure you want to cancel order <strong>{orderToCancel.orderNumber}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOrderToCancel(null)}
                className="px-4 py-2 bg-tk-bg-hover text-tk-text-secondary rounded-xl text-sm font-semibold hover:bg-tk-border transition-colors"
              >
                No, Keep it
              </button>
              <button
                onClick={() => {
                  handleUpdateStatus(orderToCancel.id, 'CANCELLED');
                  setOrderToCancel(null);
                }}
                className="px-4 py-2 bg-[#E53E3E] text-white rounded-xl text-sm font-semibold hover:bg-[#C53030] transition-colors shadow-[0_4px_12px_rgba(229,62,62,0.3)]"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Order;