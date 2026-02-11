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
    customerName,
    customerPhone,
    tableNumber,
    items,
    paymentMethod = 'PAY_AT_COUNTER',
    taxRate = 0.05
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
            type: 'DINE_IN',
            table_number: tableNumber ? Number(tableNumber) : null,
            customer_name: customerName ?? null,
            customer_phone: customerPhone ?? null,
            status: 'PENDING',
            payment_method: paymentMethod,
            payment_status: 'PENDING',
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
