/**
 * Supabase Service for Restaurant Admin Panel
 *
 * Core operations for restaurant management:
 * - Restaurant profile
 * - Menu management
 * - Orders overview
 * - Tables
 *
 * NOTE: We use `(supabase as any).from(...)` to bypass a type incompatibility between
 * `@supabase/supabase-js` v2.95+ and our manually-written Database type. The functions
 * still return fully-typed values via explicit TypeScript return types.
 */

import { supabase } from '@restaurant-saas/supabase';
import type { MenuItem, MenuCategory, Restaurant, Order, OrderStatus } from '@restaurant-saas/types';

// Shorthand to avoid the generic type conflict in supabase-js v2.95+
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ==========================================
// Row types matching actual DB schema
// ==========================================

interface RestaurantRow {
    id: string; name: string; slug: string; status: string; status_reason: string | null;
    contact_email: string | null; contact_phone: string | null; contact_address: string | null;
    logo_url: string | null; primary_color: string | null; secondary_color: string | null;
    settings: Record<string, unknown> | null; created_at: string; updated_at: string;
}

interface MenuItemRow {
    id: string; restaurant_id: string; category_id: string | null; name: string;
    description: string | null; price: number; discount_price: number | null;
    image_url: string | null; is_available: boolean; is_veg: boolean;
    preparation_time: number | null; tags: string[] | null;
    variants: unknown[] | null; addons: unknown[] | null;
    created_at: string; updated_at: string;
}

interface MenuCategoryRow {
    id: string; restaurant_id: string; name: string; description: string | null;
    image_url: string | null; sort_order: number; active: boolean;
    created_at: string; updated_at: string;
}

interface OrderRow {
    id: string; restaurant_id: string; order_number: string; type: string;
    table_number: number | null; customer_id: string | null;
    customer_name: string | null; customer_phone: string | null;
    subtotal: number; taxes: number; discount: number; total: number;
    status: string; payment_method: string; payment_status: string;
    transaction_id: string | null; created_at: string; updated_at: string;
}

// ==========================================
// Restaurant
// ==========================================

export const getRestaurantById = async (restaurantId: string): Promise<Restaurant | null> => {
    const { data, error } = await db
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as RestaurantRow;
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        status: row.status as Restaurant['status'],
        statusReason: row.status_reason,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        contact: {
            email: row.contact_email,
            phone: row.contact_phone,
            address: row.contact_address
        },
        branding: {
            logoUrl: row.logo_url,
            primaryColor: row.primary_color,
            secondaryColor: row.secondary_color
        },
        settings: row.settings ?? undefined
    };
};

// ==========================================
// Menu Items
// ==========================================

const mapMenuItemRow = (row: MenuItemRow): MenuItem => ({
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
});

export const getMenuItems = async (restaurantId: string): Promise<MenuItem[]> => {
    const { data, error } = await db
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return ((data ?? []) as MenuItemRow[]).map(mapMenuItemRow);
};

export const addMenuItem = async (
    restaurantId: string,
    item: {
        name: string;
        price: number;
        category_id: string;
        description?: string;
        image_url?: string;
        is_available?: boolean;
        is_veg?: boolean;
    }
): Promise<MenuItem> => {
    const { data, error } = await db
        .from('menu_items')
        .insert({ restaurant_id: restaurantId, ...item })
        .select()
        .single();
    if (error) throw error;
    return mapMenuItemRow(data as MenuItemRow);
};

export const updateMenuItem = async (
    itemId: string,
    item: Partial<{
        name: string;
        price: number;
        category_id: string;
        description: string | null;
        image_url: string | null;
        is_available: boolean;
        is_veg: boolean;
    }>
): Promise<void> => {
    const { error } = await db
        .from('menu_items')
        .update(item)
        .eq('id', itemId);
    if (error) throw error;
};

export const deleteMenuItem = async (itemId: string): Promise<void> => {
    const { error } = await db
        .from('menu_items')
        .delete()
        .eq('id', itemId);
    if (error) throw error;
};

export const toggleMenuItemAvailability = async (itemId: string, isAvailable: boolean): Promise<void> => {
    const { error } = await db
        .from('menu_items')
        .update({ is_available: isAvailable })
        .eq('id', itemId);
    if (error) throw error;
};

// ==========================================
// Menu Categories
// ==========================================

const mapCategoryRow = (row: MenuCategoryRow): MenuCategory => ({
    id: row.id,
    restaurantId: row.restaurant_id,
    name: row.name,
    description: row.description,
    image: row.image_url,
    order: row.sort_order,
    active: row.active
});

export const getMenuCategories = async (restaurantId: string): Promise<MenuCategory[]> => {
    const { data, error } = await db
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order', { ascending: true });
    if (error) throw error;
    return ((data ?? []) as MenuCategoryRow[]).map(mapCategoryRow);
};

export const addMenuCategory = async (
    restaurantId: string,
    category: { name: string; description?: string; sort_order?: number; active?: boolean }
): Promise<MenuCategory> => {
    const { data, error } = await db
        .from('menu_categories')
        .insert({
            restaurant_id: restaurantId,
            name: category.name,
            description: category.description,
            sort_order: category.sort_order ?? 0,
            active: category.active ?? true
        })
        .select()
        .single();
    if (error) throw error;
    return mapCategoryRow(data as MenuCategoryRow);
};

export const updateMenuCategory = async (
    categoryId: string,
    category: Partial<{ name: string; description: string | null; sort_order: number; active: boolean }>
): Promise<void> => {
    const { error } = await db
        .from('menu_categories')
        .update(category)
        .eq('id', categoryId);
    if (error) throw error;
};

export const deleteMenuCategory = async (categoryId: string): Promise<void> => {
    const { error } = await db
        .from('menu_categories')
        .delete()
        .eq('id', categoryId);
    if (error) throw error;
};

// ==========================================
// Orders
// ==========================================

export const getOrders = async (restaurantId: string, limitCount: number = 50): Promise<Order[]> => {
    const { data, error } = await db
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(limitCount);
    if (error) throw error;
    return ((data ?? []) as OrderRow[]).map(row => ({
        id: row.id,
        restaurantId: row.restaurant_id,
        orderNumber: row.order_number,
        type: row.type as Order['type'],
        tableNumber: row.table_number ?? undefined,
        customerId: row.customer_id ?? undefined,
        customerName: row.customer_name ?? undefined,
        customerPhone: row.customer_phone ?? undefined,
        items: [],
        subtotal: row.subtotal,
        taxes: row.taxes,
        discount: row.discount,
        total: row.total,
        status: row.status as OrderStatus,
        payment: {
            method: row.payment_method as Order['payment']['method'],
            status: row.payment_status as Order['payment']['status'],
            transactionId: row.transaction_id ?? undefined
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }));
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
    const { error } = await db
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    if (error) throw error;
};
