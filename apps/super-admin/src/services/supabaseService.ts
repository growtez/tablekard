/**
 * Supabase Service for Super Admin Panel
 *
 * Platform-wide management:
 * - Restaurant management
 * - User management
 * - Orders overview
 * - Platform analytics
 * - System configuration
 */

import { supabase } from '@restaurant-saas/supabase';
import {
    Restaurant,
    User,
    UserRole,
    Order,
    OrderStatus,
    PaymentStatus
} from '@restaurant-saas/types';

const mapRestaurant = (row: any): Restaurant => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    statusReason: undefined,
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
    settings: row.settings ?? undefined,
    subscriptionStatus: true,
    subscriptionType: 'QR Only',
    location: {
        latitude: row.latitude,
        longitude: row.longitude,
        allowedRadius: row.allowed_radius
    }
});

const mapOrder = (row: any): Order => ({
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
});

const mapUser = (row: any): User => ({
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
});

// ============================================
// RESTAURANT MANAGEMENT
// ============================================

export const getRestaurants = async (limitCount: number = 20, offset: number = 0) => {
    const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limitCount - 1);

    if (error) throw error;

    return {
        restaurants: (data ?? []).map(mapRestaurant),
        lastDoc: null
    };
};

export const getRestaurantById = async (restaurantId: string): Promise<Restaurant | null> => {
    const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapRestaurant(data);
};

export const createRestaurant = async (restaurantData: any) => {
    const { data, error } = await supabase
        .from('restaurants')
        .insert({
            name: restaurantData.name,
            slug: restaurantData.slug,
            status: restaurantData.status,
            contact_email: restaurantData.contact_email,
            contact_phone: restaurantData.contact_phone,
            contact_address: restaurantData.contact_address,
            subscription_status: restaurantData.subscription_status,
            subscription_type: restaurantData.subscription_type,
            allowed_radius: restaurantData.allowed_radius
        })
        .select('*')
        .single();

    if (error) throw error;
    return mapRestaurant(data);
};

export const approveRestaurant = async (restaurantId: string) => {
    const { error } = await supabase
        .from('restaurants')
        .update({ status: 'active' as any, status_reason: null })
        .eq('id', restaurantId);
    if (error) throw error;
};

export const suspendRestaurant = async (restaurantId: string, reason: string) => {
    const { error } = await supabase
        .from('restaurants')
        .update({ status: 'suspended' as any, status_reason: reason })
        .eq('id', restaurantId);
    if (error) throw error;
};

export const reactivateRestaurant = async (restaurantId: string) => {
    const { error } = await supabase
        .from('restaurants')
        .update({ status: 'active' as any, status_reason: null })
        .eq('id', restaurantId);
    if (error) throw error;
};

export const deleteRestaurant = async (restaurantId: string) => {
    const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', restaurantId);
    if (error) throw error;
};

// ============================================
// USER MANAGEMENT
// ============================================

export const getUsers = async (limitCount: number = 20, offset: number = 0, role: UserRole | null = null) => {
    let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limitCount - 1);

    if (role) {
        query = query.eq('role', role);
    }

    const { data, error } = await query;
    if (error) throw error;

    return {
        users: (data ?? []).map(mapUser),
        lastDoc: null
    };
};

export const updateUserRole = async (userId: string, role: UserRole) => {
    const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);
    if (error) throw error;
};

// ============================================
// ORDER MANAGEMENT
// ============================================

interface OrderFilters {
    status?: OrderStatus;
    restaurantId?: string;
}

export const getOrders = async (filters: OrderFilters = {}, limitCount: number = 50) => {
    let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limitCount);

    if (filters.status) {
        query = query.eq('status', filters.status);
    }

    if (filters.restaurantId) {
        query = query.eq('restaurant_id', filters.restaurantId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapOrder);
};

export const cancelOrder = async (orderId: string, reason: string) => {
    const { error } = await supabase
        .from('orders')
        .update({
            status: OrderStatus.CANCELLED,
            payment_status: PaymentStatus.PENDING,
            updated_at: new Date().toISOString(),
            status_reason: reason
        })
        .eq('id', orderId);
    if (error) throw error;
};

// ============================================
// PLATFORM ANALYTICS
// ============================================

export const getPlatformStats = async () => {
    const [users, restaurants, orders] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('restaurants').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true })
    ]);

    if (users.error) throw users.error;
    if (restaurants.error) throw restaurants.error;
    if (orders.error) throw orders.error;

    return {
        totalUsers: users.count ?? 0,
        totalRestaurants: restaurants.count ?? 0,
        totalOrders: orders.count ?? 0
    };
};

export const getRevenueStats = async (startDate: Date, endDate: Date) => {
    const { data, error } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'completed' as any);

    if (error) throw error;
    const totals = data ?? [];
    const totalRevenue = totals.reduce((sum, order) => sum + (order.total || 0), 0);

    return {
        totalRevenue,
        totalOrders: totals.length,
        averageOrderValue: totals.length > 0 ? totalRevenue / totals.length : 0
    };
};

export const getSubscriptionStats = async () => {
    const [activeCount, trialCount] = await Promise.all([
        supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('status', 'active' as any),
        supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('status', 'pending' as any)
    ]);

    if (activeCount.error) throw activeCount.error;
    if (trialCount.error) throw trialCount.error;

    return {
        activeCount: activeCount.count ?? 0,
        trialCount: trialCount.count ?? 0
    };
};

export const getRecentOrders = async (limitCount: number = 10) => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limitCount);
    if (error) throw error;
    return (data ?? []).map(mapOrder);
};

// ============================================
// SYSTEM CONFIGURATION
// ============================================

export const getSystemConfig = async () => {
    const { data, error } = await supabase
        .from('platform_settings')
        .select('config')
        .eq('id', 'system')
        .maybeSingle();
    if (error) throw error;
    return data?.config ?? {};
};

export const updateSystemConfig = async (config: any) => {
    const { error } = await supabase
        .from('platform_settings')
        .upsert({
            id: 'system',
            config,
            updated_at: new Date().toISOString()
        });
    if (error) throw error;
};

const supabaseService = {
    getRestaurants,
    getRestaurantById,
    createRestaurant,
    approveRestaurant,
    suspendRestaurant,
    reactivateRestaurant,
    deleteRestaurant,
    getUsers,
    updateUserRole,
    getOrders,
    cancelOrder,
    getPlatformStats,
    getRevenueStats,
    getRecentOrders,
    getSystemConfig,
    updateSystemConfig,
    getSubscriptionStats
};

export default supabaseService;
