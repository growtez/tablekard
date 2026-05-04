import React, { useState } from 'react';
import { TrendingUp, X, User, Clock } from 'lucide-react';
import './dashboard.css';
import Sidebar from '../components/sidebar';

import { useAuth } from '../context/AuthContext';
import { useDashboardOrders, useInvalidateQueries, useRevenueData, useBestSellingDishes } from '../hooks/useSupabaseQuery';
import { updateOrderStatus, updatePaymentStatus } from '../services/supabaseService';
import type { DashboardOrder } from '../services/supabaseService';


// Component Props Interfaces
interface OrderDetailsDialogProps {
  order: DashboardOrder | null;
  onClose: () => void;
  onMarkServed: (orderId: string) => void;
}

interface AllOrdersDialogProps {
  orders: DashboardOrder[];
  onClose: () => void;
  onSelectOrder: (order: DashboardOrder) => void;
  onMarkServed: (orderId: string) => void;
}

// Order Details Dialog
const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({ order, onClose, onMarkServed }) => {
  if (!order) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2 className="dialog-title">Order Details</h2>
          <button className="dialog-close" onClick={onClose}>
            <X size={24} color="#718096" />
          </button>
        </div>

        <div className="order-details">
          <div className="order-summary">
            <div className="order-id-section">
              <div className="order-label">Order ID</div>
              <div className="order-value">{order.orderNumber}</div>
            </div>
            <div className="order-status-section">
              <div className="order-label">Status</div>
              <span className={`status-pill status-${order.statusColor}`}>
                {order.status}
              </span>
            </div>
          </div>

          <div className="order-info-grid">
            <div>
              <div className="order-label">Table</div>
              <div className="order-value">{order.table}</div>
            </div>
            <div>
              <div className="order-label">Ordered Time</div>
              <div className="order-value">{order.time}</div>
            </div>
            <div>
              <div className="order-label">Customer</div>
              <div className="order-value">{order.customer}</div>
            </div>
          </div>

          <div className="order-items-section">
            <div className="order-label">Items Ordered</div>
            <div className="order-items-list">
              {order.rawItems && order.rawItems.map((item, idx) => (
                <div key={idx} className="order-item">
                  <div>
                    <div className="order-item-name">{item.name}</div>
                    <div className="order-item-qty">Qty: {item.quantity}</div>
                  </div>
                  <div className="order-item-price">₹{item.price || 0}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-total">
            <div className="order-total-label">Total Amount</div>
            <div className="order-total-amount">₹{order.total}</div>
          </div>

          {order.status !== 'Served' && order.status !== 'Completed' && (
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="served-action-btn"
                onClick={() => {
                  onMarkServed(order.id);
                  onClose();
                }}
                style={{ padding: '12px 32px', fontSize: '14px' }}
              >
                Mark as Served
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// All Orders Dialog
const AllOrdersDialog: React.FC<AllOrdersDialogProps & { showAction?: boolean }> = ({ orders, onClose, onSelectOrder, onMarkServed, showAction = true }) => {
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content chart-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2 className="dialog-title">All Orders</h2>
          <button className="dialog-close" onClick={onClose}>
            <X size={24} color="#718096" />
          </button>
        </div>

        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Table</th>
              <th>Ordered Time</th>
              <th>Status</th>
              <th>Customer</th>
              {showAction && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => (
              <tr key={idx}>
                <td onClick={() => {
                  onClose();
                  onSelectOrder(order);
                }} style={{ cursor: 'pointer' }}>
                  {order.orderNumber}
                </td>
                <td onClick={() => {
                  onClose();
                  onSelectOrder(order);
                }} style={{ cursor: 'pointer' }}>
                  {order.table}
                </td>
                <td onClick={() => {
                  onClose();
                  onSelectOrder(order);
                }} style={{ cursor: 'pointer' }}>
                  {order.time}
                </td>
                <td onClick={() => {
                  onClose();
                  onSelectOrder(order);
                }} style={{ cursor: 'pointer' }}>
                  <span className={`status-pill status-${order.statusColor}`}>
                    {order.status}
                  </span>
                </td>
                <td onClick={() => {
                  onClose();
                  onSelectOrder(order);
                }} style={{ cursor: 'pointer' }}>
                  {order.customer}
                </td>
                {showAction && (
                  <td>
                    {order.status !== 'Served' && order.status !== 'Completed' ? (
                      <button
                        className="served-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkServed(order.id);
                        }}
                      >
                        Mark Served
                      </button>
                    ) : (
                      <span style={{ color: '#68D391', fontSize: '13px' }}>✓ Completed</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
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
  const { data: bestSelling = [], isLoading: loadingBestSelling } = useBestSellingDishes(activeRestaurantId);
  const { invalidateOrders } = useInvalidateQueries();

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

  const handleMarkServed = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'SERVED');
      if (activeRestaurantId) invalidateOrders(activeRestaurantId);
    } catch (err) {
      console.error(err);
      alert('Failed to mark order as served');
    }
  };

  // Filter orders
  const activeOrders = orders.filter(order => order.status !== 'Served' && order.status !== 'Completed' && order.status !== 'Cancelled');
  const completedOrders = orders.filter(order => order.status === 'Served' || order.status === 'Completed');
  const pendingPayments = orders.filter(order => !order.isPaid && order.status !== 'Cancelled');

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
    if (order.status !== 'Served' && order.status !== 'Completed' && !order.isPaid) return;

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



  const totalPending: number = pendingPayments.reduce((sum, payment) => sum + payment.total, 0);

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="main-content">
        <div className="header">
          <h1 className="page-title">Dashboard</h1>
        </div>

        <div className="revenue-grid">
          <div className="revenue-card">
            <div className="card-top-bar card-top-bar-green"></div>
            <h3 className="card-title">Revenue Today</h3>
            <div className="revenue-amount">₹ {isLoading ? '...' : revenueToday.toLocaleString()}</div>
            <div className="revenue-change">
              <span className={`change-text ${todayChange >= 0 ? 'change-positive' : 'change-negative'}`} style={{ color: todayChange < 0 ? '#E53E3E' : undefined }}>
                {todayChange > 0 ? '+' : ''}{todayChange}% vs yesterday
              </span>
              <TrendingUp size={16} color={todayChange >= 0 ? "#68D391" : "#E53E3E"} className="trend-icon" style={todayChange < 0 ? { transform: 'rotate(180deg)' } : undefined} />
            </div>
          </div>

          <div className="revenue-card">
            <div className="card-top-bar card-top-bar-blue"></div>
            <h3 className="card-title">Revenue This Week</h3>
            <div className="revenue-amount">₹ {isLoading ? '...' : revenueThisWeek.toLocaleString()}</div>
            <div className="revenue-change">
              <span className={`change-text ${weekChange >= 0 ? 'change-blue' : 'change-negative'}`} style={{ color: weekChange < 0 ? '#E53E3E' : undefined }}>
                {weekChange > 0 ? '+' : ''}{weekChange}% vs last week
              </span>
              <TrendingUp size={16} color={weekChange >= 0 ? "#7F9CF5" : "#E53E3E"} className="trend-icon" style={weekChange < 0 ? { transform: 'rotate(180deg)' } : undefined} />
            </div>
          </div>
        </div>

        <div className="content-grid">
          <div>
            <div className="table-card">
              <div className="table-header">
                <h2 className="table-title">Active Orders</h2>
                <button className="view-all-btn" onClick={() => setShowAllOrders(true)}>View All</button>
              </div>
              <div className="table-wrapper">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Table</th>
                      <th>Ordered Time</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#A0AEC0' }}>Loading active orders...</td></tr>
                    ) : activeOrders.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#A0AEC0' }}>No active orders</td></tr>
                    ) : activeOrders.slice(0, 5).map((order, idx) => (
                      <tr key={idx}>
                        <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
                          {order.orderNumber}
                        </td>
                        <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
                          {order.table}
                        </td>
                        <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
                          {order.time}
                        </td>
                        <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
                          <span className={`status-pill status-${order.statusColor}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="served-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkServed(order.id);
                            }}
                          >
                            Mark Served
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="table-card" style={{ marginTop: '24px' }}>
              <div className="table-header">
                <h2 className="table-title">Completed Orders</h2>
                <button className="view-all-btn" onClick={() => setShowAllCompleted(true)}>View All</button>
              </div>
              <div className="table-wrapper">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Table</th>
                      <th>Ordered Time</th>
                      <th>Status</th>
                      <th>Customer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#A0AEC0' }}>Loading completed orders...</td></tr>
                    ) : completedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#A0AEC0' }}>
                          No completed orders yet
                        </td>
                      </tr>
                    ) : (
                      completedOrders.slice(0, 5).map((order, idx) => (
                        <tr key={idx}>
                          <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
                            {order.orderNumber}
                          </td>
                          <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
                            {order.table}
                          </td>
                          <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
                            {order.time}
                          </td>
                          <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
                            <span className={`status-pill status-${order.statusColor}`}>
                              {order.status}
                            </span>
                          </td>
                          <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
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

          <div className="right-sidebar">
            <div className="widget-card">
              <h3 className="widget-title">🔥 Best-Selling Dishes</h3>
              <div className="dish-list">
                {loadingBestSelling ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: '#A0AEC0', fontSize: '13px' }}>Loading...</div>
                ) : bestSelling.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: '#A0AEC0', fontSize: '13px' }}>No data available</div>
                ) : bestSelling.map((dish, idx) => (
                  <div key={idx} className="dish-item">
                    <div className="dish-image">{dish.image}</div>
                    <div className="dish-info">
                      <div className="dish-name">{dish.name}</div>
                      <div className="dish-stats">
                        <span className="dish-sold">{dish.sold} sold</span>
                        <span className="dish-trend">{dish.trend}</span>
                      </div>
                    </div>
                    <div className="dish-revenue">
                      <div className="dish-revenue-amount">₹{dish.revenue.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="widget-card">
              <h3 className="widget-title">⚠️ Pending Payments</h3>
              <div className="pending-payments-list">
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: '#A0AEC0', fontSize: '13px' }}>Loading...</div>
                ) : pendingPayments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: '#A0AEC0', fontSize: '13px' }}>No pending payments</div>
                ) : pendingPayments.map((payment) => (
                  <div key={payment.id} className="payment-item">
                    <div className="payment-info">
                      <div className="payment-table">{payment.table}</div>
                      <div className="payment-customer">
                        <User size={12} color="#718096" />
                        <span className="payment-customer-name">{payment.customer}</span>
                      </div>
                      <div className="payment-time">
                        <Clock size={11} color="#A0AEC0" />
                        <span className="payment-time-text">{payment.time}</span>
                      </div>
                    </div>
                    <div className="payment-action">
                      <div className="payment-amount">₹{payment.total}</div>
                      <button
                        className="mark-paid-btn"
                        onClick={() => handlePaymentComplete(payment.id)}
                      >
                        Mark Paid
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="payment-total">
                <span className="payment-total-label">Total Pending</span>
                <span className="payment-total-amount">₹{totalPending.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailsDialog
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onMarkServed={handleMarkServed}
        />
      )}

      {showAllOrders && (
        <AllOrdersDialog
          orders={activeOrders}
          onClose={() => setShowAllOrders(false)}
          onSelectOrder={setSelectedOrder}
          onMarkServed={handleMarkServed}
          showAction={true}
        />
      )}

      {showAllCompleted && (
        <AllOrdersDialog
          orders={completedOrders}
          onClose={() => setShowAllCompleted(false)}
          onSelectOrder={setSelectedOrder}
          onMarkServed={() => { }}
          showAction={false}
        />
      )}
    </div>
  );
};

export default Dashboard;