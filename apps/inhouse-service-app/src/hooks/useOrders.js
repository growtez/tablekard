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
      const orders = await fetchOrdersByStatus(WATCHED_STATUSES, activeRestaurantId);

      setPreparingOrders(orders.filter((o) => o.status === 'preparing'));
      setQueueOrders(orders.filter((o) => o.status === 'pending' || o.status === 'confirmed'));
    } catch (err) {
      setError(err.message ?? 'Failed to fetch orders');
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
      try {
        await promoteToProcessing(orderId);
        await loadOrders();
      } catch (err) {
        console.error('Promote failed:', err);
      }
    },
    [loadOrders]
  );

  /** Mark a 'preparing' order as 'ready' */
  const handleMarkReady = useCallback(
    async (orderId) => {
      try {
        await markAsReady(orderId);
        await loadOrders();
      } catch (err) {
        console.error('Mark ready failed:', err);
      }
    },
    [loadOrders]
  );

  /** Cancel an order */
  const handleCancel = useCallback(
    async (orderId) => {
      try {
        await cancelOrder(orderId);
        await loadOrders();
      } catch (err) {
        console.error('Cancel failed:', err);
      }
    },
    [loadOrders]
  );

  /** Update an item's status */
  const handleUpdateItemStatus = useCallback(
    async (itemId, newStatus) => {
      try {
        await updateOrderItemStatus(itemId, newStatus);
        await loadOrders();
      } catch (err) {
        console.error('Update item status failed:', err);
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
