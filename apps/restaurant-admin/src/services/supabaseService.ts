/**
 * Supabase Service for Restaurant Admin Panel
 *
 * Core operations for restaurant management:
 * - Restaurant profile
 * - Menu management
 * - Orders overview
 * - Tables
 */

import { supabase } from '@restaurant-saas/supabase';
import { MenuItem, Restaurant, Order, OrderStatus } from '@restaurant-saas/types';

export const getRestaurantById = async (restaurantId: string): Promise<Restaurant | null> => {
    const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        status: data.status,
        statusReason: data.status_reason,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        contact: {
            email: data.contact_email,
            phone: data.contact_phone,
            address: data.contact_address
        },
        branding: {
            logoUrl: data.logo_url,
            primaryColor: data.primary_color,
            secondaryColor: data.secondary_color
        },
        settings: data.settings ?? undefined
    };
};

export const getMenuItems = async (restaurantId: string): Promise<MenuItem[]> => {
    const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(row => ({
        id: row.id,
        restaurantId: row.restaurant_id,
        categoryId: row.category_id ?? '',
        name: row.name,
        description: row.description,
        price: row.price,
        discountPrice: row.discount_price,
        image: row.image_url,
        available: row.is_available,
        isVeg: row.is_veg,
        preparationTime: row.preparation_time,
        tags: row.tags,
        variants: (row.variants as any) ?? undefined,
        addons: (row.addons as any) ?? undefined
    }));
};

export const getOrders = async (restaurantId: string, limitCount: number = 50): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(limitCount);
    if (error) throw error;
    return (data ?? []).map(row => ({
        id: row.id,
        restaurantId: row.restaurant_id,
        orderNumber: row.order_number,
        type: row.type,
        tableNumber: row.table_number ?? undefined,
        customerId: row.customer_id ?? undefined,
        customerName: row.customer_name ?? undefined,
        customerPhone: row.customer_phone ?? undefined,
        items: [],
        subtotal: row.subtotal,
        taxes: row.taxes,
        discount: row.discount,
        total: row.total,
        status: row.status,
        payment: {
            method: row.payment_method,
            status: row.payment_status,
            transactionId: row.transaction_id ?? undefined
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }));
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    if (error) throw error;
};
