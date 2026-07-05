import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, X, CheckCircle, Package, Check, ChevronUp, ChevronDown, Search, ArrowUpDown, List, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useDashboardOrders, useInvalidateQueries, useRevenueData, useMenuItems } from '../hooks/useSupabaseQuery';
import { updateOrderStatus, updatePaymentStatus } from '../services/supabaseService';
import type { DashboardOrder } from '../services/supabaseService';


interface OrderDetailsDialogProps {
  order: DashboardOrder | null;
  onClose: () => void;
  onUpdateStatus?: (orderId: string, status: string) => void;
  onMarkReady: (orderId: string) => void;
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
  onMarkReady,
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
  const { data: menuItems = [] } = useMenuItems(activeRestaurantId);
  const { invalidateOrders } = useInvalidateQueries();

  const outOfStockItems = menuItems.filter(item => !item.available);

  const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<DashboardOrder | null>(null);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>(location.state?.activeTab || 'All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_high' | 'amount_low'>('oldest');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [headerOffset, setHeaderOffset] = useState(0);
  const stickyContainerRef = useRef<HTMLDivElement>(null);
  const [stickyHeight, setStickyHeight] = useState(0);
  useEffect(() => {
    const updateHeight = () => {
      if (stickyContainerRef.current) {
        setStickyHeight(stickyContainerRef.current.offsetHeight);
      }
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);

    if (stickyContainerRef.current) {
      observer.observe(stickyContainerRef.current);
    }

    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
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

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      await updateOrderStatus(orderId, nextStatus as any);
      if (activeRestaurantId) invalidateOrders(activeRestaurantId);
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const activeOrders = orders.filter(order => {
    const s = order.status?.toUpperCase();
    return s !== 'COMPLETED' && s !== 'CANCELLED' && (s !== 'READY' || !order.isPaid);
  });
  const completedOrders = orders.filter(order => {
    const s = order.status?.toUpperCase();
    return s === 'COMPLETED' || (s === 'READY' && order.isPaid);
  });
  const cancelledOrders = orders.filter(order => order.status?.toUpperCase() === 'CANCELLED');

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
    'All': orders.length,
    'Active': activeOrders.length,
    'Completed': completedOrders.length,
    'Cancelled': cancelledOrders.length,
  };

  const filteredOrders = () => {
    let result = orders;
    switch (activeTab) {
      case 'Active': result = activeOrders; break;
      case 'Completed': result = completedOrders; break;
      case 'Cancelled': result = cancelledOrders; break;
      case 'All': default: result = orders; break;
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
        <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-4">
            <h1 className="text-[20px] sm:text-[22px] font-semibold text-tk-text whitespace-nowrap">Orders</h1>
          </div>
        </div>

        <div className="grid grid-rows-[1fr] opacity-100">
          <div className="overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-[850px] w-full pt-1 mb-6 mt-4 sm:mt-0">
              {/* Card 1 */}
              <div className="bg-tk-bg-card p-3 sm:p-2.5 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
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
              <div className="bg-tk-bg-card p-3 sm:p-2.5 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
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
              <div className="bg-tk-bg-card p-3 sm:p-2.5 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
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
              <div className="bg-tk-bg-card p-3 sm:p-2.5 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
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
        ref={stickyContainerRef}
        className="sticky top-0 z-30 py-2 bg-tk-bg-card shadow-sm border-b border-tk-border flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-2"
      >
        <div className="flex gap-4 sm:gap-8 overflow-x-auto hide-scrollbar pt-1 w-full xl:w-auto flex-1 pb-1 pl-12 md:pl-0">
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

          <div className="relative w-full sm:w-auto" ref={sortDropdownRef}>
            <button
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className="flex justify-between sm:justify-start items-center gap-1.5 px-4 py-2 sm:px-3 sm:py-1.5 rounded-full border border-tk-border bg-tk-bg-surface hover:bg-tk-bg-hover text-tk-text-secondary hover:text-tk-text text-[13px] sm:text-[12px] font-semibold transition-colors whitespace-nowrap h-[36px] sm:h-[32px] w-full shrink-0"
            >
              <div className="flex items-center gap-1.5">
                <ArrowUpDown size={13} />
                <span className="opacity-70 font-medium">Sort by:</span>
                {sortBy === 'newest' && 'Newest First'}
                {sortBy === 'oldest' && 'Oldest First'}
                {sortBy === 'amount_high' && 'High to Low'}
                {sortBy === 'amount_low' && 'Low to High'}
              </div>
              <ChevronDown size={14} className="sm:hidden" />
            </button>

            {isSortDropdownOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-full sm:w-[180px] bg-tk-bg-surface border border-tk-border rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-[fadeIn_0.15s_ease-out]">
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
                    className={`w-full text-left px-4 py-3 sm:py-2 text-[14px] sm:text-[13px] font-medium transition-colors ${sortBy === option.value
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

          <div className="relative w-full sm:w-[240px] shrink-0">
            <Search className="absolute left-3 top-[calc(50%)] -translate-y-1/2 text-tk-text-secondary" size={14} />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-[36px] sm:h-[32px] pl-9 pr-8 bg-tk-bg-surface border border-tk-border rounded-full text-tk-text text-[14px] sm:text-[13px] focus:outline-none focus:border-tk-burgundy transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-[calc(50%)] -translate-y-1/2 text-tk-text-secondary hover:text-tk-text focus:outline-none flex items-center justify-center p-0"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div ref={tableScrollRef} className="w-full pb-8">
        {viewMode === 'table' ? (
          <table className="w-full text-left border-collapse table-fixed min-w-[950px]">
            <thead>
              <tr>
                <th
                  className="sticky z-40 bg-tk-bg-card py-3 px-4 border-b-0 shadow-[inset_0_-2px_0_0_var(--tk-border)] text-sm font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border w-[6%] text-center shadow-sm"
                  style={{ top: `${stickyHeight}px` }}                >
                  Sl No
                </th>

                <th
                  className="sticky z-40 bg-tk-bg-card py-3 px-4 border-b-0 shadow-[inset_0_-2px_0_0_var(--tk-border)] text-sm font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border w-[17%] shadow-sm"
                  style={{ top: `${stickyHeight}px` }}                >
                  Order Details
                </th>

                <th
                  className="sticky z-40 bg-tk-bg-card py-3 px-4 border-b-0 shadow-[inset_0_-2px_0_0_var(--tk-border)] text-sm font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border w-[17%] shadow-sm"
                  style={{ top: `${stickyHeight}px` }}                >
                  Customer Info
                </th>

                <th
                  className="sticky z-40 bg-tk-bg-card py-3 px-4 border-b-0 shadow-[inset_0_-2px_0_0_var(--tk-border)] border-b-0 shadow-[inset_0_-2px_0_0_var(--tk-border)] text-sm font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border w-[25%] shadow-sm"
                  style={{ top: `${stickyHeight}px` }}                >
                  Payment Info
                </th>

                <th
                  className="sticky z-40 bg-tk-bg-card py-3 px-4 border-b-0 shadow-[inset_0_-2px_0_0_var(--tk-border)] text-sm font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border w-[35%] shadow-sm"
                  style={{ top: `${stickyHeight}px` }}                >
                  Order Tracking
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-tk-text-secondary text-sm">Loading orders...</td>
                </tr>
              ) : filteredOrders().length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-tk-text-secondary">
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
                  <tr key={idx} className="border-b border-tk-border last:border-b-0 hover:bg-tk-burgundy/5 transition-colors group">
                    <td className="py-3 px-4 text-sm text-tk-text-secondary font-medium text-center">{idx + 1}</td>
                    <td className="py-3 px-4 text-sm text-tk-text cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      <div className="flex flex-col">
                        <span className="font-semibold">{order.orderNumber}</span>
                        <span className="text-xs text-tk-text-secondary font-medium mt-0.5">{order.time}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-tk-text cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      <div className="flex flex-col">
                        <span className="font-semibold">{order.customer}</span>
                        <span className="text-xs text-tk-text-secondary font-medium mt-0.5">{order.table}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="text-tk-text font-semibold">₹ {order.total}</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded text-[11px] font-bold ${order.isPaid ? 'bg-[#C6F6D5] text-[#22543D]' : 'bg-[#FEF2F2] text-[#E53E3E]'}`}
                          >
                            {order.isPaid ? `Paid (${order.paymentMethod})` : 'Pending'}
                          </span>
                          {!order.isPaid && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePaymentComplete(order.id);
                              }}
                              className="p-1 bg-[#C6F6D5] text-[#22543D] rounded hover:bg-[#9AE6B4] transition-colors flex items-center justify-center"
                              title="Mark Paid"
                            >
                              <CheckCircle size={12} strokeWidth={3} />
                            </button>
                          )}
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 min-w-full">
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
                  <div key={idx} className="bg-tk-bg-surface border border-tk-border rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-tk-burgundy/50 transition-all cursor-pointer relative group" onClick={() => setSelectedOrder(order)}>
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="font-medium text-tk-text text-xs">{order.orderNumber}</span>
                        <span className="text-[10px] text-tk-text-secondary font-medium mt-0.5">{order.time}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-tk-text text-lg">₹ {order.total}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`inline-flex px-2.5 py-0.5 rounded text-[11px] font-bold ${order.isPaid ? 'bg-[#C6F6D5] text-[#22543D]' : 'bg-[#FEF2F2] text-[#E53E3E]'}`}>
                            {order.isPaid ? `Paid (${order.paymentMethod})` : 'Pending'}
                          </span>
                          {!order.isPaid && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePaymentComplete(order.id); }}
                              className="p-0.5 bg-[#C6F6D5] text-[#22543D] rounded hover:bg-[#9AE6B4] transition-colors flex items-center justify-center"
                              title="Mark Paid"
                            >
                              <CheckCircle size={12} strokeWidth={3} />
                            </button>
                          )}
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
            onMarkReady={(id) => handleUpdateStatus(id, 'READY')}
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