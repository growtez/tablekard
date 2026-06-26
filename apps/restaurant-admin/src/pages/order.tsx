import React, { useState, useMemo } from 'react';
import { Search, TrendingUp, Calendar, Eye, Clock, ChefHat, CheckCircle, XCircle, Package } from 'lucide-react';
import Sidebar from '../components/sidebar';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { updateOrderStatus, updatePaymentStatus, updateOrderItemStatus } from '../services/supabaseService';
import type { DashboardOrder } from '../services/supabaseService';
import { useDashboardOrders, useInvalidateQueries, queryKeys, useRevenueData } from '../hooks/useSupabaseQuery';
import OrderDetailModal from '../components/OrderDetailModal';
import './order.css';

// ── Status transition rules ──────────────────────────────────────────
// Once an order is "ready", it can ONLY go to "cancelled".
// Once "cancelled", no further changes allowed.
const getAvailableStatuses = (currentStatus: string) => {
  const st = currentStatus.toLowerCase();
  if (st === 'ready') return [{ value: 'ready', label: 'Ready' }, { value: 'cancelled', label: 'Cancelled' }];
  if (st === 'cancelled') return [{ value: 'cancelled', label: 'Cancelled' }];
  // For pending/preparing — full forward flow
  return [
    { value: 'pending', label: 'Placed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'cancelled', label: 'Cancelled' },
  ];
};

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; bg: string; color: string; label: string }> = {
  pending:   { icon: <Clock size={12} />,      bg: '#FEF3C7', color: '#92400E', label: 'Placed' },
  preparing: { icon: <ChefHat size={12} />,    bg: '#DBEAFE', color: '#1E40AF', label: 'Preparing' },
  ready:     { icon: <CheckCircle size={12} />, bg: '#D1FAE5', color: '#065F46', label: 'Ready' },
  cancelled: { icon: <XCircle size={12} />,    bg: '#FEE2E2', color: '#991B1B', label: 'Cancelled' },
  served:    { icon: <CheckCircle size={12} />, bg: '#CCFBF1', color: '#115E59', label: 'Served' },
  completed: { icon: <CheckCircle size={12} />, bg: '#CCFBF1', color: '#115E59', label: 'Completed' },
};

