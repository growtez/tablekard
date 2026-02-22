import React, { useState } from 'react';
import { TrendingUp, X, User, Clock } from 'lucide-react';
import './dashboard.css';
import Sidebar from '../components/sidebar';

// Type Definitions
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  table: string;
  orderedTime: string;
  status: string;
  statusColor: string;
  customer: string;
  items: OrderItem[];
  total: number;
  isPaid: boolean;
}

interface Payment {
  id: number;
  table: string;
  customer: string;
  amount: number;
  time: string;
}

interface BestSellingDish {
  name: string;
  sold: number;
  trend: string;
  revenue: number;
  image: string;
}

// Component Props Interfaces
interface OrderDetailsDialogProps {
  order: Order | null;
  onClose: () => void;
  onMarkServed: (orderId: string) => void;
}

interface AllOrdersDialogProps {
  orders: Order[];
  onClose: () => void;
  onSelectOrder: (order: Order) => void;
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
              <div className="order-value">{order.id}</div>
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
                <div key={idx} className="order-item">
                  <div>
                    <div className="order-item-name">{item.name}</div>
                    <div className="order-item-qty">Qty: {item.quantity}</div>
                  </div>
                  <div className="order-item-price">₹{item.price}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-total">
            <div className="order-total-label">Total Amount</div>
            <div className="order-total-amount">₹{order.total}</div>
          </div>

