import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@restaurant-saas/supabase';
import { useAuth } from '../context/AuthContext';
import {
  fetchOrdersByStatus,
  markAsReady,
  promoteToProcessing,
  cancelOrder,
  updateOrderItemStatus,
} from '../lib/supabaseService';
import { enqueueMutation, safeProcessQueue } from '../lib/offlineQueue';

// Orders in the queue have status 'pending' or 'confirmed';
// orders being prepared have status 'preparing'.
const WATCHED_STATUSES = ['pending', 'confirmed', 'preparing'];

export function useOrders() {
  const { activeRestaurantId } = useAuth();
  const [preparingOrders, setPreparingOrders] = useState([]);
  const [queueOrders, setQueueOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

      setPreparingOrders(orders.filter((o) => o.status === 'preparing'));
      setQueueOrders(orders.filter((o) => o.status === 'pending' || o.status === 'confirmed'));
      
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

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          // Re-fetch on any change to the orders table
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  // ── Action handlers ────────────────────────────────────────

  /** Move a 'confirmed' order → 'preparing' */
  const handlePromote = useCallback(
    async (orderId) => {
      // Optimistic Update
      const { user } = await supabase.auth.getSession().then(({ data }) => data.session || {});
      
      setQueueOrders(prev => prev.filter(o => o.id !== orderId));
      
      try {
        await promoteToProcessing(orderId, user?.id);
        await loadOrders();
      } catch (err) {
        if (!navigator.onLine || err.message?.includes('fetch')) {
          enqueueMutation('promoteToProcessing', { orderId, userId: user?.id });
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
      setPreparingOrders(prev => prev.filter(o => o.id !== orderId));
      
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
      setPreparingOrders(prev => prev.filter(o => o.id !== orderId));
      
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
      const { user } = await supabase.auth.getSession().then(({ data }) => data.session || {});
      
      // Optimistic Update
      const updateItems = (orders) => orders.map(order => {
        if (!order.order_items) return order;
        return {
          ...order,
          order_items: order.order_items.map(item => 
            item.id === itemId 
              ? { ...item, status: newStatus, prepared_by: newStatus === 'preparing' ? user?.id : item.prepared_by } 
              : item
          )
        };
      });
      
      setPreparingOrders(prev => updateItems(prev));
      setQueueOrders(prev => updateItems(prev));

      try {
        await updateOrderItemStatus(itemId, newStatus, user?.id);
        await loadOrders();
      } catch (err) {
        if (!navigator.onLine || err.message?.includes('fetch')) {
          enqueueMutation('updateOrderItemStatus', { itemId, newStatus, userId: user?.id });
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
  };
}
