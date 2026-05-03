import React, { useState, useMemo } from 'react';
import { Search, TrendingUp, Filter, Calendar, Eye } from 'lucide-react';
import Sidebar from '../components/sidebar';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { updateOrderStatus, updatePaymentStatus } from '../services/supabaseService';
import type { DashboardOrder } from '../services/supabaseService';
import { useDashboardOrders, useInvalidateQueries, queryKeys, useRevenueData } from '../hooks/useSupabaseQuery';
import OrderDetailModal from '../components/OrderDetailModal';
import './order.css';
 
const Order: React.FC = () => {
  const { activeRestaurantId } = useAuth();
  const [selectedTable, setSelectedTable] = useState('All Tables');
  const [selectedPayment, setSelectedPayment] = useState('Payment Method');
  const [selectedStatus, setSelectedStatus] = useState('Status');
  const [selectedDate, setSelectedDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(null);

  // React Query: cached, auto-retries, refetches every 5s (defined in hook)
  const { data: orders = [], isLoading: loading } = useDashboardOrders(activeRestaurantId);
  const { data: revenueData = [], isLoading: loadingRevenue } = useRevenueData(activeRestaurantId);
  const { invalidateOrders } = useInvalidateQueries();
  const queryClient = useQueryClient();

  // ── Stats calculation ─────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfLastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 7);

    let today = 0, yesterday = 0, week = 0, lastWeek = 0;

    revenueData.forEach(r => {
      // parse YYYY-MM-DD
      const [year, month, day] = r.revenueDate.split('-');
      const rDate = new Date(Number(year), Number(month) - 1, Number(day));
      const rTime = rDate.getTime();

      if (rTime === startOfToday.getTime()) {
        today += r.totalOrders;
      } else if (rTime === startOfYesterday.getTime()) {
        yesterday += r.totalOrders;
      }

      if (rDate >= startOfWeek) {
        week += r.totalOrders;
      } else if (rDate >= startOfLastWeek && rDate < startOfWeek) {
        lastWeek += r.totalOrders;
      }
    });

    const todayChange = yesterday === 0 ? (today > 0 ? 100 : 0) : Math.round(((today - yesterday) / yesterday) * 100);
    const weekChange = lastWeek === 0 ? (week > 0 ? 100 : 0) : Math.round(((week - lastWeek) / lastWeek) * 100);

    return { today, week, todayChange, weekChange };
  }, [revenueData]);

  const handleStatusChange = async (orderId: string, nextStatus: string) => {
    if (!activeRestaurantId) return;

    const queryKey = queryKeys.dashboardOrders(activeRestaurantId);
    const previousOrders = queryClient.getQueryData<any[]>(queryKey);

    // 1. Optimistically update the cache
    queryClient.setQueryData(queryKey, (old: any[] | undefined) => {
      if (!old) return [];
      return old.map(order => {
        if (order.id === orderId) {
          // Map status color locally for immediate feedback
          let statusColor = 'yellow';
          const st = nextStatus.toLowerCase();
          if (st === 'preparing') statusColor = 'blue';
          else if (st === 'ready') statusColor = 'green';
          else if (st === 'cancelled') statusColor = 'red';

          return {
            ...order,
            status: nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1),
            statusColor
          };
        }
        return order;
      });
    });

    try {
      await updateOrderStatus(orderId, nextStatus.toLowerCase() as any);
      // Optional: refetch in background to ensure sync
      invalidateOrders(activeRestaurantId);
    } catch (err) {
      console.error('Failed to update status', err);
      // 2. Rollback if failed
      if (previousOrders) {
        queryClient.setQueryData(queryKey, previousOrders);
      }
    }
  };

  const handlePaymentStatusChange = async (orderId: string, newStatus: string) => {
    if (!activeRestaurantId) return;

    const queryKey = queryKeys.dashboardOrders(activeRestaurantId);
    const previousOrders = queryClient.getQueryData<any[]>(queryKey);

    // 1. Optimistically update the cache
    queryClient.setQueryData(queryKey, (old: any[] | undefined) => {
      if (!old) return [];
      return old.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            paymentStatus: newStatus.charAt(0).toUpperCase() + newStatus.slice(1),
            paymentStatusColor: newStatus.toLowerCase()
          };
        }
        return order;
      });
    });

    try {
      await updatePaymentStatus(orderId, newStatus);
      invalidateOrders(activeRestaurantId);
    } catch (err) {
      console.error('Failed to update payment status', err);
      if (previousOrders) {
        queryClient.setQueryData(queryKey, previousOrders);
      }
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch =
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.items.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTable = selectedTable === 'All Tables' || o.table === selectedTable;
      const matchesPayment =
        selectedPayment === 'Payment Method' ||
        o.paymentMethod.toLowerCase() === selectedPayment.toLowerCase();
      const matchesStatus =
        selectedStatus === 'Status' ||
        o.status.toLowerCase() === selectedStatus.toLowerCase();
      const matchesDate = (() => {
        if (!selectedDate) return true;
        const orderDay = new Date(o.createdAt).toISOString().slice(0, 10);
        return orderDay === selectedDate;
      })();
      return matchesSearch && matchesTable && matchesPayment && matchesStatus && matchesDate;
    });
  }, [orders, searchQuery, selectedTable, selectedPayment, selectedStatus, selectedDate]);

  // Total orders on the selected date (ignoring other filters – true daily total)
  const dateOrderCount = useMemo(() => {
    if (!selectedDate) return 0;
    return orders.filter(o => new Date(o.createdAt).toISOString().slice(0, 10) === selectedDate).length;
  }, [orders, selectedDate]);

  const getStatusClass = (color: string) => `status-${color}`;

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
            <div className="order-user-avatar">👨‍💼</div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="order-stats-grid">
          <div className="order-stat-card">
            <div className="order-card-top-bar order-card-green"></div>
            <h3 className="order-stat-title">Total Orders Today</h3>
            <div className="order-stat-number">{loadingRevenue ? '...' : stats.today}</div>
            <div className="order-stat-change">
              <span
                className={stats.todayChange >= 0 ? 'order-change-positive' : 'order-change-negative'}
                style={{ color: stats.todayChange < 0 ? '#E53E3E' : undefined }}
              >
                {stats.todayChange > 0 ? '+' : ''}{stats.todayChange}% vs yesterday
              </span>
              <TrendingUp
                size={16}
                color={stats.todayChange >= 0 ? '#68D391' : '#E53E3E'}
                className="order-trend-icon"
                style={stats.todayChange < 0 ? { transform: 'rotate(180deg)' } : undefined}
              />
            </div>
          </div>

          <div className="order-stat-card">
            <div className="order-card-top-bar order-card-blue"></div>
            <h3 className="order-stat-title">Total Orders This Week</h3>
            <div className="order-stat-number">{loadingRevenue ? '...' : stats.week}</div>
            <div className="order-stat-change">
              <span
                className={stats.weekChange >= 0 ? 'order-change-blue' : 'order-change-negative'}
                style={{ color: stats.weekChange < 0 ? '#E53E3E' : undefined }}
              >
                {stats.weekChange > 0 ? '+' : ''}{stats.weekChange}% vs last week
              </span>
              <TrendingUp
                size={16}
                color={stats.weekChange >= 0 ? '#7F9CF5' : '#E53E3E'}
                className="order-trend-icon"
                style={stats.weekChange < 0 ? { transform: 'rotate(180deg)' } : undefined}
              />
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="order-filter-section">
          <div className="order-filter-buttons">
            {/* Date filter */}
            <div className="order-date-filter-wrapper">
              <Calendar size={15} className="order-date-icon" />
              <input
                type="date"
                className="order-filter-btn order-date-input"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                title="Filter by date"
              />
              {selectedDate && (
                <button
                  className="order-date-clear"
                  onClick={() => setSelectedDate('')}
                  title="Clear date filter"
                >×</button>
              )}
            </div>

            {/* Table filter */}
            <select
              className="order-filter-btn"
              value={selectedTable}
              onChange={e => setSelectedTable(e.target.value)}
            >
              <option value="All Tables">All Tables</option>
              {Array.from(new Set(orders.map(o => o.table))).map(table => (
                table !== 'N/A' && <option key={table} value={table}>{table}</option>
              ))}
            </select>

            {/* Payment filter — Cash & Online only */}
            <select
              className="order-filter-btn"
              value={selectedPayment}
              onChange={e => setSelectedPayment(e.target.value)}
            >
              <option value="Payment Method">All Payment</option>
              <option value="cash">Cash</option>
              <option value="online">Online</option>
            </select>

            {/* Status filter — Placed (Pending), Preparing, Ready, Cancelled only */}
            <select
              className="order-filter-btn"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
            >
              <option value="Status">All Status</option>
              <option value="pending">Placed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
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
            {selectedDate && (
              <div className="order-date-tag-group">
                <span className="order-date-tag">
                  📅 {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="order-date-count-badge">{dateOrderCount} order{dateOrderCount !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          <div className="order-table-wrapper">
            <table className="order-history-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Name</th>
                  <th>Table</th>
                  <th>Date & Time</th>
                  <th> Order Status</th>
                  <th>Payment Method</th>
                  <th>Payment Status</th>
                  <th>Order Type</th>
                  <th>Items</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: '#A0AEC0' }}>
                      Loading orders...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: '#A0AEC0' }}>
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="order-id-cell">{order.orderNumber}</td>
                      <td>{order.customerName}</td>
                      <td>{order.table}</td>
                      <td>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        <div style={{ fontSize: '12px', color: '#718096' }}>{order.time}</div>
                      </td>
                      <td>
                        <select
                          className={`order-status-select ${getStatusClass(order.statusColor)}`}
                          value={order.status.toLowerCase() === 'pending' ? 'pending' : order.status.toLowerCase()}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          title="Change order status"
                        >
                          <option value="pending">Placed</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <span className="order-payment-badge">
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td>
                        <select
                          className={`payment-status-pill status-${order.paymentStatusColor}`}
                          value={order.paymentStatus}
                          onChange={(e) => handlePaymentStatusChange(order.id, e.target.value)}
                          title="Change payment status"
                        >
                          <option value="Paid">Paid</option>
                          <option value="Pending">Pending</option>
                          <option value="Failed">Failed</option>
                          <option value="Refunded">Refunded</option>
                        </select>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{order.orderType?.replace('_', ' ')}</td>
                      <td className="order-items-cell">{order.items}</td>
                      <td>
                        <button 
                          className="view-order-btn" 
                          onClick={() => setSelectedOrder(order)}
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
};

export default Order;
