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

/** Extract variant name string from an item */
function getVariantName(item) {
  if (!item.variant) return null;
  if (typeof item.variant === 'string') return item.variant;
  return item.variant.name || item.variant.label || null;
}

/** Extract addon names array from an item */
function getAddonNames(item) {
  if (!item.addons) return [];
  let addonList = item.addons;
  if (!Array.isArray(addonList)) addonList = [addonList];
  return addonList
    .map((a) => (typeof a === 'string' ? a : a.name || a.label || ''))
    .filter(Boolean);
}

/** Build a human-readable detail string from variant and addons (kept for backward compat) */
function buildDetailString(item) {
  const parts = [];
  const variant = getVariantName(item);
  if (variant) parts.push(variant);
  const addons = getAddonNames(item);
  if (addons.length) parts.push(addons.join(', '));
  return parts.join(' · ');
}

/** Get table number from order's restaurant_tables FK join */
function getTableNumber(order) {
  if (order.restaurant_tables && order.restaurant_tables.table_number != null) {
    return String(order.restaurant_tables.table_number).padStart(2, '0');
  }
  return '--';
}

/* ──────────────────── OrderCard component ─────────────── */

/**
 * QUEUE card  (status = 'pending' | 'confirmed')
 * – Collapsed by default; tap "ORDER ITEMS" to expand
 * – Per-item: PREPARE (placed→preparing) + READY (→ready) buttons
 * – Card actions: PROCEED  |  DENY
 *
 * PREPARING card  (status = 'preparing')
 * – Items always visible — no expand step needed
 * – Per-item: single circular ✓ toggle (tap to mark ready)
 * – When ALL items are ready the order is auto-promoted; no DONE button
 */
