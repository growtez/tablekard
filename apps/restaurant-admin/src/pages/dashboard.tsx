import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, X, CheckCircle } from 'lucide-react';

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
  const [showAllOrders, setShowAllOrders] = useState<boolean>(false);
  const [showAllCompleted, setShowAllCompleted] = useState<boolean>(false);

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




  return (
    <div className="flex min-h-screen bg-tk-bg relative">
      <Sidebar />

      <div className="flex-1 p-5 overflow-y-auto min-h-screen transition-all duration-300 ml-[240px] [.sidebar-collapsed_&]:ml-[80px] max-md:!ml-0 max-md:!p-4 max-md:!pt-[72px] bg-tk-bg-surface">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-tk-text">Dashboard</h1>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8 max-md:grid-cols-1 max-lg:grid-cols-2">
          <div className="bg-tk-bg-card p-3 rounded-[20px] border-[1.5px] border-tk-border relative overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#8B3A1E] to-[#D4816B]"></div>
            <h3 className="text-sm text-tk-text-secondary mb-3 font-medium mt-1">Revenue Today</h3>
            <div className="text-[28px] font-bold text-tk-text mb-3">₹ {isLoading ? '...' : revenueToday.toLocaleString()}</div>
            <div className="flex items-center text-[13px] mb-1">
              <span className={`text-[12px] font-medium ${todayChange >= 0 ? 'text-[#68D391]' : 'text-[#E53E3E]'}` } style={{ color: todayChange < 0 ? '#E53E3E' : undefined }}>
                {todayChange > 0 ? '+' : ''}{todayChange}% vs yesterday
              </span>
              <TrendingUp size={16} color={todayChange >= 0 ? "#68D391" : "#E53E3E"} className="ml-auto" style={todayChange < 0 ? { transform: 'rotate(180deg)' } : undefined} />
            </div>
          </div>

          <div className="bg-tk-bg-card p-3 rounded-[20px] border-[1.5px] border-tk-border relative overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] max-lg:hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#5C7A7A] to-[#8AABAB]"></div>
            <h3 className="text-sm text-tk-text-secondary mb-3 font-medium mt-1">Revenue This Week</h3>
            <div className="text-[28px] font-bold text-tk-text mb-3">₹ {isLoading ? '...' : revenueThisWeek.toLocaleString()}</div>
            <div className="flex items-center text-[13px] mb-1">
              <span className={`text-[12px] font-medium ${weekChange >= 0 ? 'text-[#7F9CF5]' : 'text-[#E53E3E]'}` } style={{ color: weekChange < 0 ? '#E53E3E' : undefined }}>
                {weekChange > 0 ? '+' : ''}{weekChange}% vs last week
              </span>
              <TrendingUp size={16} color={weekChange >= 0 ? "#7F9CF5" : "#E53E3E"} className="ml-auto" style={weekChange < 0 ? { transform: 'rotate(180deg)' } : undefined} />
            </div>
          </div>
          <div className="bg-tk-bg-card p-3 rounded-[20px] border-[1.5px] border-tk-border relative overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] max-md:hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#E53E3E] to-[#FC8181]" style={{ background: 'linear-gradient(to right, #E53E3E, #FC8181)' }}></div>
            <h3 className="text-sm text-tk-text-secondary mb-3 font-medium mt-1">Out of Stock Items</h3>
            <div className="text-[28px] font-bold text-tk-text mb-3" style={{ color: outOfStockItems.length > 0 ? '#E53E3E' : 'var(--tk-text)' }}>
              {isLoading ? '...' : outOfStockItems.length}
            </div>
            <div className="flex items-center text-[13px] mb-1">
              <span className="text-[12px] font-medium" style={{ color: 'var(--tk-text-muted)' }}>
                Need restocking
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <div className="bg-tk-bg-card p-3 rounded-[20px] border-[1.5px] border-tk-border">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[18px] font-semibold text-tk-text">Active Orders</h2>
                <button className="px-4 py-2 bg-tk-burgundy text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 font-['Outfit'] shadow-[0_4px_12px_rgba(139,58,30,0.2)] hover:-translate-y-0.5 hover:bg-tk-burgundy-dark hover:shadow-[0_6px_20px_rgba(139,58,30,0.3)]" onClick={() => setShowAllOrders(true)}>View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-separate [border-spacing:0_8px]">
                  <thead>
                    <tr className="transition-colors duration-200 hover:bg-tk-bg-hover group">
                      <th className="text-left p-4 text-sm font-semibold text-tk-text-secondary border-b-2 border-tk-border whitespace-nowrap">Order ID</th>
                      <th className="text-left p-4 text-sm font-semibold text-tk-text-secondary border-b-2 border-tk-border whitespace-nowrap">Table</th>
                      <th className="text-left p-4 text-sm font-semibold text-tk-text-secondary border-b-2 border-tk-border whitespace-nowrap">Ordered Time</th>
                      <th className="text-left p-4 text-sm font-semibold text-tk-text-secondary border-b-2 border-tk-border whitespace-nowrap">Status</th>
                      <th className="text-left p-4 text-sm font-semibold text-tk-text-secondary border-b-2 border-tk-border whitespace-nowrap">Payment</th>
                      <th className="text-left p-4 text-sm font-semibold text-tk-text-secondary border-b-2 border-tk-border whitespace-nowrap">Customer</th>
                      <th className="text-left p-4 text-sm font-semibold text-tk-text-secondary border-b-2 border-tk-border whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr className="transition-colors duration-200 hover:bg-tk-bg-hover group"><td className="p-4 text-sm text-tk-text" colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#A0AEC0' }}>Loading active orders...</td></tr>
                    ) : activeOrders.length === 0 ? (
                      <tr className="transition-colors duration-200 hover:bg-tk-bg-hover group"><td className="p-4 text-sm text-tk-text" colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#A0AEC0' }}>No active orders</td></tr>
                    ) : activeOrders.slice(0, 5).map((order, idx) => (
                      <tr key={idx} className="transition-colors duration-200 hover:bg-tk-bg-hover group">
                        <td className="p-4 text-sm text-tk-text" onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }} data-label="Order ID">
                          {order.orderNumber}
                        </td>
                        <td className="p-4 text-sm text-tk-text" onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }} data-label="Table">
                          {order.table}
                        </td>
                        <td className="p-4 text-sm text-tk-text" onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }} data-label="Ordered Time">
                          {order.time}
                        </td>
                        <td className="p-4 text-sm text-tk-text" onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }} data-label="Status">
                          <span className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${order.statusColor === 'Ready' || order.statusColor === 'ready' ? 'bg-tk-burgundy text-white' : order.statusColor === 'Preparing' || order.statusColor === 'preparing' ? 'bg-[#FEEA9A] text-[#744210]' : 'bg-[#90CDF4] text-[#2C5282]'}` }>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-tk-text" style={{ cursor: 'pointer' }} data-label="Payment">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span 
                              className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${order.isPaid ? 'bg-[#C6F6D5] text-[#22543D]' : 'bg-[#FEF2F2] text-[#EF4444]'}` } 
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
                                className="p-1.5 bg-[#C6F6D5] text-[#22543D] border-none rounded-lg cursor-pointer transition-all duration-200 hover:bg-[#68D391] hover:-translate-y-[1px] hover:shadow-[0_4px_8px_rgba(104,211,145,0.4)] flex items-center justify-center"
                                title="Mark Paid"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-tk-text" onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }} data-label="Customer">
                          {order.customer}
                        </td>
                        <td className="p-4 text-sm text-tk-text" data-label="Action">
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {order.status !== 'Ready' && (
                              <button
                                className="px-3 py-1.5 bg-[#C6F6D5] text-[#22543D] border-none rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 font-['Outfit'] hover:bg-[#68D391] hover:-translate-y-[1px] hover:shadow-[0_4px_8px_rgba(104,211,145,0.4)]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkReady(order.id);
                                }}
                              >
                                Ready
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-tk-bg-card p-3 rounded-[16px] border-[1.5px] border-tk-border mt-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-[16px] font-semibold text-tk-text">Completed Orders</h2>
                <button className="px-3 py-1.5 bg-tk-burgundy text-white border-none rounded-md text-xs font-semibold cursor-pointer transition-all duration-300 font-['Outfit'] shadow-[0_4px_12px_rgba(139,58,30,0.2)] hover:-translate-y-0.5 hover:bg-tk-burgundy-dark hover:shadow-[0_6px_20px_rgba(139,58,30,0.3)]" onClick={() => setShowAllCompleted(true)}>View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-separate [border-spacing:0_4px]">
                  <thead>
                    <tr className="transition-colors duration-200 hover:bg-tk-bg-hover group">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-tk-text-secondary border-b border-tk-border whitespace-nowrap">Order ID</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-tk-text-secondary border-b border-tk-border whitespace-nowrap">Table</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-tk-text-secondary border-b border-tk-border whitespace-nowrap">Ordered Time</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-tk-text-secondary border-b border-tk-border whitespace-nowrap">Status</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-tk-text-secondary border-b border-tk-border whitespace-nowrap">Payment</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-tk-text-secondary border-b border-tk-border whitespace-nowrap">Customer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr className="transition-colors duration-200 hover:bg-tk-bg-hover group"><td className="px-3 py-2 text-xs text-tk-text" colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#A0AEC0' }}>Loading completed orders...</td></tr>
                    ) : completedOrders.length === 0 ? (
                      <tr className="transition-colors duration-200 hover:bg-tk-bg-hover group">
                        <td className="px-3 py-2 text-xs text-tk-text" colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#A0AEC0' }}>
                          No completed orders yet
                        </td>
                      </tr>
                    ) : (
                      completedOrders.slice(0, 5).map((order, idx) => (
                        <tr key={idx} className="transition-colors duration-200 hover:bg-tk-bg-hover group">
                          <td className="px-3 py-2 text-xs text-tk-text" onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }} data-label="Order ID">
                            {order.orderNumber}
                          </td>
                          <td className="px-3 py-2 text-xs text-tk-text" onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }} data-label="Table">
                            {order.table}
                          </td>
                          <td className="px-3 py-2 text-xs text-tk-text" onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }} data-label="Ordered Time">
                            {order.time}
                          </td>
                          <td className="px-3 py-2 text-xs text-tk-text" onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }} data-label="Status">
                            <span className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${order.statusColor === 'Ready' || order.statusColor === 'ready' ? 'bg-tk-burgundy text-white' : order.statusColor === 'Preparing' || order.statusColor === 'preparing' ? 'bg-[#FEEA9A] text-[#744210]' : 'bg-[#90CDF4] text-[#2C5282]'}` }>
                              {order.status}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-tk-text" style={{ cursor: 'pointer' }} data-label="Payment">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span 
                                className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${order.isPaid ? 'bg-[#C6F6D5] text-[#22543D]' : 'bg-[#FEF2F2] text-[#EF4444]'}` } 
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
                                  className="p-1.5 bg-[#C6F6D5] text-[#22543D] border-none rounded-lg cursor-pointer transition-all duration-200 hover:bg-[#68D391] hover:-translate-y-[1px] hover:shadow-[0_4px_8px_rgba(104,211,145,0.4)] flex items-center justify-center"
                                  title="Mark Paid"
                                >
                                  <CheckCircle size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-tk-text" onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }} data-label="Customer">
                            {order.customer}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>


      {selectedOrder && (
        <OrderDetailsDialog
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onMarkReady={handleMarkReady}
        />
      )}

      {showAllOrders && (
        <AllOrdersDialog
          orders={activeOrders}
          onClose={() => setShowAllOrders(false)}
          onSelectOrder={setSelectedOrder}
          onMarkReady={handleMarkReady}
          onMarkPaid={handlePaymentComplete}
          showAction={true}
        />
      )}

      {showAllCompleted && (
        <AllOrdersDialog
          orders={completedOrders}
          onClose={() => setShowAllCompleted(false)}
          onSelectOrder={setSelectedOrder}
          onMarkReady={() => { }}
          onMarkPaid={() => { }}
          showAction={false}
        />
      )}
    </div>
  );
};

export default Dashboard;