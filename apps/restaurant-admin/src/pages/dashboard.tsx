import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, X, CheckCircle, Package, MoreVertical, CheckSquare } from 'lucide-react';

import Sidebar from '../components/sidebar';

import { useAuth } from '../context/AuthContext';
import { useDashboardOrders, useInvalidateQueries, useRevenueData, useMenuItems } from '../hooks/useSupabaseQuery';
import { updateOrderStatus, updatePaymentStatus } from '../services/supabaseService';
import type { DashboardOrder } from '../services/supabaseService';


// Component Props Interfaces
interface OrderDetailsDialogProps {
  order: DashboardOrder | null;
  onClose: () => void;
  onMarkReady: (orderId: string) => void;
}

interface AllOrdersDialogProps {
  orders: DashboardOrder[];
  onClose: () => void;
  onSelectOrder: (order: DashboardOrder) => void;
  onMarkReady: (orderId: string) => void;
  onMarkPaid: (orderId: string) => void;
}

// Order Details Dialog
const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({ order, onClose, onMarkReady }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] animate-[fadeIn_0.2s_ease]" onClick={onClose}>
      <div className="bg-tk-bg-card rounded-[24px] p-8 max-w-[500px] w-[90%] max-h-[80vh] overflow-auto border-[1.5px] border-tk-border shadow-[0_20px_60px_rgba(0,0,0,0.12)] animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
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

          <div className="grid grid-cols-2 gap-4">
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