const OrderCard = ({
  id,
  orderNumber,
  tableNumber,
  type,
  createdAt,
  items,
  status,
  expanded,
  onToggleExpand,
  onMarkReady,
  onPromote,
  onCancel,
  onUpdateItemStatus,
}) => {
  const isPreparingCard = status === 'preparing';

  const readyCount = items.filter((i) => i.status === 'ready').length;
  const allItemsReady = items.length > 0 && readyCount === items.length;

  // Auto-promote the order the moment every item is ticked ready
  useEffect(() => {
    if (isPreparingCard && allItemsReady) {
      onMarkReady(id);
    }
  }, [isPreparingCard, allItemsReady, id, onMarkReady]);

  /* ── Queue items — PREPARE per item, no READY ────────── */
  const renderQueueItems = () => {
    if (items.length === 0) return <div className="expand-empty">No items in this order</div>;

    // Collect the first non-empty special instructions (order-level)
    const orderInstructions = items.map((i) => i.special_instructions).find(Boolean);

    return (
      <>
        {items.map((item) => {
          const variant = getVariantName(item);
          const addons = getAddonNames(item);
          const itemStatus = item.status || 'placed';
          return (
            <div key={item.id} className="queue-item">
              <div className="queue-item-main">
                <div className="queue-item-info">
                  <span className="expand-item-name">{item.name}</span>
                  <span className="expand-item-qty">×{item.quantity}</span>
                </div>
                {itemStatus === 'placed' && (
                  <button
                    className="item-action-btn item-action-btn--prepare"
                    onClick={() => onUpdateItemStatus(item.id, 'preparing')}
                  >
                    PREPARE
                  </button>
                )}
                {itemStatus === 'preparing' && (
                  <span className="queue-item-preparing">● IN PROGRESS</span>
                )}
                {itemStatus === 'ready' && (
                  <span className="item-done-label">
                    <Check size={12} strokeWidth={3} /> READY
                  </span>
                )}
              </div>
              {(variant || addons.length > 0) && (
                <div className="queue-item-details">
                  {variant && (
                    <div className="queue-item-detail-row">
                      <span className="queue-detail-label">Variant</span>
                      <span className="queue-detail-value">{variant}</span>
                    </div>
                  )}
                  {addons.length > 0 && (
                    <div className="queue-item-detail-row">
                      <span className="queue-detail-label">Add-ons</span>
                      <span className="queue-detail-value">{addons.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {orderInstructions && (
          <div className="order-instructions-banner">
            <AlertTriangle size={12} />
            <div className="order-instructions-content">
              <span className="order-instructions-label">Special Instructions</span>
              <span className="order-instructions-text">{orderInstructions}</span>
            </div>
          </div>
        )}
      </>
    );
  };

  /* ── Preparing items — 3 states: PREPARE / ✓ toggle / done ── */
  const renderPreparingItems = () => {
    if (items.length === 0) return <div className="expand-empty">No items in this order</div>;

    // Collect the first non-empty special instructions (order-level)
    const orderInstructions = items.map((i) => i.special_instructions).find(Boolean);

    return (
      <>
        {items.map((item) => {
          const variant = getVariantName(item);
          const addons = getAddonNames(item);
          const itemStatus = item.status || 'placed';
          const isReady = itemStatus === 'ready';
          return (
            <div key={item.id} className="expand-item">
              <div className="expand-item-main">
                <div className="expand-item-header">
                  <span className="expand-item-name">{item.name}</span>
                  <span className="expand-item-qty">×{item.quantity}</span>
                </div>

                {itemStatus === 'placed' && (
                  /* Still not started — show PREPARE to kick it off */
                  <button
                    className="item-action-btn item-action-btn--prepare"
                    onClick={() => onUpdateItemStatus(item.id, 'preparing')}
                  >
                    PREPARE
                  </button>
                )}

                {itemStatus === 'preparing' && (
                  /* In progress — tap ✓ to mark done */
                  <button
                    className="item-ready-toggle"
                    onClick={() => onUpdateItemStatus(item.id, 'ready')}
                    title="Mark as ready"
                  >
                    <Check size={14} strokeWidth={3.5} />
                  </button>
                )}

                {isReady && (
                  /* Done */
                  <button
                    className="item-ready-toggle item-ready-toggle--done"
                    disabled
                    title="Item ready"
                  >
                    <Check size={14} strokeWidth={3.5} />
                  </button>
                )}
              </div>
              {(variant || addons.length > 0) && (
                <div className="expand-item-details">
                  {variant && (
                    <div className="expand-item-detail-row">
                      <span className="expand-detail-label">Variant</span>
                      <span className="expand-detail-value">{variant}</span>
                    </div>
                  )}
                  {addons.length > 0 && (
                    <div className="expand-item-detail-row">
                      <span className="expand-detail-label">Add-ons</span>
                      <span className="expand-detail-value">{addons.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {orderInstructions && (
          <div className="order-instructions-banner">
            <AlertTriangle size={12} />
            <div className="order-instructions-content">
              <span className="order-instructions-label">Special Instructions</span>
              <span className="order-instructions-text">{orderInstructions}</span>
            </div>
          </div>
        )}
      </>
    );
  };

  /* ── render ───────────────────────────────────────── */
  return (
    <div className={`order-card${(expanded || isPreparingCard) ? ' order-card--expanded' : ''}`}>

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

          {isPreparingCard ? (
            /* Progress counter replaces expand trigger */
            <div className="preparing-progress">
              {readyCount}/{items.length} ready
            </div>
          ) : (
            <button className="order-items-trigger" onClick={onToggleExpand}>
              <span>{items.length} ITEM{items.length !== 1 ? 'S' : ''}</span>
              <ChevronDown
                size={18}
                strokeWidth={2.5}
                className={`expand-chevron${expanded ? ' expand-chevron--open' : ''}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Items panel */}
      {isPreparingCard ? (
        /* Always visible for preparing cards */
        <div className="card-expand-inner preparing-items-panel">
          {type && (
            <div className="expand-type-row">
              <span className="expand-type-badge">{String(type).replace('_', ' ').toUpperCase()}</span>
            </div>
          )}
          <div className="expand-items">{renderPreparingItems()}</div>
        </div>
      ) : (
        /* Collapsible for queue cards — items are read-only */
        <div className={`card-expand-wrapper${expanded ? ' card-expand-wrapper--open' : ''}`}>
          <div className="card-expand-inner">
            {type && (
              <div className="expand-type-row">
                <span className="expand-type-badge">{String(type).replace('_', ' ').toUpperCase()}</span>
              </div>
            )}
            <div className="queue-items">{renderQueueItems()}</div>
          </div>
        </div>
      )}

      {/* Card-level actions — only queue cards have buttons */}
      {!isPreparingCard && (
        <div className="order-actions">
          <button className="btn btn-up" onClick={() => onPromote(id)} title="Move to Preparing">
            <ArrowUp className="icon" size={20} color="#000" strokeWidth={3} />
            <span style={{ marginLeft: '6px' }}>PREPARE</span>
          </button>
          <button className="btn btn-remove" onClick={() => onCancel(id)} title="Cancel Order">
            <X className="icon" size={20} color="#000" strokeWidth={3} />
            <span style={{ marginLeft: '6px' }}>REJECT</span>
          </button>
        </div>
      )}
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
  // Track which queue cards are expanded by order ID — stable across realtime refetches
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const toggleExpand = (orderId) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });

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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', flex: '1 1 auto', minHeight: 0 }}>
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
        <div className="orders-layout">
          {/* ── PREPARING panel ───────────────────────────── */}
          <div className="orders-panel">
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
          </div>

          {/* ── ORDER QUEUE panel ─────────────────────────── */}
          <div className="orders-panel">
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
                    expanded={expandedIds.has(order.id)}
                    onToggleExpand={() => toggleExpand(order.id)}
                    onMarkReady={handleMarkReady}
                    onPromote={handlePromote}
                    onCancel={(id) => requestDeny(id, order.order_number)}
                    onUpdateItemStatus={handleUpdateItemStatus}
                  />
                ))
              )}
            </div>
          </div>
        </div>
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
