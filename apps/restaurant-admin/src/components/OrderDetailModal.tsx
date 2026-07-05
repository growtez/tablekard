import React from 'react';
import { X, Hash, User, Utensils, Clock, CreditCard, CheckCircle, Package, Receipt, Tag, ShoppingBag } from 'lucide-react';
import type { DashboardOrder } from '../services/supabaseService';

interface OrderDetailModalProps {
  order: DashboardOrder;
  onClose: () => void;
  onUpdateItemStatus?: (itemId: string, nextStatus: string) => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onClose, onUpdateItemStatus }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[4px] flex items-center justify-center z-[2000] p-0 sm:p-5 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-tk-bg-card shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] w-full max-w-[750px] h-[100vh] max-h-[100vh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden font-sans animate-in slide-in-from-bottom-5 duration-300 text-tk-text rounded-none sm:rounded-[24px]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 md:px-8 border-b border-tk-border bg-tk-bg-surface">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-tk-text m-0">Order Details</h3>
          </div>
          <button className="bg-transparent border-none cursor-pointer text-tk-text-secondary transition-all duration-200 p-1.5 rounded-full hover:bg-tk-bg-hover hover:text-tk-text" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          {/* Top Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {[
              { icon: <Hash size={18} />, label: "Order Number", value: `#${order.orderNumber}` },
              { icon: <User size={18} />, label: "Customer", value: order.customerName },
              { icon: <Utensils size={18} />, label: "Table / Spot", value: order.table },
              { icon: <Clock size={18} />, label: "Placed At", value: new Date(order.createdAt).toLocaleString() },
              { icon: <CreditCard size={18} />, label: "Payment Method", value: order.paymentMethod }
            ].map((info, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-tk-bg-elevated p-4 rounded-2xl border border-tk-border transition-transform duration-200 hover:-translate-y-0.5 hover:border-tk-text-muted">
                <div className="w-10 h-10 bg-tk-bg-surface text-[#4f755c] flex items-center justify-center rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.05)]">{info.icon}</div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-tk-text-secondary font-semibold uppercase tracking-[0.025em]">{info.label}</span>
                  <span className="text-sm font-semibold text-tk-text">{info.value}</span>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-4 bg-tk-bg-elevated p-4 rounded-2xl border border-tk-border transition-transform duration-200 hover:-translate-y-0.5 hover:border-tk-text-muted">
              <div className="w-10 h-10 bg-tk-bg-surface text-[#4f755c] flex items-center justify-center rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.05)]"><CheckCircle size={18} /></div>
              <div className="flex flex-col">
                <span className="text-[11px] text-tk-text-secondary font-semibold uppercase tracking-[0.025em]">Payment Status</span>
                <span className={`px-2 py-0.5 rounded-md text-sm font-semibold ${order.paymentStatusColor === 'failed' ? 'bg-[#f3bbbb] text-red-800' : ''}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-tk-bg-elevated p-4 rounded-2xl border border-tk-border transition-transform duration-200 hover:-translate-y-0.5 hover:border-tk-text-muted">
              <div className="w-10 h-10 bg-tk-bg-surface text-[#4f755c] flex items-center justify-center rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.05)]"><ShoppingBag size={18} /></div>
              <div className="flex flex-col">
                <span className="text-[11px] text-tk-text-secondary font-semibold uppercase tracking-[0.025em]">Order Type</span>
                <span className={`text-sm font-semibold ${order.orderType === 'dine_in' ? 'text-blue-700' : 'text-amber-900'}`}>
                  {order.orderType === 'dine_in' ? 'Dine In' : 'Takeaway'}
                </span>
              </div>
            </div>
          </div>

          {/* Order Items Table */}
          <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-4 text-[#4f755c]">
              <Package size={18} />
              <h4 className="m-0 text-base font-bold text-tk-text">Order Summary</h4>
            </div>
            <div className="bg-tk-bg-card border border-tk-border rounded-2xl overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left px-5 py-3 bg-tk-bg-elevated text-[11px] font-semibold text-tk-text-secondary uppercase border-b border-tk-border">Item</th>
                    <th className="text-left px-5 py-3 bg-tk-bg-elevated text-[11px] font-semibold text-tk-text-secondary uppercase border-b border-tk-border">Qty</th>
                    <th className="text-left px-5 py-3 bg-tk-bg-elevated text-[11px] font-semibold text-tk-text-secondary uppercase border-b border-tk-border">Price</th>
                    <th className="text-right px-5 py-3 bg-tk-bg-elevated text-[11px] font-semibold text-tk-text-secondary uppercase border-b border-tk-border">Total</th>
                  </tr>
                </thead>
                <tbody className="[&>tr:last-child>td]:border-b-0">
                  {order.orderItems.map((item, idx) => {
                    const itemStatus = (item as any).status || 'placed';
                    let badgeColor = '#FF9800'; // placed
                    if (itemStatus === 'preparing') badgeColor = '#3B82F6';
                    if (itemStatus === 'ready') badgeColor = '#22C55E';

                    return (
                      <tr key={idx}>
                        <td className="px-5 py-4 border-b border-tk-border text-sm text-tk-text align-top">
                          <div className="flex flex-col gap-1">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="font-semibold text-tk-text">{item.name}</span>
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
                              <span className="text-xs text-red-500 italic">Note: {item.special_instructions}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 border-b border-tk-border text-sm text-tk-text align-top">x{item.quantity}</td>
                        <td className="px-5 py-4 border-b border-tk-border text-sm text-tk-text align-top">₹{item.price}</td>
                        <td className="px-5 py-4 border-b border-tk-border text-sm text-tk-text align-top text-right">₹{item.price * item.quantity}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Billing Details */}
          <div>
            <div className="flex items-center gap-2.5 mb-4 text-[#4f755c]">
              <Receipt size={18} />
              <h4 className="m-0 text-base font-bold text-tk-text">Billing Details</h4>
            </div>
            <div className="bg-tk-bg-surface p-6 rounded-2xl border border-tk-border">
              <div className="flex justify-between mb-3 text-sm text-tk-text-secondary">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between mb-3 text-sm text-tk-text-secondary">
                <span>Taxes & Charges</span>
                <span>₹{order.taxes}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between mb-3 text-sm text-red-500">
                  <span>Discount</span>
                  <span>- ₹{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between mt-4 pt-4 border-t-2 border-dashed border-tk-border text-tk-text">
                <div className="flex items-center gap-2 font-bold text-lg">
                  <Tag size={16} />
                  <span>Grand Total</span>
                </div>
                <span className="text-2xl font-extrabold text-[#4f755c]">₹{order.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 md:px-8 bg-tk-bg-surface border-t border-tk-border flex justify-end gap-3">
          <button className="py-2.5 px-6 bg-tk-bg-elevated text-tk-text border border-tk-border rounded-xl font-semibold cursor-pointer transition-all duration-200 hover:bg-tk-bg-hover" onClick={() => window.print()}>
            Print Receipt
          </button>
          <button className="py-2.5 px-6 bg-[#4f755c] text-white border-none rounded-xl font-semibold cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(79,117,92,0.2)] hover:bg-[#3d5a47] hover:-translate-y-[1px]" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
