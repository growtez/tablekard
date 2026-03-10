import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Download, Calendar, CreditCard, CheckCircle, Eye, Trash2, X } from 'lucide-react';
import './payment.css';
import Sidebar from '../components/sidebar';
import { useAuth } from '../context/AuthContext';
import { getPaymentTransactions, updatePaymentStatus } from '../services/supabaseService';
import type { PaymentTransaction } from '../services/supabaseService';

// Main Payment Component
const Payment: React.FC = () => {
  const { activeRestaurantId } = useAuth();
  const [selectedDateRange, setSelectedDateRange] = useState<string>('today');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);

  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (activeRestaurantId) {
      fetchTransactions();
    }
  }, [activeRestaurantId]);

  const fetchTransactions = async () => {
    if (!activeRestaurantId) return;
    setLoading(true);
    try {
      const data = await getPaymentTransactions(activeRestaurantId);
      setTransactions(data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      alert('Failed to load payment transactions.');
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions based on selected filters
  const filteredTransactions = transactions.filter(transaction => {
    const methodMatch = selectedPaymentMethod === 'all' || transaction.paymentMethod === selectedPaymentMethod;
    const statusMatch = selectedPaymentStatus === 'all' || transaction.paymentStatus === selectedPaymentStatus;
    return methodMatch && statusMatch;
  });

  // Calculate totals dynamically
  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfLastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 7);

    let todayRev = 0;
    let yesterdayRev = 0;
    let weekRev = 0;
    let lastWeekRev = 0;

    transactions.forEach(t => {
      // Only count if paid/completed if logic requires, but since schema says 'pending/paid/failed/refunded',
      // let's only count 'Paid' status transactions for completed revenue.
      if (t.paymentStatus.toLowerCase() !== 'paid') return;

      const tDate = new Date(t.createdAt);
      if (tDate >= startOfToday) todayRev += t.amount;
      else if (tDate >= startOfYesterday) yesterdayRev += t.amount;

      if (tDate >= startOfWeek) weekRev += t.amount;
      else if (tDate >= startOfLastWeek) lastWeekRev += t.amount;
    });

    const todayChange = yesterdayRev === 0 ? (todayRev > 0 ? 100 : 0) : Math.round(((todayRev - yesterdayRev) / yesterdayRev) * 100);
    const weekChange = lastWeekRev === 0 ? (weekRev > 0 ? 100 : 0) : Math.round(((weekRev - lastWeekRev) / lastWeekRev) * 100);

    return { todayRev, weekRev, todayChange, weekChange };
  }, [transactions]);

  const handleExportReport = () => {
    console.log('Exporting report...');
    // Implementation for exporting report
  };

  const handleView = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      setSelectedTransaction(transaction);
      setIsModalOpen(true);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await updatePaymentStatus(id, 'paid');
      setTransactions(transactions.map(transaction =>
        transaction.id === id
          ? { ...transaction, paymentStatus: 'Paid', statusColor: 'paid' }
          : transaction
      ));
    } catch (err) {
      console.error(err);
      alert('Failed to mark as paid');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction from view? (Not deleted from DB)')) {
      setTransactions(transactions.filter(transaction => transaction.id !== id));
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
        </div>

        <div className="revenue-grid">
          <div className="revenue-card">
            <div className="card-top-bar card-top-bar-green"></div>
            <h3 className="card-title">Revenue Today</h3>
            <div className="revenue-amount">₹ {loading ? '...' : stats.todayRev.toLocaleString()}</div>
            <div className="revenue-change">
              <span
                className={stats.todayChange >= 0 ? "change-text change-positive" : "change-text change-negative"}
                style={{ color: stats.todayChange < 0 ? '#E53E3E' : undefined }}
              >
                {stats.todayChange > 0 ? '+' : ''}{stats.todayChange}% vs yesterday
              </span>
              <TrendingUp
                size={16}
                color={stats.todayChange >= 0 ? "#68D391" : "#E53E3E"}
                className="trend-icon"
                style={stats.todayChange < 0 ? { transform: 'rotate(180deg)' } : undefined}
              />
            </div>
          </div>

          <div className="revenue-card">
            <div className="card-top-bar card-top-bar-blue"></div>
            <h3 className="card-title">Revenue This Week</h3>
            <div className="revenue-amount">₹ {loading ? '...' : stats.weekRev.toLocaleString()}</div>
            <div className="revenue-change">
              <span
                className={stats.weekChange >= 0 ? "change-text change-blue" : "change-text change-negative"}
                style={{ color: stats.weekChange < 0 ? '#E53E3E' : undefined }}
              >
                {stats.weekChange > 0 ? '+' : ''}{stats.weekChange}% vs last week
              </span>
              <TrendingUp
                size={16}
                color={stats.weekChange >= 0 ? "#7F9CF5" : "#E53E3E"}
                className="trend-icon"
                style={stats.weekChange < 0 ? { transform: 'rotate(180deg)' } : undefined}
              />
            </div>
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
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Wallet">Wallets</option>
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
            <h2 className="table-title">Completed Payments</h2>
            {/* <button className="view-all-btn" onClick={() => setShowAllPayments(true)}>View All</button> */}
            {/* <div className="payment-summary">
              Total: ₹{totalRevenue.toLocaleString()} ({filteredTransactions.length} transactions)
            </div> */}
          </div>

          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer Name</th>
                <th>Date & Time</th>
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
                    <td>
                      <div className="order-id-cell">{transaction.orderNumber}</div>
                    </td>
                    <td>
                      <div className="customer-name-cell">{transaction.customerName}</div>
                    </td>
                    <td>
                      <div className="datetime-cell">{transaction.dateTime}</div>
                    </td>
                    <td>
                      <span className={`payment-status-pill status-${transaction.statusColor}`}>
                        {transaction.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <div className="amount-cell">₹{transaction.amount.toLocaleString()}</div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn view-btn"
                          onClick={() => handleView(transaction.id)}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        {transaction.paymentStatus === 'Pending' && (
                          <button
                            className="action-btn paid-btn"
                            onClick={() => handleMarkPaid(transaction.id)}
                            title="Mark as Paid"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
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

        {/* Transaction Details Modal */}
        {isModalOpen && selectedTransaction && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Transaction Details</h3>
                <button className="modal-close-btn" onClick={closeModal}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="detail-section">
                  <div className="detail-row">
                    <span className="detail-label">Order ID:</span>
                    <span className="detail-value">{selectedTransaction.orderNumber}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Customer Name:</span>
                    <span className="detail-value">{selectedTransaction.customerName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Table No:</span>
                    <span className="detail-value">{selectedTransaction.tableNo}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date & Time:</span>
                    <span className="detail-value">{selectedTransaction.dateTime}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Payment Method:</span>
                    <span className={`method-badge method-${selectedTransaction.paymentMethod.toLowerCase()}`}>
                      {selectedTransaction.paymentMethod}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Payment Status:</span>
                    <span className={`payment-status-pill status-${selectedTransaction.statusColor}`}>
                      {selectedTransaction.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="order-items-section">
                  <h4 className="section-title">Order Items</h4>
                  <div className="order-items-list">
                    {selectedTransaction.orderItems.map((item, index) => (
                      <div key={index} className="order-item">
                        <div className="item-info">
                          <span className="item-name">{item.name}</span>
                          <span className="item-quantity">x{item.quantity}</span>
                        </div>
                        <span className="item-price">₹{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="total-section">
                  <div className="total-row">
                    <span className="total-label">Total Amount:</span>
                    <span className="total-amount">₹{selectedTransaction.amount.toLocaleString()}</span>
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