const Order: React.FC = () => {
  const { activeRestaurantId } = useAuth();
  const [selectedTable, setSelectedTable] = useState('All Tables');
  const [selectedPayment, setSelectedPayment] = useState('Payment Method');
  const [selectedStatus, setSelectedStatus] = useState('Status');
  const [selectedDate, setSelectedDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(null);

  const { data: orders = [], isLoading: loading } = useDashboardOrders(activeRestaurantId);
  const { data: revenueData = [], isLoading: loadingRevenue } = useRevenueData(activeRestaurantId);
  const { invalidateOrders } = useInvalidateQueries();
  const queryClient = useQueryClient();

  const activeDetailOrder = useMemo(() => {
    if (!selectedOrder) return null;
    return orders.find(o => o.id === selectedOrder.id) || selectedOrder;
  }, [orders, selectedOrder]);

  const handleItemStatusChange = async (itemId: string, nextStatus: string) => {
    if (!activeRestaurantId) return;
    try {
      await updateOrderItemStatus(itemId, nextStatus);
      invalidateOrders(activeRestaurantId);
    } catch (err) {
      console.error('Failed to update item status', err);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfLastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 7);

    let today = 0, yesterday = 0, week = 0, lastWeek = 0;

    revenueData.forEach(r => {
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

    queryClient.setQueryData(queryKey, (old: any[] | undefined) => {
      if (!old) return [];
      return old.map(order => {
        if (order.id === orderId) {
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
      invalidateOrders(activeRestaurantId);
    } catch (err) {
      console.error('Failed to update status', err);
      if (previousOrders) {
        queryClient.setQueryData(queryKey, previousOrders);
      }
    }
  };

  const handlePaymentStatusChange = async (orderId: string, newStatus: string) => {
    if (!activeRestaurantId) return;

    const queryKey = queryKeys.dashboardOrders(activeRestaurantId);
    const previousOrders = queryClient.getQueryData<any[]>(queryKey);

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

  const dateOrderCount = useMemo(() => {
    if (!selectedDate) return 0;
    return orders.filter(o => new Date(o.createdAt).toISOString().slice(0, 10) === selectedDate).length;
  }, [orders, selectedDate]);

  return (
    <div className="order-container">
      <Sidebar />

      <div className="order-main-content">
        {/* Header */}
        <div className="order-header">
          <div>
            <h1 className="order-page-title">Orders</h1>
            <p className="order-page-subtitle">Manage and track all your restaurant orders</p>
          </div>
          <div className="order-header-right">
            <div className="order-search-bar">
              <Search size={16} color="#94A3B8" />
              <input
                type="text"
                placeholder="Search orders..."
                className="order-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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

        {/* Filter Bar */}
        <div className="order-filter-bar">
          <div className="order-filter-group">
            <div className="order-date-filter-wrapper">
              <Calendar size={14} className="order-date-icon" />
              <input
                type="date"
                className="order-filter-select order-date-input"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                title="Filter by date"
              />
              {selectedDate && (
                <button className="order-date-clear" onClick={() => setSelectedDate('')} title="Clear">×</button>
              )}
            </div>

            <select className="order-filter-select" value={selectedTable} onChange={e => setSelectedTable(e.target.value)}>
              <option value="All Tables">All Tables</option>
              {Array.from(new Set(orders.map(o => o.table))).map(table => (
                table !== 'N/A' && <option key={table} value={table}>{table}</option>
              ))}
            </select>

            <select className="order-filter-select" value={selectedPayment} onChange={e => setSelectedPayment(e.target.value)}>
              <option value="Payment Method">All Payment</option>
              <option value="cash">Cash</option>
              <option value="online">Online</option>
            </select>

            <select className="order-filter-select" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
              <option value="Status">All Status</option>
              <option value="pending">Placed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {selectedDate && (
            <div className="order-date-tag-group">
              <span className="order-date-tag">
                📅 {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <span className="order-date-count-badge">{dateOrderCount}</span>
            </div>
          )}
        </div>

        {/* Orders List */}
        <div className="order-list-section">
          <div className="order-list-header">
            <h2 className="order-list-title">All Orders</h2>
            <span className="order-list-count">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="order-loading">
              <div className="order-skeleton" />
              <div className="order-skeleton" />
              <div className="order-skeleton" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="order-empty">
              <Package size={48} color="#CBD5E1" />
              <h3>No orders found</h3>
              <p>Try adjusting your filters or search query</p>
            </div>
          ) : (
            <div className="order-cards-grid">
              {filteredOrders.map((order) => {
                const st = order.status.toLowerCase();
                const statusConf = STATUS_CONFIG[st] || STATUS_CONFIG.pending;
                const availableStatuses = getAvailableStatuses(st);
                const isLocked = st === 'cancelled';

                return (
                  <div
                    className={`order-card ord-status-${st}`}
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                  >
                    {/* Card top row: ID + Status */}
                    <div className="ocard-top">
                      <div className="ocard-id-group">
                        <span className="ocard-id">{order.orderNumber}</span>
                        <span className="ocard-time">{order.time}</span>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <select
                          className="ocard-status-select"
                          style={{ backgroundColor: statusConf.bg, color: statusConf.color }}
                          value={st === 'pending' ? 'pending' : st}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          disabled={isLocked}
                        >
                          {availableStatuses.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Card body: customer + details */}
                    <div className="ocard-body">
                      <div className="ocard-customer">{order.customerName}</div>
                      <div className="ocard-meta-row">
                        <span className="ocard-meta-chip">{order.table}</span>
                        <span className="ocard-meta-chip type">{order.orderType?.replace('_', ' ')}</span>
                      </div>
                    </div>

                    {/* Items preview */}
                    <div className="ocard-items" title={order.items}>
                      {order.items}
                    </div>

                    {/* Card footer: payment + total + action */}
                    <div className="ocard-footer">
                      <div className="ocard-payment" onClick={(e) => e.stopPropagation()}>
                        <span className="ocard-pay-method">{order.paymentMethod}</span>
                        <select
                          className={`ocard-pay-status ps-${order.paymentStatusColor}`}
                          value={order.paymentStatus}
                          onChange={(e) => handlePaymentStatusChange(order.id, e.target.value)}
                        >
                          <option value="Paid">Paid</option>
                          <option value="Pending">Pending</option>
                          <option value="Failed">Failed</option>
                          <option value="Refunded">Refunded</option>
                        </select>
                      </div>
                      <div className="ocard-total-action">
                        <span className="ocard-total">₹{order.total.toLocaleString('en-IN')}</span>
                        <button
                          className="ocard-view-btn"
                          onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {activeDetailOrder && (
        <OrderDetailModal
          order={activeDetailOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateItemStatus={handleItemStatusChange}
        />
      )}
    </div>
  );
};

export default Order;
