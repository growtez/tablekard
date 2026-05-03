import React from 'react';
import { Check, ArrowUp, X, Loader2, RefreshCw, Clock, AlertTriangle, LogOut } from 'lucide-react';
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

/** Format an ISO timestamp into a date + time string */
function formatDateTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
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

/* ──────────────────── OrderItem component ─────────────── */

const OrderItem = ({ name, qty, details, specialInstructions, timestamp }) => (
  <div className="order-item">
    <div className="order-item-row">
      <span className="item-name">
        {name} <span className="item-qty">×{qty}</span>
      </span>
      {timestamp && (
        <span className="item-timestamp">
          <Clock size={10} /> {formatTime(timestamp)}
        </span>
      )}
    </div>
    {details && <div className="item-detail">{details}</div>}
    {specialInstructions && (
      <div className="item-instructions">
        <AlertTriangle size={10} /> {specialInstructions}
      </div>
    )}
  </div>
);

/* ──────────────────── OrderCard component ─────────────── */

const OrderCard = ({
  id,
  orderNumber,
  createdAt,
  items,
  status,
  onMarkReady,
  onPromote,
  onCancel,
}) => {
  return (
    <div className="order-card">
      <div className="order-info">
        <div className="order-number-wrapper">
          <div className="order-number">{orderNumber}</div>
          <div className="order-time">{formatTime(createdAt)}</div>
        </div>
        <div className="order-items">
          {items.map((item) => (
            <OrderItem
              key={item.id}
              name={item.name}
              qty={item.quantity}
              details={buildDetailString(item)}
              specialInstructions={item.special_instructions}
              timestamp={item.created_at}
            />
          ))}
        </div>
      </div>
      <div className="order-meta">
        <span className="order-date">{formatDateTime(createdAt)}</span>
        <span className="order-item-count">{items.length} item{items.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="order-actions">
        {status === 'preparing' ? (
          <button className="btn btn-check" onClick={() => onMarkReady(id)} title="Mark as Ready">
            <Check className="icon" size={24} color="#000" strokeWidth={3} />
          </button>
        ) : (
          <>
            <button className="btn btn-up" onClick={() => onPromote(id)} title="Move to Preparing">
              <ArrowUp className="icon" size={24} color="#000" strokeWidth={3} />
            </button>
            <button className="btn btn-remove" onClick={() => onCancel(id)} title="Cancel Order">
              <X className="icon" size={24} color="#000" strokeWidth={3} />
            </button>
          </>
        )}
      </div>
    </div>
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