const AllOrdersDialog: React.FC<AllOrdersDialogProps & { showAction?: boolean }> = ({ orders, onClose, onSelectOrder, onMarkReady, onMarkPaid, showAction = true }) => {
  const [visibleCount, setVisibleCount] = useState(20);
  const loadMoreRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleCount < orders.length) {
        setVisibleCount(prev => prev + 20);
      }
    }, { rootMargin: '200px' });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [visibleCount, orders.length]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] animate-[fadeIn_0.2s_ease]" onClick={onClose}>
      <div className="bg-tk-bg-card rounded-[24px] p-8 max-w-[800px] w-[90%] max-h-[80vh] overflow-auto border-[1.5px] border-tk-border shadow-[0_20px_60px_rgba(0,0,0,0.12)] animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[20px] font-semibold text-tk-text">All Orders</h2>
          <button className="bg-transparent border-none cursor-pointer p-2 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-tk-bg-hover" onClick={onClose}>
            <X size={24} color="#718096" />
          </button>
        </div>

        <table className="w-full border-separate [border-spacing:0_8px]">
          <thead>
            <tr className="transition-colors duration-200 hover:bg-tk-bg-hover group">
              <th className="text-left p-4 text-sm font-semibold text-tk-text-secondary border-b-2 border-tk-border whitespace-nowrap">Order ID</th>
              <th className="text-left p-4 text-sm font-semibold text-tk-text-secondary border-b-2 border-tk-border whitespace-nowrap">Table</th>
              <th className="text-left p-4 text-sm font-semibold text-tk-text-secondary border-b-2 border-tk-border whitespace-nowrap">Ordered Time</th>
              <th className="text-left p-4 text-sm font-semibold text-tk-text-secondary border-b-2 border-tk-border whitespace-nowrap">Status</th>
              <th className="text-left p-4 text-sm font-semibold text-tk-text-secondary border-b-2 border-tk-border whitespace-nowrap">Payment</th>
              <th className="text-left p-4 text-sm font-semibold text-tk-text-secondary border-b-2 border-tk-border whitespace-nowrap">Customer</th>
              {showAction && <th className="text-left p-4 text-sm font-semibold text-tk-text-secondary border-b-2 border-tk-border whitespace-nowrap">Action</th>}
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, visibleCount).map((order, idx) => (
              <tr key={idx} className="transition-colors duration-200 hover:bg-tk-bg-hover group">
                <td className="p-4 text-sm text-tk-text" onClick={() => {
                  onClose();
                  onSelectOrder(order);
                }} style={{ cursor: 'pointer' }}>
                  {order.orderNumber}
                </td>
                <td className="p-4 text-sm text-tk-text" onClick={() => {
                  onClose();
                  onSelectOrder(order);
                }} style={{ cursor: 'pointer' }}>
                  {order.table}
                </td>
                <td className="p-4 text-sm text-tk-text" onClick={() => {
                  onClose();
                  onSelectOrder(order);
                }} style={{ cursor: 'pointer' }}>
                  {order.time}
                </td>
                <td className="p-4 text-sm text-tk-text" onClick={() => {
                  onClose();
                  onSelectOrder(order);
                }} style={{ cursor: 'pointer' }}>
                  <span className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${order.statusColor === 'Ready' || order.statusColor === 'ready' ? 'bg-tk-burgundy text-white' : order.statusColor === 'Preparing' || order.statusColor === 'preparing' ? 'bg-[#FEEA9A] text-[#744210]' : 'bg-[#90CDF4] text-[#2C5282]'}` }>
                    {order.status}
                  </span>
                </td>
                <td className="p-4 text-sm text-tk-text" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span 
                      className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${order.isPaid ? 'bg-[#C6F6D5] text-[#22543D]' : 'bg-[#FEF2F2] text-[#EF4444]'}` } 
                      onClick={() => {
                        onClose();
                        onSelectOrder(order);
                      }}
                    >
                      {order.isPaid ? 'Paid' : 'Pending'}
                    </span>
                    {!order.isPaid && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkPaid(order.id);
                        }}
                        className="p-1.5 bg-[#C6F6D5] text-[#22543D] border-none rounded-lg cursor-pointer transition-all duration-200 hover:bg-[#68D391] hover:-translate-y-[1px] hover:shadow-[0_4px_8px_rgba(104,211,145,0.4)] flex items-center justify-center"
                        title="Mark Paid"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                  </div>
                </td>
                <td className="p-4 text-sm text-tk-text" onClick={() => {
                  onClose();
                  onSelectOrder(order);
                }} style={{ cursor: 'pointer' }}>
                  {order.customer}
                </td>
                {showAction && (
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {order.status !== 'Ready' && order.status !== 'Completed' && (
                        <button
                          className="px-3 py-1.5 bg-[#C6F6D5] text-[#22543D] border-none rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 font-['Outfit'] hover:bg-[#68D391] hover:-translate-y-[1px] hover:shadow-[0_4px_8px_rgba(104,211,145,0.4)]"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkReady(order.id);
                          }}
                        >
                          Mark Ready
                        </button>
                      )}
                      {order.status === 'Completed' || (order.status === 'Ready' && order.isPaid) ? (
                        <span style={{ color: '#68D391', fontSize: '13px' }}>✓ Completed</span>
                      ) : null}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {visibleCount < orders.length && (
              <tr ref={loadMoreRef}>
                <td className="p-4 text-sm text-tk-text" colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#718096', fontSize: '13px', fontFamily: "'Outfit', sans-serif" }}>
                  Loading more orders...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard: React.FC = () => {
  const { activeRestaurantId } = useAuth();

  // React Query cached orders
  const { data: orders = [], isLoading } = useDashboardOrders(activeRestaurantId);
  useRevenueData(activeRestaurantId);
  const { data: menuItems = [] } = useMenuItems(activeRestaurantId);
  const { invalidateOrders } = useInvalidateQueries();
  
  const outOfStockItems = menuItems.filter(item => !item.available);

  const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(null);
  const [activeTab, setActiveTab] = useState<string>('Active Orders');

  const handlePaymentComplete = async (paymentId: string) => {
    try {
      await updatePaymentStatus(paymentId, 'paid');
      if (activeRestaurantId) invalidateOrders(activeRestaurantId);
    } catch (err) {
      console.error(err);
      alert('Failed to update payment status');
    }
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'READY');
      if (activeRestaurantId) invalidateOrders(activeRestaurantId);
    } catch (err) {
      console.error(err);
      alert('Failed to mark order as ready');
    }
  };

  // Filter orders
  const activeOrders = orders.filter(order => order.status !== 'Completed' && order.status !== 'Cancelled' && (order.status !== 'Ready' || !order.isPaid));
  const completedOrders = orders.filter(order => order.status === 'Completed' || (order.status === 'Ready' && order.isPaid));

  // Revenue calc from raw orders (more robust and uses local timezone)
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
    switch (activeTab) {
      case 'Active Orders':
        return activeOrders;
      case 'Completed':
        return completedOrders;
      case 'All Orders':
      default:
        return orders;
    }
  };

  return (
    <div className="flex min-h-screen bg-tk-bg relative">
      <Sidebar />

      <div className="tk-main-content flex-1 p-8 overflow-y-auto min-h-screen transition-all duration-300 ml-[240px] max-md:!ml-0 max-md:!p-4 max-md:!pt-[72px] bg-tk-bg-surface">
        <div className="flex items-center justify-between mb-8 gap-8 max-xl:flex-col max-xl:items-start max-xl:gap-6">
          <h1 className="text-[22px] font-semibold text-tk-text whitespace-nowrap">Dashboard</h1>

          <div className="grid grid-cols-4 gap-4 max-w-[850px] w-full max-xl:grid-cols-2 max-lg:grid-cols-2 max-md:grid-cols-1">
            {/* Card 1: Active Orders */}
            <div className="bg-tk-bg-card p-3 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xs text-tk-text-secondary font-medium">Active Orders</h3>
                <div className="w-7 h-7 rounded-full bg-tk-burgundy-bg flex items-center justify-center text-tk-burgundy">
                  <CheckSquare size={14} />
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div className="text-[20px] font-bold text-tk-text">{isLoading ? '...' : activeOrders.length}</div>
                <div className="flex items-center text-[11px] font-medium text-tk-success">
                  <TrendingUp size={12} className="mr-1" />
                  <span>On time</span>
                </div>
              </div>
            </div>

            {/* Card 2: Revenue Today */}
            <div className="bg-tk-bg-card p-3 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xs text-tk-text-secondary font-medium">Revenue Today</h3>
                <div className="w-7 h-7 rounded-full bg-tk-burgundy-bg flex items-center justify-center text-tk-burgundy">
                  <TrendingUp size={14} />
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div className="text-[20px] font-bold text-tk-text">₹{isLoading ? '...' : revenueToday.toLocaleString()}</div>
                <div className={`flex items-center text-[11px] font-medium ${todayChange >= 0 ? 'text-tk-success' : 'text-tk-error'}`}>
                  <TrendingUp size={12} className="mr-1" style={todayChange < 0 ? { transform: 'rotate(180deg)' } : undefined} />
                  <span>{Math.abs(todayChange)}%</span>
                </div>
              </div>
            </div>

            {/* Card 3: Revenue This Week */}
            <div className="bg-tk-bg-card p-3 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xs text-tk-text-secondary font-medium">Revenue This Week</h3>
                <div className="w-7 h-7 rounded-full bg-tk-burgundy-bg flex items-center justify-center text-tk-burgundy">
                  <TrendingUp size={14} />
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div className="text-[20px] font-bold text-tk-text">₹{isLoading ? '...' : revenueThisWeek.toLocaleString()}</div>
                <div className={`flex items-center text-[11px] font-medium ${weekChange >= 0 ? 'text-tk-success' : 'text-tk-error'}`}>
                  <TrendingUp size={12} className="mr-1" style={weekChange < 0 ? { transform: 'rotate(180deg)' } : undefined} />
                  <span>{Math.abs(weekChange)}%</span>
                </div>
              </div>
            </div>

            {/* Card 4: Out of Stock */}
            <div className="bg-tk-bg-card p-3 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xs text-tk-text-secondary font-medium">Out of Stock Items</h3>
                <div className="w-7 h-7 rounded-full bg-tk-burgundy-bg flex items-center justify-center text-tk-burgundy">
                  <X size={14} />
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div className="text-[20px] font-bold text-tk-text">{isLoading ? '...' : outOfStockItems.length}</div>
                <div className="flex items-center text-[11px] font-medium text-tk-error">
                  <TrendingUp size={12} className="mr-1" style={{ transform: 'rotate(180deg)' }} />
                  <span>Need restock</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-tk-border mb-6 gap-8 overflow-x-auto hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
                activeTab === tab 
                  ? 'text-tk-burgundy border-b-2 border-tk-burgundy' 
                  : 'text-tk-text-secondary hover:text-tk-text'
              }`}
            >
              {tab} <span className="ml-1 opacity-75">({tabCounts[tab]})</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-tk-bg-card rounded-[12px] border-[1.5px] border-tk-border overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-tk-bg-hover">
                <th className="py-4 px-6 text-sm font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border">Order ID</th>
                <th className="py-4 px-6 text-sm font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border">Table</th>
                <th className="py-4 px-6 text-sm font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border">Date & Time</th>
                <th className="py-4 px-6 text-sm font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border">Amount</th>
                <th className="py-4 px-6 text-sm font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border">Payment</th>
                <th className="py-4 px-6 text-sm font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border">Customer</th>
                <th className="py-4 px-6 text-sm font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border">Status</th>
                <th className="py-4 px-6 text-sm font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-tk-text-secondary text-sm">Loading orders...</td>
                </tr>
              ) : filteredOrders().length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-tk-text-secondary text-sm">No orders found for this category.</td>
                </tr>
              ) : (
                filteredOrders().map((order, idx) => (
                  <tr key={idx} className="border-b border-tk-border last:border-b-0 hover:bg-tk-bg-hover transition-colors group">
                    <td className="py-4 px-6 text-sm text-tk-text font-medium cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      {order.orderNumber}
                    </td>
                    <td className="py-4 px-6 text-sm text-tk-text cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      {order.table}
                    </td>
                    <td className="py-4 px-6 text-sm text-tk-text cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      {order.time}
                    </td>
                    <td className="py-4 px-6 text-sm text-tk-text font-medium cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      ₹ {order.total}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span 
                          className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${order.isPaid ? 'bg-[#C6F6D5] text-[#22543D]' : 'bg-[#FEF2F2] text-[#E53E3E]'}`}
                          onClick={() => setSelectedOrder(order)}
                        >
                          {order.isPaid ? 'Paid' : 'Pending'}
                        </span>
                        {!order.isPaid && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePaymentComplete(order.id);
                            }}
                            className="p-1.5 bg-[#C6F6D5] text-[#22543D] rounded-md hover:bg-[#9AE6B4] transition-colors"
                            title="Mark Paid"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-tk-text cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      {order.customer}
                    </td>
                    <td className="py-4 px-6 text-sm cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                        order.statusColor === 'Ready' || order.statusColor === 'ready' 
                          ? 'bg-tk-burgundy text-white' 
                          : order.statusColor === 'Preparing' || order.statusColor === 'preparing' 
                            ? 'bg-[#FEEA9A] text-[#744210]' 
                            : 'bg-[#90CDF4] text-[#2C5282]'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex gap-2 items-center">
                        {order.status !== 'Ready' && order.status !== 'Completed' && order.status !== 'Cancelled' && (
                          <button
                            className="px-3 py-1.5 bg-tk-burgundy text-white rounded-md text-xs font-semibold hover:bg-tk-burgundy-dark transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkReady(order.id);
                            }}
                          >
                            Ready
                          </button>
                        )}
                        <button className="p-1 text-tk-text-secondary hover:text-tk-text transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailsDialog
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onMarkReady={handleMarkReady}
        />
      )}
    </div>
  );
};

export default Dashboard;