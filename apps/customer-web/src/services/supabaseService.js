import { supabase } from '@restaurant-saas/supabase';

export const getRestaurantBySlug = async (slug) => {
    const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return data;
};

export const getRestaurantById = async (id) => {
    const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return data;
};

export const getTableById = async (id) => {
    const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (error) throw error;
    return data;
};

export const getTableByNumber = async (restaurantId, tableNumber) => {
    const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('table_number', tableNumber)
        .maybeSingle();
    if (error) throw error;
    return data;
};

export const getMenuCategories = async (restaurantId) => {
    const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('active', true)
        .order('sort_order', { ascending: true });
    if (error) throw error;
    return data ?? [];
};

export const getMenuItems = async (restaurantId) => {
    const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
};

export const createOrder = async ({
    restaurantId,
    customerId,
    tableNumber,
    items,
    paymentMethod = 'cash',
    taxRate = 0.05,
    type = 'dine_in'
}) => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxes = Math.round(subtotal * taxRate);
    const total = subtotal + taxes;
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

    const { data: order, error } = await supabase
        .from('orders')
        .insert({
            restaurant_id: restaurantId,
            customer_id: customerId,
            order_number: orderNumber,
            type: type,
            table_id: (typeof tableNumber === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tableNumber)) ? tableNumber : null,
            status: 'pending',
            payment_method: paymentMethod,
            payment_status: 'pending',
            subtotal,
            taxes,
            discount: 0,
            total
        })
        .select('*')
        .single();

    if (error) throw error;

    const orderItems = items.map(item => ({
        order_id: order.id,
        menu_item_id: item.id ?? null,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
        variant: item.variant ?? null,
        addons: item.addons ?? null,
        special_instructions: item.specialInstructions ?? null
    }));

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
    if (itemsError) throw itemsError;

    return { orderId: order.id, orderNumber };
};

export const getOrderHistory = async (userId) => {
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (*)
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
};

export const getTodaysOrders = async (userId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (*)
        `)
        .eq('customer_id', userId)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
};

export const cancelOrder = async (orderId) => {
    const { data, error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .select();
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
};

export const updateOrderType = async (orderId, type) => {
    const { data, error } = await supabase
        .from('orders')
        .update({ type: type })
        .eq('id', orderId)
        .select();
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
};

// Favorites
export const getFavorites = async (userId) => {
    const { data, error } = await supabase
        .from('favorites')
        .select(`
            menu_item_id,
            menu_items (
                *,
                menu_item_images (image_url, sort_order)
            )
        `)
        .eq('user_id', userId);
    
    if (error) throw error;
    return data.map(f => f.menu_items);
};

export const addFavorite = async (userId, menuItemId) => {
    const { data, error } = await supabase
        .from('favorites')
        .insert({ user_id: userId, menu_item_id: menuItemId })
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const removeFavoriteFromDB = async (userId, menuItemId) => {
    const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('menu_item_id', menuItemId);
    if (error) throw error;
    return true;
};

export const getUserStats = async (userId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isoToday = today.toISOString();

    try {
        // 1. Fetch Today's Orders
        const { count: todaysOrders, error: err1 } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', userId)
            .gte('created_at', isoToday);

        if (err1) throw err1;

        // 2. Fetch Total Spent (Sum of 'total' column)
        const { data: orders, error: err2 } = await supabase
            .from('orders')
            .select('total')
            .eq('customer_id', userId)
            .not('status', 'eq', 'cancelled'); // Don't count cancelled orders

        if (err2) throw err2;

        const totalSpent = (orders || []).reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);

        // 3. Fetch Favorites Count
        const { count: favoriteItems, error: err3 } = await supabase
            .from('favorites')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (err3) throw err3;

        return {
            todaysOrders: todaysOrders || 0,
            totalSpent: totalSpent || 0,
            favoriteItems: favoriteItems || 0
        };
    } catch (err) {
        console.error('Error fetching user stats:', err);
        return {
            todaysOrders: 0,
            totalSpent: 0,
            favoriteItems: 0
        };
    }
};
