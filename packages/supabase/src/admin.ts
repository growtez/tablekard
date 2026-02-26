// E:\dev\growtez\tablekard\packages\supabase\src\admin.ts
import { createClient } from '@supabase/supabase-js';

// 1. Hard safeguard: completely crash if this ever runs in a browser
if (typeof window !== 'undefined') {
    throw new Error(
        "SECURITY ALERT: The Supabase Admin client cannot be used in the browser. It will expose your entire database."
    );
}

// 2. Fetch standard URL and the highly-secure service key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase URL or Service Role Key in environment variables.');
}

// 3. Export the admin client
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false, 
    }
});

// ============================================
// ADMIN USER MANAGEMENT
// ============================================

export const createSuperAdmin = async (email: string, name: string) => {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: name },
        role: 'super_admin'
    });

    if (error) throw error;
    return data;
};

export const updateUserRole = async (userId: string, role: 'super_admin' | 'restaurant_admin' | 'restaurant_staff' | 'customer') => {
    const { error } = await supabaseAdmin
        .from('profiles')
        .update({ role })
        .eq('id', userId);
    
    if (error) throw error;
};

export const deleteSuperAdmin = async (userId: string) => {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;
};

// ============================================
// RESTAURANT ADMIN OPERATIONS
// ============================================

export const forceApproveRestaurant = async (restaurantId: string) => {
    const { error } = await supabaseAdmin
        .from('restaurants')
        .update({ 
            status: 'active',
            subscription_status: true,
            updated_at: new Date().toISOString()
        })
        .eq('id', restaurantId);
    
    if (error) throw error;
};

export const forceSuspendRestaurant = async (restaurantId: string, reason: string) => {
    const { error } = await supabaseAdmin
        .from('restaurants')
        .update({ 
            status: 'suspended',
            status_reason: reason,
            updated_at: new Date().toISOString()
        })
        .eq('id', restaurantId);
    
    if (error) throw error;
};

export const deleteRestaurantData = async (restaurantId: string) => {
    // Delete all related data in order of dependencies
    const { error: paymentsError } = await supabaseAdmin
        .from('payments')
        .delete()
        .eq('restaurant_id', restaurantId);
    
    if (paymentsError) throw paymentsError;

    const { error: orderItemsError } = await supabaseAdmin
        .from('order_items')
        .delete()
        .eq('order_id', (await supabaseAdmin.from('orders').select('id').eq('restaurant_id', restaurantId)).data?.map(o => o.id) || []);
    
    if (orderItemsError) throw orderItemsError;

    const { error: ordersError } = await supabaseAdmin
        .from('orders')
        .delete()
        .eq('restaurant_id', restaurantId);
    
    if (ordersError) throw ordersError;

    const { error: menuItemsError } = await supabaseAdmin
        .from('menu_items')
        .delete()
        .eq('restaurant_id', restaurantId);
    
    if (menuItemsError) throw menuItemsError;

    const { error: categoriesError } = await supabaseAdmin
        .from('menu_categories')
        .delete()
        .eq('restaurant_id', restaurantId);
    
    if (categoriesError) throw categoriesError;

    const { error: tablesError } = await supabaseAdmin
        .from('restaurant_tables')
        .delete()
        .eq('restaurant_id', restaurantId);
    
    if (tablesError) throw tablesError;

    const { error: usersError } = await supabaseAdmin
        .from('restaurant_users')
        .delete()
        .eq('restaurant_id', restaurantId);
    
    if (usersError) throw usersError;

    // Finally delete the restaurant
    const { error: restaurantError } = await supabaseAdmin
        .from('restaurants')
        .delete()
        .eq('id', restaurantId);
    
    if (restaurantError) throw restaurantError;
};

// ============================================
// PLATFORM ANALYTICS
// ============================================

export const getPlatformAnalytics = async (startDate?: Date, endDate?: Date) => {
    const dateFilter = startDate && endDate ? {
        gte: startDate.toISOString(),
        lte: endDate.toISOString()
    } : {};

    const [
        usersResult,
        restaurantsResult,
        ordersResult,
        revenueResult
    ] = await Promise.all([
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('restaurants').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }),
        supabaseAdmin
            .from('orders')
            .select('total')
            .eq('status', 'completed')
            .gte('created_at', dateFilter.gte || '1970-01-01')
            .lte('created_at', dateFilter.lte || new Date().toISOString())
    ]);

    if (usersResult.error) throw usersResult.error;
    if (restaurantsResult.error) throw restaurantsResult.error;
    if (ordersResult.error) throw ordersResult.error;
    if (revenueResult.error) throw revenueResult.error;

    const totalRevenue = revenueResult.data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

    return {
        totalUsers: usersResult.count || 0,
        totalRestaurants: restaurantsResult.count || 0,
        totalOrders: ordersResult.count || 0,
        totalRevenue,
        averageOrderValue: ordersResult.count ? totalRevenue / ordersResult.count : 0
    };
};

export const getRestaurantAnalytics = async (restaurantId: string) => {
    const [
        ordersResult,
        revenueResult,
        staffResult
    ] = await Promise.all([
        supabaseAdmin
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', restaurantId),
        supabaseAdmin
            .from('orders')
            .select('total')
            .eq('restaurant_id', restaurantId)
            .eq('status', 'completed'),
        supabaseAdmin
            .from('restaurant_users')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', restaurantId)
            .eq('active', true)
    ]);

    if (ordersResult.error) throw ordersResult.error;
    if (revenueResult.error) throw revenueResult.error;
    if (staffResult.error) throw staffResult.error;

    const totalRevenue = revenueResult.data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

    return {
        totalOrders: ordersResult.count || 0,
        totalRevenue,
        averageOrderValue: ordersResult.count ? totalRevenue / ordersResult.count : 0,
        activeStaff: staffResult.count || 0
    };
};

// ============================================
// SYSTEM CONFIGURATION
// ============================================

export const updatePlatformSettings = async (settings: Record<string, any>) => {
    const { error } = await supabaseAdmin
        .from('platform_settings')
        .upsert({
            id: 'system',
            config: settings,
            updated_at: new Date().toISOString()
        });
    
    if (error) throw error;
};

export const getPlatformSettings = async () => {
    const { data, error } = await supabaseAdmin
        .from('platform_settings')
        .select('config')
        .eq('id', 'system')
        .maybeSingle();
    
    if (error) throw error;
    return data?.config || {};
};

// ============================================
// BULK OPERATIONS
// ============================================

export const bulkUpdateRestaurantStatus = async (restaurantIds: string[], status: 'active' | 'suspended' | 'rejected', reason?: string) => {
    const updateData: any = { 
        status, 
        updated_at: new Date().toISOString() 
    };
    
    if (reason) {
        updateData.status_reason = reason;
    }

    const { error } = await supabaseAdmin
        .from('restaurants')
        .update(updateData)
        .in('id', restaurantIds);
    
    if (error) throw error;
};

export const bulkDeleteRestaurants = async (restaurantIds: string[]) => {
    // This would cascade delete all related data
    const { error } = await supabaseAdmin
        .from('restaurants')
        .delete()
        .in('id', restaurantIds);
    
    if (error) throw error;
};