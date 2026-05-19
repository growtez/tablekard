import React, { useState, useMemo } from 'react';
import { Download, Calendar, CreditCard, CheckCircle, Eye, Trash2, X, Search, User, Hash, Clock, Utensils } from 'lucide-react';
import './payment.css';
import Sidebar from '../components/sidebar';
import { useAuth } from '../context/AuthContext';
import { updatePaymentStatus } from '../services/supabaseService';
import type { PaymentTransaction } from '../services/supabaseService';
import { usePaymentTransactions, useInvalidateQueries, useRevenueData, queryKeys } from '../hooks/useSupabaseQuery';
import { useQueryClient } from '@tanstack/react-query';

// Main Payment Component
const Payment: React.FC = () => {
  const { activeRestaurantId } = useAuth();
  const [selectedDateRange, setSelectedDateRange] = useState<string>('today');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Hidden (locally removed) transaction IDs – for the "hide" button
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  // React Query: cached, auto-retries, refetches on tab focus
  const { data: allTransactions = [], isLoading: loading } = usePaymentTransactions(activeRestaurantId);
  const { data: revenueData = [], isLoading: loadingRevenue } = useRevenueData(activeRestaurantId);
  const { invalidatePayments } = useInvalidateQueries();
  const queryClient = useQueryClient();

  const [revenuePeriod, setRevenuePeriod] = useState<string>('today');
  const [revenueCustomDate, setRevenueCustomDate] = useState<string>('');

  // Filter out locally hidden rows
  const transactions = useMemo(
    () => allTransactions.filter(t => !hiddenIds.has(t.id)),
    [allTransactions, hiddenIds]
  );

  // Filter transactions based on selected filters
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const methodMatch = selectedPaymentMethod === 'all' ||
      (selectedPaymentMethod === 'Online'
        ? transaction.paymentMethod.toLowerCase() !== 'cash'
        : transaction.paymentMethod.toLowerCase() === selectedPaymentMethod.toLowerCase());
    const statusMatch = selectedPaymentStatus === 'all' || transaction.paymentStatus === selectedPaymentStatus;

    // Date range filtering
    const tDate = new Date(transaction.createdAt);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());

    let dateMatch = true;
    if (selectedDateRange === 'today') {
      dateMatch = tDate >= startOfToday;
    } else if (selectedDateRange === 'yesterday') {
      dateMatch = tDate >= startOfYesterday && tDate < startOfToday;
    } else if (selectedDateRange === 'this-week') {
      dateMatch = tDate >= startOfWeek;
    } else if (selectedDateRange === 'custom' && customDate) {
      const selectedDay = new Date(customDate).toDateString();
      dateMatch = tDate.toDateString() === selectedDay;
    }

    return matchesSearch && methodMatch && statusMatch && dateMatch;
  });

  const filteredRevenue = useMemo(() => {
    let totalRevenue = 0;
    let totalOrders = 0;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    revenueData.forEach(r => {
      // parse YYYY-MM-DD
      const [year, month, day] = r.revenueDate.split('-');
      const rDate = new Date(Number(year), Number(month) - 1, Number(day));

      let match = false;
      if (revenuePeriod === 'today') {
        match = rDate.getTime() === startOfToday.getTime();
      } else if (revenuePeriod === 'yesterday') {
        match = rDate.getTime() === startOfYesterday.getTime();
      } else if (revenuePeriod === 'this-week') {
        match = rDate >= startOfWeek;
      } else if (revenuePeriod === 'this-month') {
        match = rDate >= startOfMonth;
      } else if (revenuePeriod === 'custom' && revenueCustomDate) {
        const [cy, cm, cd] = revenueCustomDate.split('-');
        if (cy && cm && cd) {
          const cDate = new Date(Number(cy), Number(cm) - 1, Number(cd));
          match = rDate.getTime() === cDate.getTime();
        }
      }

      if (match) {
        totalRevenue += r.totalRevenue;
        totalOrders += r.totalOrders;
      }
    });

    return { totalRevenue, totalOrders };
  }, [revenueData, revenuePeriod, revenueCustomDate]);

  const handleExportReport = () => {
    console.log('Exporting report...');
  };

  const handleView = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      setSelectedTransaction(transaction);
      setIsModalOpen(true);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!activeRestaurantId) return;

    const qKey = queryKeys.payments(activeRestaurantId);
    const previousPayments = queryClient.getQueryData<any[]>(qKey);

    // 1. Optimistically update the cache
    queryClient.setQueryData(qKey, (old: any[] | undefined) => {
      if (!old) return [];
      return old.map(transaction => {
        if (transaction.id === id) {
          return {
            ...transaction,
            paymentStatus: newStatus.charAt(0).toUpperCase() + newStatus.slice(1),
            statusColor: newStatus.toLowerCase()
          };
        }
        return transaction;
      });
    });

    try {
      await updatePaymentStatus(id, newStatus);
      // Optional: refetch in background to ensure sync
      invalidatePayments(activeRestaurantId);
    } catch (err) {
      console.error('Failed to update status', err);
      // 2. Rollback if failed
      if (previousPayments) {
        queryClient.setQueryData(qKey, previousPayments);
      }
      alert('Failed to update status');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction from view? (Not deleted from DB)')) {
      setHiddenIds(prev => new Set(prev).add(id));
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="main-content">
        <div className="header">
          <h1 className="page-title">Payments & Billing</h1>
          <div className="header-right">
            <div className="search-bar">
              <Search size={18} color="#718096" />
              <input
                type="text"
                placeholder="Search by Order ID or Name..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="revenue-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', marginTop: '24px' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Revenue Overview</h2>
          <div className="filter-group" style={{ margin: 0 }}>
            <Calendar size={16} color="#718096" />
            <select
              className="filter-select"
              value={revenuePeriod}
              onChange={(e) => setRevenuePeriod(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
            {revenuePeriod === 'custom' && (
              <input
                type="date"
                className="custom-date-picker"
                value={revenueCustomDate}
                onChange={(e) => setRevenueCustomDate(e.target.value)}
              />
            )}
          </div>
        </div>

        <div className="revenue-grid">
          <div className="revenue-card">
            <div className="card-top-bar card-top-bar-green"></div>
            <h3 className="card-title">Total Revenue</h3>
            <div className="revenue-amount">₹ {loadingRevenue ? '...' : filteredRevenue.totalRevenue.toLocaleString()}</div>
          </div>

          <div className="revenue-card">
            <div className="card-top-bar card-top-bar-blue"></div>
            <h3 className="card-title">Total Orders</h3>
            <div className="revenue-amount">{loadingRevenue ? '...' : filteredRevenue.totalOrders.toLocaleString()}</div>
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-buttons">
            <div className="filter-group">
              <Calendar size={16} color="#718096" />
              <select
                className="filter-select"
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this-week">This Week</option>
                <option value="custom">Custom Range</option>
              </select>
              {selectedDateRange === 'custom' && (
                <input
                  type="date"
                  className="custom-date-picker"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                />
              )}
            </div>

            <div className="filter-group">
              <CreditCard size={16} color="#718096" />
              <select
                className="filter-select"
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              >
                <option value="all">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
              </select>
            </div>

            <div className="filter-group">
              <CheckCircle size={16} color="#718096" />
              <select
                className="filter-select"
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
          </div>

          <button className="export-btn" onClick={handleExportReport}>
            <Download size={16} />
            <span>Export Report</span>
          </button>
        </div>

        <div className="table-card">
          <div className="table-header">
            <h2 className="table-title">Payments Table</h2>
          </div>

          <div className="table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Name</th>
                  <th>Date & Time</th>
                  <th>Payment Method</th>
                  <th>Payment Status</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#A0AEC0' }}>
                      Loading transactions...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#A0AEC0' }}>
                      No transactions found matching the selected filters
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td data-label="Order ID">
                        <div className="order-id-cell">{transaction.orderNumber}</div>
                      </td>
                      <td data-label="Customer Name">
                        <div className="customer-name-cell">{transaction.customerName}</div>
                      </td>
                      <td data-label="Date & Time">
                        <div className="datetime-cell">{transaction.dateTime}</div>
                      </td>
                      <td data-label="Payment Method">
                        <span className={`method-badge method-${transaction.paymentMethod.toLowerCase()}`}>
                          {transaction.paymentMethod}
                        </span>
                      </td>
                      <td data-label="Payment Status">
                        <select
                          className={`payment-status-pill status-${transaction.statusColor}`}
                          value={transaction.paymentStatus}
                          onChange={(e) => handleStatusChange(transaction.id, e.target.value)}
                          title="Change payment status"
                          style={{ cursor: 'pointer', outline: 'none' }}
                        >
                          <option value="Paid">Paid</option>
                          <option value="Pending">Pending</option>
                          <option value="Failed">Failed</option>
                          <option value="Refunded">Refunded</option>
                        </select>
                      </td>
                      <td data-label="Amount">
                        <div className="amount-cell">₹{transaction.amount.toLocaleString()}</div>
                      </td>
                      <td data-label="Actions">
                        <div className="action-buttons">
                          <button
                            className="action-btn view-btn"
                            onClick={() => handleView(transaction.id)}
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(transaction.id)}
                            title="Hide Transaction"
                          >
                            <Trash2 size={14} />
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

        {/* Transaction Details Modal */}
        {isModalOpen && selectedTransaction && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Transaction Detail</h3>
                <button className="modal-close-btn" onClick={closeModal}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="transaction-info-grid">
                  <div className="info-card">
                    <div className="info-icon"><Hash size={18} /></div>
                    <div className="info-content">
                      <span className="info-label">Order ID</span>
                      <span className="info-value">{selectedTransaction.orderNumber}</span>
                    </div>
                  </div>
                  <div className="info-card">
                    <div className="info-icon"><User size={18} /></div>
                    <div className="info-content">
                      <span className="info-label">Customer</span>
                      <span className="info-value">{selectedTransaction.customerName}</span>
                    </div>
                  </div>
                  <div className="info-card">
                    <div className="info-icon"><Utensils size={18} /></div>
                    <div className="info-content">
                      <span className="info-label">Table No</span>
                      <span className="info-value">{selectedTransaction.tableNo}</span>
                    </div>
                  </div>
                  <div className="info-card">
                    <div className="info-icon"><Clock size={18} /></div>
                    <div className="info-content">
                      <span className="info-label">Date & Time</span>
                      <span className="info-value">{selectedTransaction.dateTime}</span>
                    </div>
                  </div>
                  <div className="info-card">
                    <div className="info-icon"><CreditCard size={18} /></div>
                    <div className="info-content">
                      <span className="info-label">Method</span>
                      <span className={`method-badge method-${selectedTransaction.paymentMethod.toLowerCase()}`}>
                        {selectedTransaction.paymentMethod}
                      </span>
                    </div>
                  </div>
                  <div className="info-card">
                    <div className="info-icon"><CheckCircle size={18} /></div>
                    <div className="info-content">
                      <span className="info-label">Status</span>
                      <span className={`payment-status-pill status-${selectedTransaction.statusColor}`}>
                        {selectedTransaction.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="order-items-section">
                  <h4 className="section-title">Order Summary</h4>
                  <div className="items-container">
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th>Item Name</th>
                          <th>Qty</th>
                          <th>Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTransaction.orderItems.map((item, index) => (
                          <tr key={index}>
                            <td>{item.name}</td>
                            <td>{item.quantity}</td>
                            <td>₹{item.price}</td>
                            <td>₹{item.price * item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="payment-summary-box">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>₹{selectedTransaction.amount.toLocaleString()}</span>
                  </div>
                  <div className="summary-row grand-total">
                    <span>Total Amount</span>
                    <span>₹{selectedTransaction.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;