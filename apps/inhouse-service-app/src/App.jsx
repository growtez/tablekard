import React, { useState } from 'react';
import { Check, ArrowUp, X, Loader2, RefreshCw, ChevronDown, AlertTriangle, LogOut } from 'lucide-react';
import { useOrders } from './hooks/useOrders';
import { useAuth } from './context/AuthContext';
import LoginScreen from './components/LoginScreen';

/* ──────────────────────── helpers ──────────────────────── */

/** Format an ISO timestamp into a short, readable time string */
function formatTime(isoString) {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/** Build a human-readable detail string from variant, addons, special_instructions */
function buildDetailString(item) {
  const parts = [];

  // Variant
  if (item.variant) {
    if (typeof item.variant === 'string') {
      parts.push(item.variant);
    } else if (item.variant.name) {
      parts.push(item.variant.name);
    } else if (item.variant.label) {
      parts.push(item.variant.label);
    }
  }

  // Addons
  if (item.addons) {
    let addonList = item.addons;
    if (!Array.isArray(addonList)) addonList = [addonList];
    const addonNames = addonList
      .map((a) => (typeof a === 'string' ? a : a.name || a.label || ''))
      .filter(Boolean);
    if (addonNames.length) parts.push(addonNames.join(', '));
  }

  return parts.join(' · ');
}

/** Get table number from order's joined restaurant_tables */
function getTableNumber(order) {
  if (order.restaurant_tables && order.restaurant_tables.table_number != null) {
    return String(order.restaurant_tables.table_number).padStart(2, '0');
  }
  return '--';
}

/* ──────────────── OrderItemsDialog component ──────────── */

const OrderItemsDialog = ({ items, orderNumber, tableNumber, type, status, onAction, onClose }) => (
  <div className="dialog-overlay" onClick={onClose}>
    <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
      <div className="dialog-header">
        <div className="dialog-title-row">
          <span className="dialog-title">Order Items</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {type && <span className="dialog-type-badge">{String(type).replace('_', ' ').toUpperCase()}</span>}
            <span className="dialog-order-badge">#{String(orderNumber || '').slice(-4).toUpperCase()}</span>
          </div>
        </div>
        {tableNumber !== '--' && (
          <span className="dialog-table-label">Table {tableNumber}</span>
        )}
        <button className="dialog-close" onClick={onClose}>
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="dialog-items">
        {items.length === 0 ? (
          <div className="dialog-empty">No items in this order</div>
        ) : (
          items.map((item) => {
            const details = buildDetailString(item);
            return (
              <div key={item.id} className="dialog-item">
                <div className="dialog-item-main">
                  <span className="dialog-item-name">{item.name}</span>
                  <span className="dialog-item-qty">×{item.quantity}</span>
                </div>
                {details && <div className="dialog-item-detail">{details}</div>}
                {item.special_instructions && (
                  <div className="dialog-item-instructions">
                    <AlertTriangle size={11} /> {item.special_instructions}
                  </div>
                )}
                <div className="dialog-item-meta" style={{ justifyContent: 'flex-end' }}>
                  <span className="dialog-item-time">{formatTime(item.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="dialog-footer">
        <span className="dialog-total-items">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        <button 
          className={status === 'preparing' ? "btn btn-check" : "btn btn-up"} 
          onClick={onAction} 
          style={{ padding: '8px 16px', flex: 'none', display: 'flex', gap: '6px', alignItems: 'center' }}
        >
          {status === 'preparing' ? <Check size={20} strokeWidth={3} /> : <ArrowUp size={20} strokeWidth={3} />}
          <span>{status === 'preparing' ? 'DONE' : 'PROCEED'}</span>
        </button>
      </div>
    </div>
  </div>
);

/* ──────────────────── OrderCard component ─────────────── */

const OrderCard = ({
  id,
  orderNumber,
  tableNumber,
  type,
  createdAt,
  items,
  status,
  onMarkReady,
  onPromote,
  onCancel,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="order-card">
        {/* Top row: table number + order info */}
        <div className="card-top">
          <div className="table-section">
            <span className="table-label">TABLE NO.</span>
            <div className="table-number-oval">
              <span className="table-number-value">{tableNumber}</span>
            </div>
          </div>
          <div className="card-right">
            <div className="order-badge">#{String(orderNumber || '').slice(-4).toUpperCase()}</div>
            <div className="order-time">{formatTime(createdAt)}</div>
            <button className="order-items-trigger" onClick={() => setDialogOpen(true)}>
              <span>ORDER ITEMS</span>
              <ChevronDown size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Bottom row: action buttons */}
        <div className="order-actions">
          {status === 'preparing' ? (
            <button className="btn btn-check" onClick={() => onMarkReady(id)} title="Mark as Ready">
              <Check className="icon" size={20} color="#000" strokeWidth={3} />
              <span style={{ marginLeft: '6px' }}>DONE</span>
            </button>
          ) : (
            <>
              <button className="btn btn-up" onClick={() => onPromote(id)} title="Move to Preparing">
                <ArrowUp className="icon" size={20} color="#000" strokeWidth={3} />
                <span style={{ marginLeft: '6px' }}>PROCEED</span>
              </button>
              <button className="btn btn-remove" onClick={() => onCancel(id)} title="Cancel Order">
                <X className="icon" size={20} color="#000" strokeWidth={3} />
                <span style={{ marginLeft: '6px' }}>DENY</span>
              </button>
            </>
          )}
        </div>
      </div>

      {dialogOpen && (
        <OrderItemsDialog
          items={items}
          orderNumber={orderNumber}
          tableNumber={tableNumber}
          type={type}
          status={status}
          onAction={() => {
            if (status === 'preparing') onMarkReady(id);
            else onPromote(id);
            setDialogOpen(false);
          }}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </>
  );
};

/* ──────────────── Empty-state component ───────────────── */

const EmptyState = ({ message }) => (
  <div className="empty-state">{message}</div>
);

/* ──────────────────── App component ───────────────────── */

function App() {
  const { isAuthenticated, loading: authLoading, signOut } = useAuth();

  // Show a full-screen spinner while auth is initialising
  if (authLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div className="loading-state">
          <Loader2 className="spin" size={32} />
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  // Gate: must be signed in
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <OrdersView onSignOut={signOut} />;
}

/** The main orders UI, shown only after successful auth */
function OrdersView({ onSignOut }) {
  const {
    preparingOrders,
    queueOrders,
    loading,
    error,
    refresh,
    handlePromote,
    handleMarkReady,
    handleCancel,
  } = useOrders();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <header className="header">
        <div className="header-row">
          <div className="logo">TABLEKARD</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-refresh" onClick={refresh} title="Refresh orders">
              <RefreshCw size={18} />
            </button>
            <button className="btn-refresh" onClick={onSignOut} title="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <Loader2 className="spin" size={32} />
          <span>Loading orders…</span>
        </div>
      ) : (
        <>
          {/* ── PREPARING section ─────────────────────────── */}
          <div className="section-bar section-preparing">PREPARING</div>
          <div className="orders-container">
            {preparingOrders.length === 0 ? (
              <EmptyState message="No orders being prepared" />
            ) : (
              preparingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  id={order.id}
                  orderNumber={order.order_number}
                  tableNumber={getTableNumber(order)}
                  type={order.type}
                  createdAt={order.created_at}
                  items={order.order_items ?? []}
                  status={order.status}
                  onMarkReady={handleMarkReady}
                  onPromote={handlePromote}
                  onCancel={handleCancel}
                />
              ))
            )}
          </div>

          {/* ── ORDER QUEUE section ───────────────────────── */}
          <div className="section-bar section-queue">ORDER QUEUE</div>
          <div className="orders-container">
            {queueOrders.length === 0 ? (
              <EmptyState message="No orders in queue" />
            ) : (
              queueOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  id={order.id}
                  orderNumber={order.order_number}
                  tableNumber={getTableNumber(order)}
                  type={order.type}
                  createdAt={order.created_at}
                  items={order.order_items ?? []}
                  status={order.status}
                  onMarkReady={handleMarkReady}
                  onPromote={handlePromote}
                  onCancel={handleCancel}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
