import React, { useState } from 'react';
import { TrendingUp, X, User, Clock, CheckCircle } from 'lucide-react';
import './dashboard.css';
import Sidebar from '../components/sidebar';

import { useAuth } from '../context/AuthContext';
import { useDashboardOrders, useInvalidateQueries, useRevenueData } from '../hooks/useSupabaseQuery';
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

          {order.status !== 'Ready' && order.status !== 'Completed' && (
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="ready-action-btn"
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

// All Orders Dialog
const AllOrdersDialog: React.FC<AllOrdersDialogProps & { showAction?: boolean }> = ({ orders, onClose, onSelectOrder, onMarkReady, onMarkPaid, showAction = true }) => {
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
              <th>Payment</th>
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
                <td style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span 
                      className={`status-pill ${order.isPaid ? 'payment-paid' : ''}`} 
                      style={!order.isPaid ? { backgroundColor: '#FEF2F2', color: '#EF4444' } : {}}
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
                        className="icon-action-btn"
                        title="Mark Paid"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                  </div>
                </td>
                <td onClick={() => {
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
                          className="ready-action-btn"
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

        <div className="content-grid" style={{ gridTemplateColumns: '1fr' }}>
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
                      <th>Payment</th>
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
                        <td style={{ cursor: 'pointer' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span 
                              className={`status-pill ${order.isPaid ? 'payment-paid' : ''}`} 
                              style={!order.isPaid ? { backgroundColor: '#FEF2F2', color: '#EF4444' } : {}}
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
                                className="icon-action-btn"
                                title="Mark Paid"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {order.status !== 'Ready' && (
                              <button
                                className="ready-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkReady(order.id);
                                }}
                              >
                                Mark Ready
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
                      <th>Payment</th>
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
                          <td style={{ cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span 
                                className={`status-pill ${order.isPaid ? 'payment-paid' : ''}`} 
                                style={!order.isPaid ? { backgroundColor: '#FEF2F2', color: '#EF4444' } : {}}
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
                                  className="icon-action-btn"
                                  title="Mark Paid"
                                >
                                  <CheckCircle size={16} />
                                </button>
                              )}
                            </div>
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