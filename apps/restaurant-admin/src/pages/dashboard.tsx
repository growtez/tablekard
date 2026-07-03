import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, X, CheckCircle, Package, Check, ChevronUp, ChevronDown, Search, ArrowUpDown } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useDashboardOrders, useInvalidateQueries, useRevenueData, useMenuItems } from '../hooks/useSupabaseQuery';
import { updateOrderStatus, updatePaymentStatus } from '../services/supabaseService';
import type { DashboardOrder } from '../services/supabaseService';


interface OrderDetailsDialogProps {
  order: DashboardOrder | null;
  onClose: () => void;
  onMarkReady: (orderId: string) => void;
}


const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({ order, onClose, onMarkReady }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4 animate-[fadeIn_0.2s_ease]" onClick={onClose}>
      <div className="bg-tk-bg-card rounded-[24px] p-5 sm:p-8 max-w-[500px] w-full max-h-[80vh] overflow-auto border-[1.5px] border-tk-border shadow-[0_20px_60px_rgba(0,0,0,0.12)] animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[20px] font-semibold text-tk-text">Order Details</h2>
          <button className="bg-transparent border-none cursor-pointer p-2 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-tk-bg-hover" onClick={onClose}>
            <X size={24} color="#718096" />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex justify-between pb-4 border-b-2 border-tk-border">
            <div className="flex flex-col">
              <div className="text-sm text-tk-text-secondary mb-1">Order ID</div>
              <div className="text-[18px] font-semibold text-tk-text">{order.orderNumber}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-tk-text-secondary mb-1">Status</div>
              <span className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${order.statusColor === 'Ready' || order.statusColor === 'ready' ? 'bg-tk-burgundy text-white' : order.statusColor === 'Preparing' || order.statusColor === 'preparing' ? 'bg-[#FEEA9A] text-[#744210]' : 'bg-[#90CDF4] text-[#2C5282]'}` }>
                {order.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-tk-text-secondary mb-1">Table</div>
              <div className="text-[18px] font-semibold text-tk-text">{order.table}</div>
            </div>
            <div>
              <div className="text-sm text-tk-text-secondary mb-1">Ordered Time</div>
              <div className="text-[18px] font-semibold text-tk-text">{order.time}</div>
            </div>
            <div>
              <div className="text-sm text-tk-text-secondary mb-1">Customer</div>
              <div className="text-[18px] font-semibold text-tk-text">{order.customer}</div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="text-sm text-tk-text-secondary mb-1">Items Ordered</div>
            <div className="flex flex-col gap-3">
              {order.rawItems && order.rawItems.map((item, idx) => (
                <div key={idx} className="flex justify-between p-3 bg-tk-bg-hover rounded-xl">
                  <div>
                    <div className="text-sm font-semibold text-tk-text">{item.name}</div>
                    <div className="text-xs text-tk-text-secondary">Qty: {item.quantity}</div>
                  </div>
                  <div className="text-sm font-semibold text-tk-text">₹{item.price || 0}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t-2 border-tk-border">
            <div className="text-[18px] font-semibold text-tk-text">Total Amount</div>
            <div className="text-[20px] font-bold text-tk-burgundy">₹{order.total}</div>
          </div>

          {order.status !== 'Ready' && order.status !== 'Completed' && (
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="px-3 py-1.5 bg-[#C6F6D5] text-[#22543D] border-none rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 font-['Outfit'] hover:bg-[#68D391] hover:-translate-y-[1px] hover:shadow-[0_4px_8px_rgba(104,211,145,0.4)]"
                onClick={() => {
                  onMarkReady(order.id);
                  onClose();
                }}
                style={{ padding: '12px 32px', fontSize: '14px' }}
              >
                Mark as Ready
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const Dashboard: React.FC = () => {
  const { activeRestaurantId } = useAuth();

  const { data: orders = [], isLoading } = useDashboardOrders(activeRestaurantId);
  useRevenueData(activeRestaurantId);
  const { data: menuItems = [] } = useMenuItems(activeRestaurantId);
  const { invalidateOrders } = useInvalidateQueries();
  
  const outOfStockItems = menuItems.filter(item => !item.available);

  const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<DashboardOrder | null>(null);
  const [activeTab, setActiveTab] = useState<string>('Active Orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_high' | 'amount_low'>('newest');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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

  const handleTableScroll = () => {
    const el = tableScrollRef.current;
    if (!el) return;
    setIsHeaderVisible(el.scrollTop <= 8);
  };

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

  const activeOrders = orders.filter(order => order.status !== 'Completed' && order.status !== 'Cancelled' && (order.status !== 'Ready' || !order.isPaid));
  const completedOrders = orders.filter(order => order.status === 'Completed' || (order.status === 'Ready' && order.isPaid));

  const now = new Date();
  
  const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() && 
    d1.getMonth() === d2.getMonth() && 
    d1.getDate() === d2.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const startOfLastWeek = new Date(startOfThisWeek.getTime() - 7 * 86400000);

  let revenueToday = 0;
  let revenueYesterday = 0;
  let revenueThisWeek = 0;
  let revenueLastWeek = 0;

  orders.forEach(order => {
    if (order.status !== 'Ready' && order.status !== 'Completed' && !order.isPaid) return;

    const orderDate = new Date(order.createdAt);
    
    if (isSameDay(orderDate, now)) {
        revenueToday += order.total;
    } else if (isSameDay(orderDate, yesterday)) {
        revenueYesterday += order.total;
    }

    if (orderDate >= startOfThisWeek) {
        revenueThisWeek += order.total;
    } else if (orderDate >= startOfLastWeek && orderDate < startOfThisWeek) {
        revenueLastWeek += order.total;
    }
  });

  const todayChange = revenueYesterday === 0 ? (revenueToday > 0 ? 100 : 0) : Math.round(((revenueToday - revenueYesterday) / revenueYesterday) * 100);
  const weekChange = revenueLastWeek === 0 ? (revenueThisWeek > 0 ? 100 : 0) : Math.round(((revenueThisWeek - revenueLastWeek) / revenueLastWeek) * 100);

  const tabs = ['Active Orders', 'Completed', 'All Orders'];

  const tabCounts: Record<string, number> = {
    'All Orders': orders.length,
    'Active Orders': activeOrders.length,
    'Completed': completedOrders.length,
  };

  const filteredOrders = () => {
    let result = orders;
    switch (activeTab) {
      case 'Active Orders':
        result = activeOrders;
        break;
      case 'Completed':
        result = completedOrders;
        break;
      case 'All Orders':
      default:
        result = orders;
        break;
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
        .tk-table-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .tk-table-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .tk-table-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(113, 128, 150, 0.32);
          border-radius: 999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .tk-table-scroll::-webkit-scrollbar-thumb:hover {
          background-color: rgba(113, 128, 150, 0.55);
        }
        .tk-table-scroll::-webkit-scrollbar-corner {
          background: transparent;
        }
      `}</style>
      
        <div className="flex-shrink-0">
          <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2 sm:gap-4">
              <h1 className="text-[20px] sm:text-[22px] font-semibold text-tk-text whitespace-nowrap">Dashboard</h1>
              <button 
                onClick={() => setIsHeaderVisible(!isHeaderVisible)}
                className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-tk-bg-hover text-tk-text-secondary hover:text-tk-text transition-all duration-200"
                title="Toggle Header"
              >
                <ChevronUp size={16} className={`transition-transform duration-300 ${!isHeaderVisible ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <div className="text-[13px] sm:text-[14px] font-bold text-tk-burgundy tabular-nums tracking-tight">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <span className="text-tk-text-secondary opacity-50 text-[12px] hidden sm:block">•</span>
              <p className="text-[12px] sm:text-[13px] text-tk-text-secondary font-medium whitespace-nowrap hidden sm:block">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className={`grid transition-all duration-1000 ease-in-out ${isHeaderVisible ? 'grid-rows-[1fr] opacity-100 mb-6 mt-4 sm:mt-0' : 'grid-rows-[0fr] opacity-0 mb-0'}`}>
            <div className="overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-[850px] w-full pt-1">
                {/* Card 1: Revenue Today */}
                <div className="bg-tk-bg-card p-3 sm:p-2.5 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-[11px] sm:text-xs text-tk-text-secondary font-medium">Revenue Today</h3>
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-tk-burgundy-bg flex items-center justify-center text-tk-burgundy">
                      <TrendingUp size={14} />
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="text-[16px] sm:text-[20px] font-bold text-tk-text">₹{isLoading ? '...' : revenueToday.toLocaleString()}</div>
                    <div className={`flex items-center text-[10px] sm:text-[11px] font-medium ${todayChange >= 0 ? 'text-tk-success' : 'text-tk-error'}`}>
                      <TrendingUp size={10} className="mr-1 sm:w-[12px] sm:h-[12px]" style={todayChange < 0 ? { transform: 'rotate(180deg)' } : undefined} />
                      <span>{Math.abs(todayChange)}%</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Revenue This Week */}
                <div className="bg-tk-bg-card p-3 sm:p-2.5 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-[11px] sm:text-xs text-tk-text-secondary font-medium">Revenue This Week</h3>
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-tk-burgundy-bg flex items-center justify-center text-tk-burgundy">
                      <TrendingUp size={14} />
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="text-[16px] sm:text-[20px] font-bold text-tk-text">₹{isLoading ? '...' : revenueThisWeek.toLocaleString()}</div>
                    <div className={`flex items-center text-[10px] sm:text-[11px] font-medium ${weekChange >= 0 ? 'text-tk-success' : 'text-tk-error'}`}>
                      <TrendingUp size={10} className="mr-1 sm:w-[12px] sm:h-[12px]" style={weekChange < 0 ? { transform: 'rotate(180deg)' } : undefined} />
                      <span>{Math.abs(weekChange)}%</span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Out of Stock */}
                <div className="bg-tk-bg-card p-3 sm:p-2.5 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-[11px] sm:text-xs text-tk-text-secondary font-medium">Out of Stock Items</h3>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="text-[16px] sm:text-[20px] font-bold text-tk-text">{isLoading ? '...' : outOfStockItems.length}</div>
                    <div className="flex items-center text-[10px] sm:text-[11px] font-medium text-tk-error">
                      <TrendingUp size={10} className="mr-1 sm:w-[12px] sm:h-[12px]" style={{ transform: 'rotate(180deg)' }} />
                      <span>Need restock</span>
                    </div>
                  </div>
                </div>


                {/* Card 4: Total Orders */}
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

          {/* Tabs & Controls */}
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-2">
            <div className="flex gap-4 sm:gap-8 overflow-x-auto hide-scrollbar pt-1 w-full xl:w-auto flex-1 pb-1">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
                    activeTab === tab 
                      ? 'text-tk-burgundy border-b-2 border-tk-burgundy' 
                      : 'text-tk-text-secondary hover:text-tk-text'
                  }`}
                >
                  {tab} <span className="ml-1 opacity-75">({tabCounts[tab]})</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pb-2 w-full xl:w-auto xl:ml-4">
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
                        className={`w-full text-left px-4 py-3 sm:py-2 text-[14px] sm:text-[13px] font-medium transition-colors ${
                          sortBy === option.value 
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
        </div>

        {/* Table Area */}
        <div
          ref={tableScrollRef}
          onScroll={handleTableScroll}
          className="tk-table-scroll flex-1 min-h-0 overflow-y-auto overflow-x-auto w-full"
        >
          <table className="w-full text-left border-collapse table-fixed min-w-[950px]">
            <thead>
              <tr className="bg-tk-bg-hover">
                <th className="sticky top-0 z-20 bg-tk-bg-hover py-3 px-4 text-sm font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border w-[6%] text-center">Sl No</th>
                <th className="sticky top-0 z-20 bg-tk-bg-hover py-3 px-4 text-sm font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border w-[17%]">Order Details</th>
                <th className="sticky top-0 z-20 bg-tk-bg-hover py-3 px-4 text-sm font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border w-[17%]">Customer Info</th>
                <th className="sticky top-0 z-20 bg-tk-bg-hover py-3 px-4 text-sm font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border w-[25%]">Payment Info</th>
                <th className="sticky top-0 z-20 bg-tk-bg-hover py-3 px-4 text-sm font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border w-[35%]">Order Tracking</th>
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
                  <tr key={idx} className="border-b border-tk-border last:border-b-0 hover:bg-tk-bg-hover transition-colors group">
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
                        <div className="flex-1 flex items-center relative">
                        {[
                          { label: 'Placed', value: 'CONFIRMED' },
                          { label: 'Preparing', value: 'PREPARING' },
                          { label: 'Ready', value: 'READY' }
                        ].map((step, idx, arr) => {
                          const getStatusIdx = (status: string) => {
                            switch(status?.toUpperCase()) {
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
                                  className={`w-6 h-6 rounded-full flex items-center justify-center border-[2px] z-10 transition-colors
                                    ${isCompleted ? 'bg-[#16a34a] border-[#16a34a] text-white' : 
                                      isNext ? 'bg-white border-[#16a34a] cursor-pointer hover:bg-[#16a34a] hover:text-white' : 
                                      'bg-white border-[#E2E8F0] cursor-default'}
                                  `}
                                  title={isNext ? `Mark as ${step.label}` : ''}
                                >
                                  {isCompleted && <Check size={14} className="text-white" strokeWidth={3} />}
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
                        {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
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
                        {order.status === 'CANCELLED' && (
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
      {selectedOrder && (
        <OrderDetailsDialog
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onMarkReady={(id) => handleUpdateStatus(id, 'READY')}
        />
      )}
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

export default Dashboard;