          {order.status !== 'Served' && (
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
                  {order.id}
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
                  {order.orderedTime}
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
                    {order.status !== 'Served' ? (
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAllOrders, setShowAllOrders] = useState<boolean>(false);
  const [showAllCompleted, setShowAllCompleted] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ORDER-234',
      table: 'Table 7',
      orderedTime: '12:35 PM - Oct 02, 2025',
      status: 'Preparing',
      statusColor: 'preparing',
      customer: 'Rajesh Kumar',
      items: [
        { name: 'Butter Chicken', quantity: 2, price: 450 },
        { name: 'Garlic Naan', quantity: 4, price: 160 },
        { name: 'Dal Makhani', quantity: 1, price: 280 }
      ],
      total: 890,
      isPaid: false
    },
    {
      id: 'ORDER-235',
      table: 'Table 3',
      orderedTime: '12:30 PM - Oct 02, 2025',
      status: 'Ready',
      statusColor: 'ready',
      customer: 'Priya Sharma',
      items: [
        { name: 'Paneer Tikka', quantity: 1, price: 380 },
        { name: 'Tandoori Roti', quantity: 3, price: 90 }
      ],
      total: 470,
      isPaid: true
    },
    {
      id: 'ORDER-237',
      table: 'Table 10',
      orderedTime: '12:25 PM - Oct 02, 2025',
      status: 'Preparing',
      statusColor: 'preparing',
      customer: 'Sneha Reddy',
      items: [
        { name: 'Biryani', quantity: 1, price: 420 },
        { name: 'Raita', quantity: 1, price: 80 }
      ],
      total: 500,
      isPaid: false
    },
    {
      id: 'ORDER-238',
      table: 'Table 2',
      orderedTime: '12:20 PM - Oct 02, 2025',
      status: 'Ready',
      statusColor: 'ready',
      customer: 'Vikram Singh',
      items: [
        { name: 'Chole Bhature', quantity: 2, price: 320 }
      ],
      total: 320,
      isPaid: false
    },
    {
      id: 'ORDER-239',
      table: 'Table 8',
      orderedTime: '12:18 PM - Oct 02, 2025',
      status: 'Preparing',
      statusColor: 'preparing',
      customer: 'Ananya Gupta',
      items: [
        { name: 'Paneer Butter Masala', quantity: 1, price: 340 },
        { name: 'Butter Naan', quantity: 2, price: 80 }
      ],
      total: 420,
      isPaid: true
    },
    {
      id: 'ORDER-240',
      table: 'Table 15',
      orderedTime: '12:15 PM - Oct 02, 2025',
      status: 'Ready',
      statusColor: 'ready',
      customer: 'Karan Malhotra',
      items: [
        { name: 'Tandoori Chicken', quantity: 1, price: 480 }
      ],
      total: 480,
      isPaid: false
    },
    {
      id: 'ORDER-241',
      table: 'Table 6',
      orderedTime: '12:12 PM - Oct 02, 2025',
      status: 'Preparing',
      statusColor: 'preparing',
      customer: 'Divya Nair',
      items: [
        { name: 'Veg Thali', quantity: 1, price: 350 }
      ],
      total: 350,
      isPaid: false
    },
    {
      id: 'ORDER-242',
      table: 'Table 11',
      orderedTime: '12:10 PM - Oct 02, 2025',
      status: 'Ready',
      statusColor: 'ready',
      customer: 'Rohit Desai',
      items: [
        { name: 'Chicken Tikka', quantity: 1, price: 400 },
        { name: 'Jeera Rice', quantity: 1, price: 180 }
      ],
      total: 580,
      isPaid: true
    }
  ]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([
    {
      id: 'ORDER-220',
      table: 'Table 5',
      orderedTime: '11:45 AM - Oct 02, 2025',
      status: 'Served',
      statusColor: 'served',
      customer: 'Amit Patel',
      items: [
        { name: 'Paneer Tikka Masala', quantity: 1, price: 380 },
        { name: 'Butter Naan', quantity: 3, price: 120 }
      ],
      total: 500,
      isPaid: true
    },
    {
      id: 'ORDER-219',
      table: 'Table 12',
      orderedTime: '11:30 AM - Oct 02, 2025',
      status: 'Served',
      statusColor: 'served',
      customer: 'Sanjay Khanna',
      items: [
        { name: 'Chicken Biryani', quantity: 2, price: 840 },
        { name: 'Raita', quantity: 2, price: 160 }
      ],
      total: 1000,
      isPaid: true
    },
    {
      id: 'ORDER-218',
      table: 'Table 8',
      orderedTime: '11:20 AM - Oct 02, 2025',
      status: 'Served',
      statusColor: 'served',
      customer: 'Neha Kapoor',
      items: [
        { name: 'Dal Makhani', quantity: 1, price: 280 },
        { name: 'Jeera Rice', quantity: 1, price: 180 },
        { name: 'Garlic Naan', quantity: 2, price: 80 }
      ],
      total: 540,
      isPaid: true
    },
    {
      id: 'ORDER-217',
      table: 'Table 3',
      orderedTime: '11:10 AM - Oct 02, 2025',
      status: 'Served',
      statusColor: 'served',
      customer: 'Ravi Mehta',
      items: [
        { name: 'Tandoori Chicken', quantity: 1, price: 480 },
        { name: 'Mint Chutney', quantity: 1, price: 40 }
      ],
      total: 520,
      isPaid: true
    },
    {
      id: 'ORDER-216',
      table: 'Table 14',
      orderedTime: '10:55 AM - Oct 02, 2025',
      status: 'Served',
      statusColor: 'served',
      customer: 'Pooja Singh',
      items: [
        { name: 'Masala Dosa', quantity: 2, price: 240 },
        { name: 'Filter Coffee', quantity: 2, price: 120 }
      ],
      total: 360,
      isPaid: true
    },
    {
      id: 'ORDER-215',
      table: 'Table 9',
      orderedTime: '10:40 AM - Oct 02, 2025',
      status: 'Served',
      statusColor: 'served',
      customer: 'Arjun Reddy',
      items: [
        { name: 'Veg Thali', quantity: 1, price: 350 }
      ],
      total: 350,
      isPaid: false
    },
    {
      id: 'ORDER-214',
      table: 'Table 6',
      orderedTime: '10:25 AM - Oct 02, 2025',
      status: 'Served',
      statusColor: 'served',
      customer: 'Kavita Sharma',
      items: [
        { name: 'Chole Bhature', quantity: 1, price: 160 },
        { name: 'Lassi', quantity: 1, price: 80 }
      ],
      total: 240,
      isPaid: true
    },
    {
      id: 'ORDER-213',
      table: 'Table 11',
      orderedTime: '10:15 AM - Oct 02, 2025',
      status: 'Served',
      statusColor: 'served',
      customer: 'Manish Gupta',
      items: [
        { name: 'Butter Chicken', quantity: 1, price: 450 },
        { name: 'Garlic Naan', quantity: 2, price: 80 },
        { name: 'Raita', quantity: 1, price: 80 }
      ],
      total: 610,
      isPaid: true
    },
    {
      id: 'ORDER-212',
      table: 'Table 4',
      orderedTime: '10:00 AM - Oct 02, 2025',
      status: 'Served',
      statusColor: 'served',
      customer: 'Deepika Iyer',
      items: [
        { name: 'Paneer Butter Masala', quantity: 1, price: 340 },
        { name: 'Tandoori Roti', quantity: 4, price: 120 }
      ],
      total: 460,
      isPaid: true
    },
    {
      id: 'ORDER-211',
      table: 'Table 7',
      orderedTime: '09:45 AM - Oct 02, 2025',
      status: 'Served',
      statusColor: 'served',
      customer: 'Rahul Verma',
      items: [
        { name: 'Chicken Tikka', quantity: 1, price: 400 },
        { name: 'Butter Naan', quantity: 3, price: 120 },
        { name: 'Green Salad', quantity: 1, price: 100 }
      ],
      total: 620,
      isPaid: true
    }
  ]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([
    { id: 1, table: 'Table 7', customer: 'Rajesh Kumar', amount: 890, time: '15 mins ago' },
    { id: 2, table: 'Table 12', customer: 'Meera Iyer', amount: 1250, time: '8 mins ago' },
    { id: 3, table: 'Table 4', customer: 'Arun Verma', amount: 675, time: '5 mins ago' }
  ]);

  const handlePaymentComplete = (paymentId: number): void => {
    setPendingPayments(pendingPayments.filter(payment => payment.id !== paymentId));
  };

  const handleMarkServed = (orderId: string): void => {
    const servedOrder = orders.find(order => order.id === orderId);
    if (servedOrder) {
      const completedOrder = {
        ...servedOrder,
        status: 'Served',
        statusColor: 'served'
      };
      setCompletedOrders([completedOrder, ...completedOrders]);
    }
    setOrders(orders.filter(order => order.id !== orderId));
  };

  // Filter out served orders for active orders display
  const activeOrders = orders.filter(order => order.status !== 'Served');

  const bestSelling: BestSellingDish[] = [
    { name: 'Butter Chicken', sold: 45, trend: '+12%', revenue: 20250, image: '🍗' },
    { name: 'Paneer Tikka', sold: 38, trend: '+8%', revenue: 14440, image: '🧀' },
    { name: 'Masala Dosa', sold: 35, trend: '+15%', revenue: 4200, image: '🥘' },
    { name: 'Biryani', sold: 32, trend: '+5%', revenue: 13440, image: '🍛' }
  ];

  const totalPending: number = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);

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
            <div className="revenue-amount">₹ 1,25,300</div>
            <div className="revenue-change">
              <span className="change-text change-positive">+15% vs yesterday</span>
              <TrendingUp size={16} color="#68D391" className="trend-icon" />
            </div>
          </div>

          <div className="revenue-card">
            <div className="card-top-bar card-top-bar-blue"></div>
            <h3 className="card-title">Revenue This Week</h3>
            <div className="revenue-amount">₹ 8,90,000</div>
            <div className="revenue-change">
              <span className="change-text change-blue">+8% vs last week</span>
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
                    {activeOrders.slice(0, 5).map((order, idx) => (
                      <tr key={idx}>
                        <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
                          {order.id}
                        </td>
                        <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
                          {order.table}
                        </td>
                        <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
                          {order.orderedTime}
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
                    {completedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#A0AEC0' }}>
                          No completed orders yet
                        </td>
                      </tr>
                    ) : (
                      completedOrders.slice(0, 5).map((order, idx) => (
                        <tr key={idx}>
                          <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
                            {order.id}
                          </td>
                          <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
                            {order.table}
                          </td>
                          <td onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
                            {order.orderedTime}
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
                {bestSelling.map((dish, idx) => (
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
                {pendingPayments.map((payment) => (
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
                      <div className="payment-amount">₹{payment.amount}</div>
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