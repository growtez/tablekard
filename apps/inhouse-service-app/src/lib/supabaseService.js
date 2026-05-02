import { supabase } from '@restaurant-saas/supabase';

/**
 * Fetches orders filtered by status(es) and restaurant, including their
 * order_items joined with menu_items for name resolution.
 *
 * Each returned order contains:
 *  - order id, order_number, status, created_at, updated_at
 *  - items[]: name, quantity, variant, addons, special_instructions, created_at
 */
export async function fetchOrdersByStatus(statuses = [], restaurantId) {
  let query = supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      created_at,
      updated_at,
      order_items (
        id,
        menu_item_id,
        name,
        price,
        quantity,
        total,
        variant,
        addons,
        special_instructions,
        created_at
      )
    `)
    .in('status', statuses)
    .order('created_at', { ascending: true });

  if (restaurantId) {
    query = query.eq('restaurant_id', restaurantId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[supabaseService] fetchOrdersByStatus error:', error);
    throw error;
  }

  return data ?? [];
}

/**
 * Updates the status of an order.
 */
export async function updateOrderStatus(orderId, newStatus) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('[supabaseService] updateOrderStatus error:', error);
    throw error;
  }

  return data;
}

/**
 * Cancels an order by setting its status to 'cancelled'.
 */
export async function cancelOrder(orderId) {
  return updateOrderStatus(orderId, 'cancelled');
}

/**
 * Promotes a queued order to 'preparing'.
 */
export async function promoteToProcessing(orderId) {
  return updateOrderStatus(orderId, 'preparing');
}

/**
 * Marks a preparing order as 'ready'.
 */
export async function markAsReady(orderId) {
  return updateOrderStatus(orderId, 'ready');
}
