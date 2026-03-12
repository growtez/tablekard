import React, { useCallback, useMemo, useState } from 'react';
import { TrendingUp, X, User, Clock } from 'lucide-react';
import './dashboard.css';
import Sidebar from '../components/sidebar';
import SystemStatusPanel from '../components/system_status_panel';
import { useAuth } from '../context/AuthContext';
import { useTabVisibilityRefetch } from '../hooks/useTabVisibilityRefetch';
import {
  getDashboardSummary,
  updateOrderStatus,
  updatePaymentStatus,
  type DashboardSummary,
} from '../services/supabaseService';

type DashboardOrder = DashboardSummary['activeOrders'][number];

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
  showAction?: boolean;
}

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
              <span className={`status-pill status-${order.statusColor}`}>{order.status}</span>
            </div>
          </div>

          <div className="order-info-grid">
            <div>
              <div className="order-label">Table</div>
              <div className="order-value">{order.table}</div>
            </div>
            <div>
              <div className="order-label">Ordered Time</div>
              <div className="order-value">{order.orderedTime}</div>
            </div>
            <div>
              <div className="order-label">Customer</div>
              <div className="order-value">{order.customer}</div>
            </div>
          </div>

          <div className="order-items-section">
            <div className="order-label">Items Ordered</div>
            <div className="order-items-list">
              {order.items.map((item, idx) => (
                <div key={`${item.name}-${idx}`} className="order-item">
                  <div>
                    <div className="order-item-name">{item.name}</div>
                    <div className="order-item-qty">Qty: {item.quantity}</div>
                  </div>
                  <div className="order-item-price">Rs {item.price}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-total">
            <div className="order-total-label">Total Amount</div>
            <div className="order-total-amount">Rs {order.total.toLocaleString()}</div>
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

const AllOrdersDialog: React.FC<AllOrdersDialogProps> = ({ orders, onClose, onSelectOrder, onMarkServed, showAction = true }) => (
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
          {orders.map((order) => (
            <tr key={order.id}>
              <td onClick={() => { onClose(); onSelectOrder(order); }} style={{ cursor: 'pointer' }}>{order.orderNumber}</td>
              <td onClick={() => { onClose(); onSelectOrder(order); }} style={{ cursor: 'pointer' }}>{order.table}</td>
              <td onClick={() => { onClose(); onSelectOrder(order); }} style={{ cursor: 'pointer' }}>{order.orderedTime}</td>
              <td onClick={() => { onClose(); onSelectOrder(order); }} style={{ cursor: 'pointer' }}>
                <span className={`status-pill status-${order.statusColor}`}>{order.status}</span>
              </td>
              <td onClick={() => { onClose(); onSelectOrder(order); }} style={{ cursor: 'pointer' }}>{order.customer}</td>
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
                    <span style={{ color: '#68D391', fontSize: '13px' }}>Completed</span>
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

const emptySummary: DashboardSummary = {
  revenueToday: 0,
  revenueTodayChange: 0,
  revenueWeek: 0,
  revenueWeekChange: 0,
  activeOrders: [],
  completedOrders: [],
  pendingPayments: [],
  bestSelling: [],
};

const Dashboard: React.FC = () => {
  const { activeRestaurantId } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(null);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [showAllCompleted, setShowAllCompleted] = useState(false);

  const fetchDashboard = useCallback(async () => {
    if (!activeRestaurantId) {
      setSummary(emptySummary);
      setLoading(false);
      return;
    }

    // only show full-page spinner the first time
    if (initialLoad) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getDashboardSummary(activeRestaurantId);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load dashboard', err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [activeRestaurantId, initialLoad]);

  const { refetch: refetchDashboard, refetching } = useTabVisibilityRefetch(fetchDashboard, {
    enabled: !!activeRestaurantId,
    autoRefreshInterval: 30000,
    refetchOnMount: true,
  });

  const handleMarkServed = useCallback(async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'served' as never);
      await refetchDashboard(true);
    } catch (err) {
      console.error('Failed to update order status', err);
      setError('Failed to update order status.');
    }
  }, [refetchDashboard]);

  const handlePaymentComplete = useCallback(async (paymentId: string) => {
    try {
      await updatePaymentStatus(paymentId, 'paid');
      await refetchDashboard(true);
    } catch (err) {
      console.error('Failed to update payment status', err);
      setError('Failed to mark payment as paid.');
    }
  }, [refetchDashboard]);

  const totalPending = useMemo(
    () => summary.pendingPayments.reduce((sum, payment) => sum + payment.amount, 0),
    [summary.pendingPayments]
  );

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="main-content">
        <div className="header">
          <h1 className="page-title">Dashboard</h1>
        </div>

        <SystemStatusPanel />

        {error && <div style={{ color: '#F56565', marginBottom: '16px' }}>{error}</div>}

        <div className="revenue-grid">
          <div className="revenue-card">
            <div className="card-top-bar card-top-bar-green"></div>
            <h3 className="card-title">Revenue Today</h3>
            <div className="revenue-amount">Rs {loading && !refetching ? '...' : summary.revenueToday.toLocaleString()}</div>
            <div className="revenue-change">
              <span className="change-text change-positive">
                {summary.revenueTodayChange > 0 ? '+' : ''}{summary.revenueTodayChange}% vs yesterday
              </span>
              <TrendingUp size={16} color="#68D391" className="trend-icon" />
            </div>
          </div>

          <div className="revenue-card">
            <div className="card-top-bar card-top-bar-blue"></div>
            <h3 className="card-title">Revenue This Week</h3>
            <div className="revenue-amount">Rs {loading && !refetching ? '...' : summary.revenueWeek.toLocaleString()}</div>
            <div className="revenue-change">
              <span className="change-text change-blue">
                {summary.revenueWeekChange > 0 ? '+' : ''}{summary.revenueWeekChange}% vs last week
              </span>
              <TrendingUp size={16} color="#7F9CF5" className="trend-icon" />
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
                    {loading && !refetching ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>Loading orders...</td></tr>
                    ) : summary.activeOrders.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>No active orders</td></tr>
                    ) : (
                      summary.activeOrders.slice(0, 5).map((order) => (
                        <tr key={order.id}>
                          <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>{order.orderNumber}</td>
                          <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>{order.table}</td>
                          <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>{order.orderedTime}</td>
                          <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
                            <span className={`status-pill status-${order.statusColor}`}>{order.status}</span>
                          </td>
                          <td>
                            <button className="served-action-btn" onClick={() => handleMarkServed(order.id)}>
                              Mark Served
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
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
                    {loading && !refetching ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>Loading completed orders...</td></tr>
                    ) : summary.completedOrders.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>No completed orders yet</td></tr>
                    ) : (
                      summary.completedOrders.slice(0, 5).map((order) => (
                        <tr key={order.id}>
                          <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>{order.orderNumber}</td>
                          <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>{order.table}</td>
                          <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>{order.orderedTime}</td>
                          <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
                            <span className={`status-pill status-${order.statusColor}`}>{order.status}</span>
                          </td>
                          <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>{order.customer}</td>
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
              <h3 className="widget-title">Best-Selling Dishes</h3>
              <div className="dish-list">
                {summary.bestSelling.length === 0 ? (
                  <div style={{ color: '#A0AEC0' }}>No sales data yet</div>
                ) : (
                  summary.bestSelling.map((dish) => (
                    <div key={dish.name} className="dish-item">
                      <div className="dish-image">{dish.name.slice(0, 1)}</div>
                      <div className="dish-info">
                        <div className="dish-name">{dish.name}</div>
                        <div className="dish-stats">
                          <span className="dish-sold">{dish.sold} sold</span>
                          <span className="dish-trend">{dish.trend}</span>
                        </div>
                      </div>
                      <div className="dish-revenue">
                        <div className="dish-revenue-amount">Rs {dish.revenue.toLocaleString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="widget-card">
              <h3 className="widget-title">Pending Payments</h3>
              <div className="pending-payments-list">
                {summary.pendingPayments.length === 0 ? (
                  <div style={{ color: '#A0AEC0' }}>No pending payments</div>
                ) : (
                  summary.pendingPayments.map((payment) => (
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
                        <div className="payment-amount">Rs {payment.amount.toLocaleString()}</div>
                        <button className="mark-paid-btn" onClick={() => handlePaymentComplete(payment.id)}>
                          Mark Paid
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="payment-total">
                <span className="payment-total-label">Total Pending</span>
                <span className="payment-total-amount">Rs {totalPending.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailsDialog order={selectedOrder} onClose={() => setSelectedOrder(null)} onMarkServed={handleMarkServed} />
      )}

      {showAllOrders && (
        <AllOrdersDialog
          orders={summary.activeOrders}
          onClose={() => setShowAllOrders(false)}
          onSelectOrder={setSelectedOrder}
          onMarkServed={handleMarkServed}
          showAction
        />
      )}

      {showAllCompleted && (
        <AllOrdersDialog
          orders={summary.completedOrders}
          onClose={() => setShowAllCompleted(false)}
          onSelectOrder={setSelectedOrder}
          onMarkServed={handleMarkServed}
          showAction={false}
        />
      )}
    </div>
  );
};

export default Dashboard;
