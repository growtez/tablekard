import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@restaurant-saas/supabase';
import { useAuth } from '../context/AuthContext';
import {
  fetchOrdersByStatus,
  markAsReady,
  promoteToProcessing,
  cancelOrder,
  updateOrderItemStatus,
  fetchProfilesByIds,
} from '../lib/supabaseService';
import { enqueueMutation, safeProcessQueue } from '../lib/offlineQueue';

// Orders in the queue have status 'placed', 'pending' or 'confirmed';
// orders being prepared have status 'preparing'.
const WATCHED_STATUSES = ['placed', 'pending', 'confirmed', 'preparing'];

/** Roles that can see ALL preparing orders (not just their own) */
const ADMIN_ROLES = ['restaurant_admin', 'super_admin', 'admin'];

export function useOrders() {
  const { activeRestaurantId, user, profile, memberships } = useAuth();
  const [allPreparingOrders, setAllPreparingOrders] = useState([]);
  const [queueOrders, setQueueOrders] = useState([]);
  const [staffProfiles, setStaffProfiles] = useState({}); // { userId: { name, role } }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine if current user is an admin (sees all preparing orders)
  const currentUserId = user?.id ?? null;
  const isAdmin = useMemo(() => {
    const profileRole = String(profile?.role ?? '').toLowerCase();
    if (ADMIN_ROLES.includes(profileRole)) return true;
    // Also check membership roles for the active restaurant
    return memberships.some(
      (m) =>
        m.restaurant_id === activeRestaurantId &&
        ADMIN_ROLES.includes(String(m.role ?? '').toLowerCase())
    );
  }, [profile, memberships, activeRestaurantId]);

  /**
   * preparingOrders visible to this user:
   * - Admins → all preparing orders
   * - Kitchen staff → only orders where at least one item has prepared_by = their userId
   */
  const preparingOrders = useMemo(() => {
    if (isAdmin) return allPreparingOrders;
    if (!currentUserId) return [];
    return allPreparingOrders.filter((order) =>
      (order.order_items ?? []).some((item) => item.prepared_by === currentUserId)
    );
  }, [allPreparingOrders, isAdmin, currentUserId]);

  // ── Fetch & bucket orders ──────────────────────────────────
  const loadOrders = useCallback(async () => {
    if (!activeRestaurantId) {
      setPreparingOrders([]);
      setQueueOrders([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // If we're offline, don't attempt to fetch, just keep the current state
      if (!navigator.onLine) {
        setLoading(false);
        return;
      }

      const orders = await fetchOrdersByStatus(WATCHED_STATUSES, activeRestaurantId);

      const preparingList = orders.filter((o) => o.status === 'preparing');
      setAllPreparingOrders(preparingList);
      setQueueOrders(orders.filter((o) => o.status === 'placed' || o.status === 'pending' || o.status === 'confirmed'));

      // Resolve prepared_by IDs → { name, role } for the staff-name chips
      const preparedByIds = [
        ...new Set(
          preparingList.flatMap((o) =>
            (o.order_items ?? []).map((item) => item.prepared_by).filter(Boolean)
          )
        ),
      ];
      if (preparedByIds.length > 0) {
        const profiles = await fetchProfilesByIds(preparedByIds);
        const map = {};
        profiles.forEach((p) => { map[p.id] = { name: p.name, role: p.role }; });
        setStaffProfiles(map);
      }
      
      // Attempt to process queue in case we just came back online
      safeProcessQueue();
    } catch (err) {
      if (navigator.onLine) {
        setError(err.message ?? 'Failed to fetch orders');
      }
    } finally {
      setLoading(false);
    }
  }, [activeRestaurantId]);

  // ── Realtime subscription ──────────────────────────────────
  useEffect(() => {
    loadOrders();

    if (!activeRestaurantId) return;

    // Use a unique channel name per restaurant to avoid cross-tab collisions
    const channelName = `orders-realtime-${activeRestaurantId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${activeRestaurantId}`,
        },
        () => {
          // Re-fetch on any change to this restaurant's orders
          loadOrders();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        () => {
          loadOrders();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[useOrders] Realtime channel subscribed:', channelName);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[useOrders] Realtime channel error:', status, channelName);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders, activeRestaurantId]);

  // ── Action handlers ────────────────────────────────────────

  /** Move a queued order ('placed' | 'confirmed' | 'pending') → 'preparing' */
  const handlePromote = useCallback(
    async (orderId) => {
      // Optimistic Update
      const { user: sessionUser } = await supabase.auth.getSession().then(({ data }) => data.session || {});
      
      setQueueOrders(prev => prev.filter(o => o.id !== orderId));
      
      try {
        await promoteToProcessing(orderId, sessionUser?.id);
        await loadOrders();
      } catch (err) {
        if (!navigator.onLine || err.message?.includes('fetch')) {
          enqueueMutation('promoteToProcessing', { orderId, userId: sessionUser?.id });
        } else {
          console.error('Promote failed:', err);
          await loadOrders(); // revert
        }
      }
    },
    [loadOrders]
  );

  /** Mark a 'preparing' order as 'ready' */
  const handleMarkReady = useCallback(
    async (orderId) => {
      // Optimistic Update
      setAllPreparingOrders(prev => prev.filter(o => o.id !== orderId));
      
      try {
        await markAsReady(orderId);
        await loadOrders();
      } catch (err) {
        if (!navigator.onLine || err.message?.includes('fetch')) {
          enqueueMutation('markAsReady', { orderId });
        } else {
          console.error('Mark ready failed:', err);
          await loadOrders(); // revert
        }
      }
    },
    [loadOrders]
  );

  /** Cancel an order */
  const handleCancel = useCallback(
    async (orderId) => {
      // Optimistic Update
      setQueueOrders(prev => prev.filter(o => o.id !== orderId));
      setAllPreparingOrders(prev => prev.filter(o => o.id !== orderId));
      
      try {
        await cancelOrder(orderId);
        await loadOrders();
      } catch (err) {
        if (!navigator.onLine || err.message?.includes('fetch')) {
          enqueueMutation('cancelOrder', { orderId });
        } else {
          console.error('Cancel failed:', err);
          await loadOrders(); // revert
        }
      }
    },
    [loadOrders]
  );

  /** Update an item's status */
  const handleUpdateItemStatus = useCallback(
    async (itemId, newStatus) => {
      const { user: sessionUser } = await supabase.auth.getSession().then(({ data }) => data.session || {});
      
      // Optimistic Update
      const updateItems = (orders) => orders.map(order => {
        if (!order.order_items) return order;
        return {
          ...order,
          order_items: order.order_items.map(item => 
            item.id === itemId 
              ? { ...item, status: newStatus, prepared_by: newStatus === 'preparing' ? sessionUser?.id : item.prepared_by } 
              : item
          )
        };
      });
      
      setAllPreparingOrders(prev => updateItems(prev));
      setQueueOrders(prev => updateItems(prev));

      try {
        await updateOrderItemStatus(itemId, newStatus, sessionUser?.id);
        await loadOrders();
      } catch (err) {
        if (!navigator.onLine || err.message?.includes('fetch')) {
          enqueueMutation('updateOrderItemStatus', { itemId, newStatus, userId: sessionUser?.id });
        } else {
          console.error('Update item status failed:', err);
          await loadOrders(); // revert
        }
      }
    },
    [loadOrders]
  );

  return {
    preparingOrders,
    queueOrders,
    loading,
    error,
    refresh: loadOrders,
    handlePromote,
    handleMarkReady,
    handleCancel,
    handleUpdateItemStatus,
    isAdmin,
    currentUserId,
    staffProfiles,
  };
}
