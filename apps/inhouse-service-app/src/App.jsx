import React, { useState, useEffect } from 'react';
import { Check, ArrowUp, X, Loader2, RefreshCw, ChevronDown, AlertTriangle, LogOut } from 'lucide-react';
import { supabase } from '@restaurant-saas/supabase';
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
  onUpdateItemStatus,
}) => {
  const [expanded, setExpanded] = useState(false);
  const allItemsReady = items.length > 0 && items.every((item) => item.status === 'ready');

  return (
    <div className={`order-card${expanded ? ' order-card--expanded' : ''}`}>
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
          <button className="order-items-trigger" onClick={() => setExpanded((v) => !v)}>
            <span>ORDER ITEMS</span>
            <ChevronDown
              size={18}
              strokeWidth={2.5}
              className={`expand-chevron${expanded ? ' expand-chevron--open' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Expandable items section */}
      <div className={`card-expand-wrapper${expanded ? ' card-expand-wrapper--open' : ''}`}>
        <div className="card-expand-inner">
          {/* Type badge row */}
          {type && (
            <div className="expand-type-row">
              <span className="expand-type-badge">{String(type).replace('_', ' ').toUpperCase()}</span>
            </div>
          )}

          <div className="expand-items">
            {items.length === 0 ? (
              <div className="expand-empty">No items in this order</div>
            ) : (
              items.map((item) => {
                const details = buildDetailString(item);
                const itemStatus = item.status || 'placed';
                return (
                  <div key={item.id} className="expand-item" style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)', paddingBottom: '10px', marginBottom: '10px' }}>
                    <div className="expand-item-main" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span className="expand-item-name">{item.name}</span>
                        <span className="expand-item-qty">×{item.quantity}</span>
                      </div>
                      
                      {/* Interactive status buttons for items with theme colors */}
                      <div className="item-status-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {itemStatus === 'placed' && (
                          <>
                            <button 
                              onClick={() => onUpdateItemStatus(item.id, 'preparing')} 
                              style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px', border: 'none', background: '#8B3A1E', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              PREPARE
                            </button>
                            <button 
                              onClick={() => onUpdateItemStatus(item.id, 'ready')} 
                              style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px', border: 'none', background: '#82b366', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              READY
                            </button>
                          </>
                        )}
                        {itemStatus === 'preparing' && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: '#92400E', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                              Preparing
                            </span>
                            <button 
                              onClick={() => onUpdateItemStatus(item.id, 'ready')} 
                              style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px', border: 'none', background: '#82b366', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              READY
                            </button>
                          </div>
                        )}
                        {itemStatus === 'ready' && (
                          <span style={{ fontSize: '11px', color: '#82b366', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Check size={12} strokeWidth={3} /> READY
                          </span>
                        )}
                      </div>
                    </div>
                    {details && <div className="expand-item-detail">{details}</div>}
                    {item.special_instructions && (
                      <div className="expand-item-instructions">
                        <AlertTriangle size={11} /> {item.special_instructions}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="expand-footer">
            <span className="expand-total-items">{items.length} item{items.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Bottom row: action buttons */}
      <div className="order-actions">
        {status === 'preparing' ? (
          <button 
            className="btn btn-check" 
            onClick={() => allItemsReady && onMarkReady(id)} 
            disabled={!allItemsReady}
            title={allItemsReady ? "Mark as Ready" : "Prepare all items first"}
            style={{ 
              opacity: allItemsReady ? 1 : 0.4, 
              cursor: allItemsReady ? 'pointer' : 'not-allowed',
              backgroundColor: allItemsReady ? 'var(--btn-green-bg)' : '#e0e0e0',
              borderColor: allItemsReady ? 'var(--btn-green-border)' : '#cccccc',
              color: allItemsReady ? '#1a1a1a' : '#888888'
            }}
          >
            <Check className="icon" size={20} color={allItemsReady ? "#000" : "#888"} strokeWidth={3} />
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
  );
};

/* ──────────────── Empty-state component ───────────────── */

const EmptyState = ({ message }) => (
  <div className="empty-state">{message}</div>
);

/* ──────────── Deny confirmation dialog ────────────────── */

const DenyConfirmDialog = ({ orderNumber, onConfirm, onClose }) => (
  <div className="deny-overlay" onClick={onClose}>
    <div className="deny-dialog" onClick={(e) => e.stopPropagation()}>
      <div className="deny-dialog-icon">
        <AlertTriangle size={28} color="#b85450" strokeWidth={2.5} />
      </div>
      <div className="deny-dialog-title">Deny Order?</div>
      <div className="deny-dialog-desc">
        Are you sure you want to reject order{' '}
        <strong>#{String(orderNumber || '').slice(-4).toUpperCase()}</strong>?
        This action cannot be undone.
      </div>
      <div className="deny-dialog-actions">
        <button className="deny-dialog-btn deny-dialog-btn--cancel" onClick={onClose}>
          GO BACK
        </button>
        <button className="deny-dialog-btn deny-dialog-btn--confirm" onClick={onConfirm}>
          <X size={16} strokeWidth={3} />
          DENY ORDER
        </button>
      </div>
    </div>
  </div>
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
  const { activeRestaurantId } = useAuth();
  const [restaurantName, setRestaurantName] = useState('TABLEKARD');
  const [denyTarget, setDenyTarget] = useState(null); // { id, orderNumber }

  useEffect(() => {
    if (!activeRestaurantId) return;
    const fetchRestaurantName = async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('name')
        .eq('id', activeRestaurantId)
        .single();
      
      if (!error && data?.name) {
        setRestaurantName(data.name);
      }
    };
    fetchRestaurantName();
  }, [activeRestaurantId]);

  const {
    preparingOrders,
    queueOrders,
    loading,
    error,
    refresh,
    handlePromote,
    handleMarkReady,
    handleCancel,
    handleUpdateItemStatus,
  } = useOrders();

  /** Open the deny confirmation dialog */
  const requestDeny = (orderId, orderNumber) => {
    setDenyTarget({ id: orderId, orderNumber });
  };

  /** Confirmed deny – cancel the order and close dialog */
  const confirmDeny = async () => {
    if (denyTarget) {
      await handleCancel(denyTarget.id);
      setDenyTarget(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <header className="header">
        <div className="header-row">
          <div className="logo">{restaurantName}</div>
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
                  onCancel={(id) => requestDeny(id, order.order_number)}
                  onUpdateItemStatus={handleUpdateItemStatus}
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
                  onCancel={(id) => requestDeny(id, order.order_number)}
                  onUpdateItemStatus={handleUpdateItemStatus}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Deny confirmation dialog */}
      {denyTarget && (
        <DenyConfirmDialog
          orderNumber={denyTarget.orderNumber}
          onConfirm={confirmDeny}
          onClose={() => setDenyTarget(null)}
        />
      )}
    </div>
  );
}

export default App;
