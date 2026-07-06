import React from 'react';
import { X, CheckCircle, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import type { DashboardOrder } from '../services/supabaseService';

export interface OrderDetailsDialogProps {
  order: DashboardOrder | null;
  onClose: () => void;
  onUpdateStatus?: (orderId: string, status: string) => void;
  onCancel?: (order: DashboardOrder) => void;
  onMarkPaid?: (orderId: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({
  order,
  onClose,
  onUpdateStatus,
  onCancel,
  onMarkPaid,
  onPrev,
  onNext,
  hasPrev,
  hasNext
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4 animate-[fadeIn_0.2s_ease]" onClick={onClose}>
      <div className="bg-tk-bg-card rounded-2xl p-4 sm:p-5 max-w-[420px] w-full max-h-[85vh] overflow-auto border-[1.5px] border-tk-border shadow-[0_20px_60px_rgba(0,0,0,0.12)] animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center pb-3 border-b border-tk-border mb-4">
          <h2 className="text-base font-normal text-tk-text">{order.orderNumber}</h2>
          <div className="flex items-center gap-1">
            {onPrev && (
              <button
                disabled={!hasPrev}
                onClick={onPrev}
                className="bg-transparent border-none cursor-pointer p-1.5 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-tk-bg-hover disabled:opacity-30 disabled:hover:bg-transparent"
                title="Previous Order"
              >
                <ChevronLeft size={20} color="#718096" />
              </button>
            )}
            {onNext && (
              <button
                disabled={!hasNext}
                onClick={onNext}
                className="bg-transparent border-none cursor-pointer p-1.5 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-tk-bg-hover disabled:opacity-30 disabled:hover:bg-transparent"
                title="Next Order"
              >
                <ChevronRight size={20} color="#718096" />
              </button>
            )}
            <button className="bg-transparent border-none cursor-pointer p-1.5 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-tk-bg-hover" onClick={onClose}>
              <X size={20} color="#718096" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[11px] text-tk-text-secondary mb-0.5">Table</div>
              <div className="text-sm font-semibold text-tk-text truncate">{order.table}</div>
            </div>
            <div>
              <div className="text-[11px] text-tk-text-secondary mb-0.5">Time</div>
              <div className="text-sm font-semibold text-tk-text whitespace-nowrap">{order.time}</div>
            </div>
            <div>
              <div className="text-[11px] text-tk-text-secondary mb-0.5">Customer</div>
              <div className="text-sm font-semibold text-tk-text truncate">{order.customer?.split(' ')[0] || ''}</div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="text-xs text-tk-text-secondary mb-1.5">Items Ordered</div>
            <div className="flex flex-col gap-2">
              {order.rawItems && order.rawItems.map((item, idx) => (
                <div key={idx} className="flex justify-between p-2 bg-tk-bg-hover rounded-xl">
                  <div>
                    <div className="text-xs font-semibold text-tk-text">{item.name}</div>
                    <div className="text-[10px] text-tk-text-secondary">Qty: {item.quantity}</div>
                  </div>
                  <div className="text-xs font-semibold text-tk-text">&#8377;{item.price || 0}</div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-2 border-t border-tk-border mt-1.5">
                <span className="text-xs font-semibold text-tk-text">Total</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-tk-burgundy">&#8377;{order.total}</span>
                  <div className="flex items-center gap-1">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold whitespace-nowrap ${order.isPaid ? 'bg-[#C6F6D5] text-[#22543D]' : 'bg-[#FEF2F2] text-[#E53E3E]'}`}>
                      {order.isPaid ? 'Paid' : 'Pending'}
                    </span>
                    {!order.isPaid && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onMarkPaid && onMarkPaid(order.id); }}
                        className="p-0.5 bg-[#C6F6D5] text-[#22543D] rounded hover:bg-[#9AE6B4] transition-colors flex items-center justify-center shrink-0"
                        title="Mark Paid"
                      >
                        <CheckCircle size={10} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking Progress Bar */}
          <div className="py-2 border-t border-b border-tk-border border-dashed my-1">
            <div className="text-[11px] text-tk-text-secondary mb-3">Order Status Tracking</div>
            <div className="flex items-center justify-between w-full px-2">
              {order.status?.toUpperCase() === 'CANCELLED' ? (
                <div className="flex-1 flex items-center relative">
                  <div className="flex flex-col items-center relative group">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center border-[2px] z-10 bg-[#E53E3E] border-[#E53E3E]">
                      <Check size={12} className="text-white" strokeWidth={3} />
                    </div>
                    <span className="absolute top-6 text-[9px] font-medium text-[#E53E3E] whitespace-nowrap">Placed</span>
                  </div>
                  <div className="flex-1 h-[2px] mx-1 transition-colors bg-[#E53E3E]"></div>
                  <div className="flex flex-col items-center relative group">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center border-[2px] z-10 bg-[#E53E3E] border-[#E53E3E]">
                      <X size={12} className="text-white" strokeWidth={3} />
                    </div>
                    <span className="absolute top-6 text-[9px] font-bold text-[#E53E3E] whitespace-nowrap">Cancelled</span>
                  </div>
                </div>
              ) : (
                <>
                  {[
                    { label: 'Accept', value: 'CONFIRMED' },
                    { label: 'Preparing', value: 'PREPARING' },
                    { label: 'Ready', value: 'READY' }
                  ].map((step, stepIdx, arr) => {
                    const getStatusIdx = (status: string) => {
                      switch (status?.toUpperCase()) {
                        case 'PENDING': return -1;
                        case 'CONFIRMED': return 0;
                        case 'PREPARING': return 1;
                        case 'READY': return 2;
                        case 'COMPLETED':
                        case 'SERVED': return 2;
                        default: return -1;
                      }
                    };
                    const currentIndex = getStatusIdx(order.status);
                    const isCompleted = stepIdx <= currentIndex;
                    const isNext = stepIdx === currentIndex + 1;
                    const isLast = stepIdx === arr.length - 1;

                    return (
                      <React.Fragment key={step.value}>
                        <div className="flex flex-col items-center relative group">
                          <button
                            onClick={() => {
                              if (isNext && onUpdateStatus) onUpdateStatus(order.id, step.value);
                            }}
                            disabled={!isNext || !onUpdateStatus}
                            className={`w-5 h-5 rounded-full flex items-center justify-center border-[2px] z-10 transition-all duration-300 relative group/btn
                            ${isCompleted ? 'bg-[#16a34a] border-[#16a34a] text-white' :
                                isNext && onUpdateStatus ? 'bg-white border-[#16a34a] cursor-pointer hover:bg-[#16a34a] hover:text-white hover:scale-110 active:scale-95' :
                                  'bg-white border-[#E2E8F0] cursor-default'}
                          `}
                          >
                            {isNext && onUpdateStatus && (
                              <span className="absolute inset-0 rounded-full border border-dashed border-[#16a34a]/60 animate-[spin_6s_linear_infinite]" style={{ margin: '-4px' }} />
                            )}
                            {isNext && onUpdateStatus && (
                              <span className="absolute inset-0 rounded-full bg-[#16a34a]/10 animate-ping" style={{ margin: '-1px' }} />
                            )}
                            {(isCompleted || (isNext && onUpdateStatus)) && (
                              <Check size={12} className={`text-white transition-all duration-300 ${isCompleted ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover/btn:opacity-100 group-hover/btn:scale-100'}`} strokeWidth={3} />
                            )}
                          </button>
                          <span className={`absolute top-6 text-[9px] font-medium whitespace-nowrap
                          ${isCompleted || (isNext && onUpdateStatus) ? 'text-tk-text' : 'text-[#A0AEC0]'}
                        `}>
                            {step.label}
                          </span>
                        </div>
                        {!isLast && (
                          <div className={`flex-1 h-[2px] mx-1 transition-colors
                          ${stepIdx < currentIndex ? 'bg-[#16a34a]' : 'bg-[#E2E8F0]'}
                        `} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </>
              )}
            </div>
            {/* Spacer for absolute top-6 labels */}
            <div className="h-6"></div>
          </div>

          <div className="flex justify-start items-center mt-1">
            {onCancel && order.status?.toUpperCase() !== 'CANCELLED' && order.status?.toUpperCase() !== 'COMPLETED' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(order);
                }}
                className="px-2.5 py-1 bg-[#FEF2F2] text-[#E53E3E] border border-[#FC8181] rounded text-[11px] font-semibold hover:bg-[#FED7D7] transition-colors cursor-pointer"
              >
                Cancel Order
              </button>
            )}
            {order.status?.toUpperCase() === 'CANCELLED' && (
              <span className="px-2.5 py-1 bg-[#FEF2F2] text-[#E53E3E] rounded text-[11px] font-bold">
                Cancelled
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsDialog;
