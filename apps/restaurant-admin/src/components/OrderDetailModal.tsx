import React from 'react';
import { X, Hash, User, Utensils, Clock, CreditCard, CheckCircle, Package, Receipt, Tag, ShoppingBag } from 'lucide-react';
import type { DashboardOrder } from '../services/supabaseService';
import './OrderDetailModal.css';

interface OrderDetailModalProps {
  order: DashboardOrder;
  onClose: () => void;
  onUpdateItemStatus?: (itemId: string, nextStatus: string) => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onClose, onUpdateItemStatus }) => {
  return (
    <div className="order-modal-overlay" onClick={onClose}>
      <div className="order-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="order-modal-header">
          <div className="order-header-main">
            <h3 className="order-modal-title">Order Details</h3>
          </div>
          <button className="order-modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="order-modal-body">
          {/* Top Info Grid */}
          <div className="order-info-grid">
            <div className="order-info-card">
              <div className="order-info-icon"><Hash size={18} /></div>
              <div className="order-info-text">
                <span className="order-info-label">Order Number</span>
                <span className="order-info-value">#{order.orderNumber}</span>
              </div>
            </div>
            <div className="order-info-card">
              <div className="order-info-icon"><User size={18} /></div>
              <div className="order-info-text">
                <span className="order-info-label">Customer</span>
                <span className="order-info-value">{order.customerName}</span>
              </div>
            </div>
            <div className="order-info-card">
              <div className="order-info-icon"><Utensils size={18} /></div>
              <div className="order-info-text">
                <span className="order-info-label">Table / Spot</span>
                <span className="order-info-value">{order.table}</span>
              </div>
            </div>
            <div className="order-info-card">
              <div className="order-info-icon"><Clock size={18} /></div>
              <div className="order-info-text">
                <span className="order-info-label">Placed At</span>
                <span className="order-info-value">{new Date(order.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <div className="order-info-card">
              <div className="order-info-icon"><CreditCard size={18} /></div>
              <div className="order-info-text">
                <span className="order-info-label">Payment Method</span>
                <span className="order-info-value">{order.paymentMethod}</span>
              </div>
            </div>
            <div className="order-info-card">
              <div className="order-info-icon"><CheckCircle size={18} /></div>
              <div className="order-info-text">
                <span className="order-info-label">Payment Status</span>
                <span className={`order-status-tag ${order.paymentStatusColor}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
            <div className="order-info-card">
              <div className="order-info-icon"><ShoppingBag size={18} /></div>
              <div className="order-info-text">
                <span className="order-info-label">Order Type</span>
                <span className={`order-type-tag ${order.orderType}`}>
                  {order.orderType === 'dine_in' ? 'Dine In' : 'Takeaway'}
                </span>
              </div>
            </div>
          </div>

          {/* Order Items Table */}
          <div className="order-items-container">
            <div className="order-section-title">
              <Package size={18} />
              <h4>Order Summary</h4>
            </div>
            <div className="order-items-list">
              <table className="order-items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.orderItems.map((item, idx) => {
                    const itemStatus = (item as any).status || 'placed';
                    let badgeColor = '#FF9800'; // placed
                    if (itemStatus === 'preparing') badgeColor = '#3B82F6';
                    if (itemStatus === 'ready') badgeColor = '#22C55E';

                    return (
                      <tr key={idx}>
                        <td>
                          <div className="item-name-cell">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="item-name">{item.name}</span>
                              <select
                                value={itemStatus}
                                onChange={(e) => onUpdateItemStatus?.((item as any).id, e.target.value)}
                                style={{ 
                                  fontSize: '11px', 
                                  padding: '2px 8px', 
                                  borderRadius: '8px', 
                                  fontWeight: 'bold',
                                  color: badgeColor,
                                  backgroundColor: badgeColor + '12',
                                  border: `1px solid ${badgeColor}30`,
                                  cursor: onUpdateItemStatus ? 'pointer' : 'default',
                                  textTransform: 'capitalize',
                                  outline: 'none'
                                }}
                                disabled={!onUpdateItemStatus}
                              >
                                <option value="placed">Placed</option>
                                <option value="preparing">Preparing</option>
                                <option value="ready">Ready</option>
                              </select>
                            </div>
                            {item.special_instructions && (
                              <span className="item-instruction">Note: {item.special_instructions}</span>
                            )}
                          </div>
                        </td>
                        <td>x{item.quantity}</td>
                        <td>₹{item.price}</td>
                        <td className="text-right">₹{item.price * item.quantity}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Billing Details */}
          <div className="order-billing-section">
            <div className="order-section-title">
              <Receipt size={18} />
              <h4>Billing Details</h4>
            </div>
            <div className="order-summary-box">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="summary-row">
                <span>Taxes & Charges</span>
                <span>₹{order.taxes}</span>
              </div>
              {order.discount > 0 && (
                <div className="summary-row discount">
                  <span>Discount</span>
                  <span>- ₹{order.discount}</span>
                </div>
              )}
              <div className="summary-row grand-total">
                <div className="total-label">
                  <Tag size={16} />
                  <span>Grand Total</span>
                </div>
                <span>₹{order.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="order-modal-footer">
          <button className="order-modal-print-btn" onClick={() => window.print()}>
            Print Receipt
          </button>
          <button className="order-modal-done-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
