import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTransactionDetails } from '../hooks/useSupabaseQuery';
import { 
  CreditCard, 
  Banknote, 
  ArrowLeft,
  User,
  Phone,
  Mail,
  Hash,
  Clock,
  MapPin
} from 'lucide-react';
import './transaction_detail.css';

const TransactionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: transaction, isLoading, isError } = useTransactionDetails(id);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading transaction details...</p>
        </div>
      </div>
    );
  }

  if (isError || !transaction) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="error-container">
          <p>Error loading transaction details or transaction not found.</p>
          <button className="back-button" onClick={() => navigate(-1)} style={{ marginTop: '16px', background: '#E2E8F0', padding: '8px 16px', borderRadius: '8px' }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isOnline = transaction.paymentMethod.toLowerCase() !== 'cash';

  return (
    <>
      <div className="header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="page-title">Transaction Details</h1>
        </div>

        <div className="transaction-content-grid">
          {/* Left Column: Order Items & Summary */}
          <div className="left-column">
            <div className="detail-card">
              <div className="card-header">
                <h2 className="card-title">Order Items</h2>
              </div>
              
              <table className="order-items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {transaction.orderItems.map((item, index) => (
                    <tr key={index}>
                      <td className="item-name">{item.name}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td className="text-right">₹{item.price.toLocaleString()}</td>
                      <td className="text-right">₹{(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="financial-summary">
                <div className="summary-row">
                  <span className="summary-label">Subtotal</span>
                  <span className="summary-value">₹{transaction.subtotal.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Taxes</span>
                  <span className="summary-value">₹{transaction.taxes.toLocaleString()}</span>
                </div>
                {transaction.discount > 0 && (
                  <div className="summary-row">
                    <span className="summary-label">Discount</span>
                    <span className="summary-value" style={{ color: '#E53E3E' }}>-₹{transaction.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span className="summary-label">Total Amount</span>
                  <span className="summary-value">₹{transaction.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Information Cards */}
          <div className="right-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Payment Info */}
            <div className="detail-card">
              <div className="card-header">
                <h2 className="card-title">Payment Info</h2>
              </div>
              
              <div className="info-row">
                <span className="info-label">Status</span>
                <span className={`status-badge ${transaction.statusColor}`}>
                  {transaction.paymentStatus}
                </span>
              </div>
              
              <div className="info-row">
                <span className="info-label">Method</span>
                <span className="info-value payment-method-icon">
                  {isOnline ? <CreditCard size={16} /> : <Banknote size={16} />}
                  {transaction.paymentMethod}
                </span>
              </div>

              {transaction.transactionId && (
                <div className="info-row">
                  <span className="info-label">Transaction ID</span>
                  <span className="info-value">{transaction.transactionId}</span>
                </div>
              )}
            </div>

            {/* Order Info */}
            <div className="detail-card">
              <div className="card-header">
                <h2 className="card-title">Order Info</h2>
              </div>
              
              <div className="info-row">
                <span className="info-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Hash size={14} /> Order Number
                </span>
                <span className="info-value">{transaction.orderNumber}</span>
              </div>

              <div className="info-row">
                <span className="info-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} /> Date & Time
                </span>
                <span className="info-value">{transaction.dateTime}</span>
              </div>

              <div className="info-row">
                <span className="info-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} /> Table / Type
                </span>
                <span className="info-value">
                  {transaction.orderType === 'dine_in' ? transaction.tableNo : 'Takeaway'}
                </span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="detail-card">
              <div className="card-header">
                <h2 className="card-title">Customer Info</h2>
              </div>
              
              <div className="info-row">
                <span className="info-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} /> Name
                </span>
                <span className="info-value">{transaction.customerName}</span>
              </div>

              {transaction.customerPhone && (
                <div className="info-row">
                  <span className="info-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} /> Phone
                  </span>
                  <span className="info-value">{transaction.customerPhone}</span>
                </div>
              )}

              {transaction.customerEmail && (
                <div className="info-row">
                  <span className="info-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} /> Email
                  </span>
                  <span className="info-value">{transaction.customerEmail}</span>
                </div>
              )}
            </div>

          </div>
        </div>
    </>
  );
};

export default TransactionDetail;
