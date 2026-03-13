import React, { useState, useEffect, useMemo } from 'react';
import { Search, Bell, TrendingUp, Filter } from 'lucide-react';
import Sidebar from '../components/sidebar';
import { useAuth } from '../context/AuthContext';
import { getDashboardOrders, updateOrderStatus } from '../services/supabaseService';
import type { DashboardOrder } from '../services/supabaseService';
import './order.css';

const Order: React.FC = () => {
  const { activeRestaurantId } = useAuth();
  const [selectedTable, setSelectedTable] = useState('All Tables');
  const [selectedPayment, setSelectedPayment] = useState('Payment Method');
  const [selectedStatus, setSelectedStatus] = useState('Status');

  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats calculation
  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfLastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 7);

    let today = 0;
    let yesterday = 0;
    let week = 0;
    let lastWeek = 0;

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      if (orderDate >= startOfToday) today++;
      else if (orderDate >= startOfYesterday) yesterday++;

      if (orderDate >= startOfWeek) week++;
      else if (orderDate >= startOfLastWeek) lastWeek++;
    });

    const todayChange = yesterday === 0 ? (today > 0 ? 100 : 0) : Math.round(((today - yesterday) / yesterday) * 100);
    const weekChange = lastWeek === 0 ? (week > 0 ? 100 : 0) : Math.round(((week - lastWeek) / lastWeek) * 100);

    return { today, week, todayChange, weekChange };
  }, [orders]);

  useEffect(() => {
    if (activeRestaurantId) {
      fetchOrders();
    }
  }, [activeRestaurantId]);

  const fetchOrders = async () => {
    if (!activeRestaurantId) return;
    setLoading(true);
    try {
      const data = await getDashboardOrders(activeRestaurantId);
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      alert('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, currentStatus: string) => {
    // Basic cycle example: Pending -> Preparing -> Ready -> Served -> Completed
    const cycle = ['Pending', 'Preparing', 'Ready', 'Served', 'Completed'];
    const idx = cycle.indexOf(currentStatus);
    if (idx >= 0 && idx < cycle.length - 1) {
      const nextStatus = cycle[idx + 1];
      try {
        await updateOrderStatus(orderId, nextStatus.toLowerCase() as any);
        fetchOrders(); // refresh
      } catch (err) {
        console.error('Failed to update status', err);
      }
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.items.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTable = selectedTable === 'All Tables' || o.table === selectedTable;
      const matchesPayment = selectedPayment === 'Payment Method' || o.paymentMethod.toLowerCase() === selectedPayment.toLowerCase();
      const matchesStatus = selectedStatus === 'Status' || o.status.toLowerCase() === selectedStatus.toLowerCase();
      return matchesSearch && matchesTable && matchesPayment && matchesStatus;
    });
  }, [orders, searchQuery, selectedTable, selectedPayment, selectedStatus]);

  const getStatusClass = (color: string) => {
    return `status-${color}`;
  };

  return (
    <div className="order-container">
      <Sidebar />

      <div className="order-main-content">
        {/* Header */}
        <div className="order-header">
          <h1 className="order-page-title">Order Management</h1>
          <div className="order-header-right">
            <div className="order-search-bar">
              <Search size={18} color="#718096" />
              <input
                type="text"
                placeholder="Search orders..."
                className="order-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="order-icon-button">
              <Bell size={20} color="#718096" />
            </div>
            <div className="order-user-avatar">👨‍💼</div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="order-stats-grid">
          <div className="order-stat-card">
            <div className="order-card-top-bar order-card-green"></div>
            <h3 className="order-stat-title">Total Orders Today</h3>
            <div className="order-stat-number">{loading ? '...' : stats.today}</div>
            <div className="order-stat-change">
              <span
                className={stats.todayChange >= 0 ? "order-change-positive" : "order-change-negative"}
                style={{ color: stats.todayChange < 0 ? '#E53E3E' : undefined }}
              >
                {stats.todayChange > 0 ? '+' : ''}{stats.todayChange}% vs yesterday
              </span>
              <TrendingUp
                size={16}
                color={stats.todayChange >= 0 ? "#68D391" : "#E53E3E"}
                className="order-trend-icon"
                style={stats.todayChange < 0 ? { transform: 'rotate(180deg)' } : undefined}
              />
            </div>
          </div>

          <div className="order-stat-card">
            <div className="order-card-top-bar order-card-blue"></div>
            <h3 className="order-stat-title">Total Orders This Week</h3>
            <div className="order-stat-number">{loading ? '...' : stats.week}</div>
            <div className="order-stat-change">
              <span
                className={stats.weekChange >= 0 ? "order-change-blue" : "order-change-negative"}
                style={{ color: stats.weekChange < 0 ? '#E53E3E' : undefined }}
              >
                {stats.weekChange > 0 ? '+' : ''}{stats.weekChange}% vs last week
              </span>
              <TrendingUp
                size={16}
                color={stats.weekChange >= 0 ? "#7F9CF5" : "#E53E3E"}
                className="order-trend-icon"
                style={stats.weekChange < 0 ? { transform: 'rotate(180deg)' } : undefined}
              />
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="order-filter-section">
          <div className="order-filter-buttons">
            <select
              className="order-filter-btn"
              value={selectedTable}
              onChange={e => setSelectedTable(e.target.value)}
              style={{ paddingRight: '24px', cursor: 'pointer', appearance: 'none' }}
            >
              <option value="All Tables">All Tables</option>
              {Array.from(new Set(orders.map(o => o.table))).map(table => (
                table !== 'N/A' && <option key={table} value={table}>{table}</option>
              ))}
            </select>
            <select
              className="order-filter-btn"
              value={selectedPayment}
              onChange={e => setSelectedPayment(e.target.value)}
              style={{ paddingRight: '24px', cursor: 'pointer', appearance: 'none' }}
            >
              <option value="Payment Method">All Payment</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
            </select>
            <select
              className="order-filter-btn"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              style={{ paddingRight: '24px', cursor: 'pointer', appearance: 'none' }}
            >
              <option value="Status">All Status</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="served">Served</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

          </div>
          <button className="order-filter-icon-btn">
            <Filter size={18} color="#718096" />
          </button>
        </div>

        {/* Order History Table */}
        <div className="order-table-card">
          <div className="order-table-header">
            <h2 className="order-table-title">Order History</h2>
          </div>
          <div className="order-table-wrapper">
            <table className="order-history-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Table</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Payment Method</th>
                  <th>Items</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#A0AEC0' }}>
                      Loading orders...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#A0AEC0' }}>
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="order-id-cell">{order.orderNumber}</td>
                      <td>{order.table}</td>
                      <td>{order.time}</td>
                      <td>
                        <span
                          className={`order-status-pill ${getStatusClass(order.statusColor)}`}
                          onClick={() => handleStatusChange(order.id, order.status)}
                          style={{ cursor: 'pointer' }}
                          title="Click to advance status"
                        >
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <span className="order-payment-badge">
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="order-items-cell">{order.items}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Order;
