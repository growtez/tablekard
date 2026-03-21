/**
 * Supabase Service for Restaurant Admin Panel
 *
 * Core operations for restaurant management:
 * - Restaurant profile
 * - Menu management
 * - Orders overview
 * - Tables (with full CRUD operations)
 *
 * NOTE: We use `(supabase as any).from(...)` to bypass a type incompatibility between
 * `@supabase/supabase-js` v2.95+ and our manually-written Database type. The functions
 * still return fully-typed values via explicit TypeScript return types.
 */

import { supabase } from '@restaurant-saas/supabase';
import type { MenuItem, MenuCategory, Restaurant, Order, OrderStatus, Profile } from '@restaurant-saas/types';

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
    profile_urls: string[] | null; settings: Record<string, unknown> | null;
    subscription_status: boolean; subscription_type: string | null;
    latitude: number | null; longitude: number | null; allowed_radius: number | null;
    created_at: string; updated_at: string;
}

interface ProfileRow {
    id: string; email: string; name: string | null; role: Profile['role'];
    avatar_url: string | null; created_at: string; updated_at: string;
}

interface MenuItemRow {
    id: string; restaurant_id: string; category_id: string | null; name: string;
    short_description: string | null; long_description: string | null; price: number; discount_price: number | null;
    is_available: boolean; is_veg: boolean;
    preparation_time: number | null; tags: string[] | null;
    variants: unknown[] | null; addons: unknown[] | null;
    created_at: string; updated_at: string;
    menu_item_images?: { id: string; image_url: string; sort_order: number }[];
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

export interface RestaurantProfileUpdateInput {
    name: string;
    contactEmail: string;
    contactPhone?: string | null;
    contactAddress?: string | null;
    logoUrl?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    allowedRadius?: number | null;
}

export interface AdministratorProfileUpdateInput {
    currentEmail: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
}

export interface AdministratorProfileUpdateResult {
    profile: Profile;
    emailChangePending: boolean;
    pendingEmail?: string;
}

const mapRestaurantRow = (row: RestaurantRow): Restaurant => ({
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
    settings: row.settings ?? undefined,
    subscriptionStatus: row.subscription_status,
    subscriptionType: row.subscription_type,
    profileUrls: row.profile_urls ?? [],
    location: {
        latitude: row.latitude,
        longitude: row.longitude,
        allowedRadius: row.allowed_radius
    }
});

const mapProfileRow = (row: ProfileRow): Profile => ({
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
});

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
    return mapRestaurantRow(data as RestaurantRow);
};

export const updateRestaurantProfile = async (
    restaurantId: string,
    input: RestaurantProfileUpdateInput
): Promise<Restaurant> => {
    const { data, error } = await db
        .from('restaurants')
        .update({
            name: input.name,
            contact_email: input.contactEmail,
            contact_phone: input.contactPhone ?? null,
            contact_address: input.contactAddress ?? null,
            logo_url: input.logoUrl ?? null,
            primary_color: input.primaryColor ?? null,
            secondary_color: input.secondaryColor ?? null,
            latitude: input.latitude ?? null,
            longitude: input.longitude ?? null,
            allowed_radius: input.allowedRadius ?? null
        })
        .eq('id', restaurantId)
        .select('*')
        .single();

    if (error) throw error;
    return mapRestaurantRow(data as RestaurantRow);
};

export const updateAdministratorProfile = async (
    userId: string,
    input: AdministratorProfileUpdateInput
): Promise<AdministratorProfileUpdateResult> => {
    const normalizedEmail = input.email.trim().toLowerCase();
    const normalizedCurrentEmail = input.currentEmail.trim().toLowerCase();
    let emailChangePending = false;

    if (normalizedEmail !== normalizedCurrentEmail) {
        const { data, error } = await supabase.auth.updateUser({ email: normalizedEmail });
        if (error) throw error;

        const authUser = data.user as { email?: string | null } | null;
        emailChangePending = authUser?.email?.toLowerCase() !== normalizedEmail;
    }

    const profilePatch: {
        email?: string;
        name: string;
        avatar_url: string | null;
    } = {
        name: input.name,
        avatar_url: input.avatarUrl ?? null
    };

    if (!emailChangePending) {
        profilePatch.email = normalizedEmail;
    }

    const { data, error } = await db
        .from('profiles')
        .update(profilePatch)
        .eq('id', userId)
        .select('id, email, name, role, avatar_url, created_at, updated_at')
        .single();

    if (error) throw error;

    return {
        profile: mapProfileRow(data as ProfileRow),
        emailChangePending,
        pendingEmail: emailChangePending ? normalizedEmail : undefined
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
    description: row.short_description || row.long_description, // fallback to match existing type, or adjust type later
    price: row.price,
    discountPrice: row.discount_price,
    images: row.menu_item_images 
        ? row.menu_item_images.map(img => ({
            id: img.id,
            menuItemId: row.id,
            restaurantId: row.restaurant_id,
            url: img.image_url,
            sortOrder: img.sort_order
          })).sort((a, b) => a.sortOrder - b.sortOrder)
        : [],
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
        .select(`
            *,
            menu_item_images (
                id,
                image_url,
                sort_order
            )
        `)
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
        short_description?: string;
        long_description?: string;
        is_available?: boolean;
        is_veg?: boolean;
        menu_item_images?: { url: string; sortOrder: number }[];
    }
): Promise<MenuItem> => {
    // 1. Insert the main item
    const { menu_item_images, ...itemData } = item;
    const { data: insertedItem, error } = await db
        .from('menu_items')
        .insert({ restaurant_id: restaurantId, ...itemData })
        .select()
        .single();
    if (error) throw error;

    // 2. Insert images if any
    let uploadedImages: any[] = [];
    if (menu_item_images && menu_item_images.length > 0) {
        const imagesToInsert = menu_item_images.map(img => ({
            menu_item_id: insertedItem.id,
            restaurant_id: restaurantId,
            image_url: img.url,
            sort_order: img.sortOrder
        }));

        const { data: insertedImages, error: imgError } = await db
            .from('menu_item_images')
            .insert(imagesToInsert)
            .select('id, image_url, sort_order');
            
        if (imgError) {
            console.error('Failed to insert menu item images', imgError);
            // Non-blocking error for main item creation
        } else {
            uploadedImages = insertedImages || [];
        }
    }

    return mapMenuItemRow({ ...insertedItem, menu_item_images: uploadedImages } as MenuItemRow);
};

export const updateMenuItem = async (
    itemId: string,
    item: Partial<{
        name: string;
        price: number;
        category_id: string;
        short_description: string | null;
        long_description: string | null;
        discount_price: number | null;
        is_available: boolean;
        is_veg: boolean;
        preparation_time: number | null;
        tags: string[] | null;
        variants: any[] | null;
        addons: any[] | null;
    }>,
    images?: { id?: string; url: string; sortOrder: number; isDeleted?: boolean }[]
): Promise<void> => {
    // 1. Update main item
    if (Object.keys(item).length > 0) {
        const { error } = await db
            .from('menu_items')
            .update(item)
            .eq('id', itemId);
        if (error) throw error;
    }

    // 2. Handle images if provided
    if (images) {
        // Find existing restaurant_id for the item
        const { data: itemData } = await db.from('menu_items').select('restaurant_id').eq('id', itemId).single();
        if (!itemData) return;
        
        const restaurantId = itemData.restaurant_id;

        // a) Delete removed images
        const deletedImageIds = images.filter(img => img.isDeleted && img.id).map(img => img.id);
        if (deletedImageIds.length > 0) {
            await db.from('menu_item_images').delete().in('id', deletedImageIds);
        }

        // b) Insert new images
        const newImages = images.filter(img => !img.id && !img.isDeleted);
        if (newImages.length > 0) {
            const imagesToInsert = newImages.map(img => ({
                menu_item_id: itemId,
                restaurant_id: restaurantId,
                image_url: img.url,
                sort_order: img.sortOrder
            }));
            await db.from('menu_item_images').insert(imagesToInsert);
        }

        // c) Update existing images (e.g. sort order changes)
        // Since Supabase doesn't support bulk updates easily, we do it one by one or via an upsert
        const existingImagesToUpdate = images.filter(img => img.id && !img.isDeleted);
        for (const img of existingImagesToUpdate) {
            await db.from('menu_item_images')
               .update({ sort_order: img.sortOrder })
               .eq('id', img.id);
        }
    }
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

export interface DashboardOrder {
    id: string;
    orderNumber: string;
    table: string;
    time: string;
    status: string;
    statusColor: string;
    paymentMethod: string;
    items: string;
    createdAt: string;
}

export const getDashboardOrders = async (restaurantId: string): Promise<DashboardOrder[]> => {
    const { data, error } = await db
        .from('orders')
        .select(`
            id,
            order_number,
            created_at,
            status,
            payment_method,
            restaurant_tables(table_number),
            order_items(name, quantity)
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => {
        const table = Array.isArray(row.restaurant_tables) ? row.restaurant_tables[0] : row.restaurant_tables;
        const itemsList = Array.isArray(row.order_items) ? row.order_items : [];
        const itemsStr = itemsList.map((item: any) => `${item.name} x${item.quantity}`).join(', ');

        let statusColor = 'yellow';
        const st = (row.status || '').toLowerCase();
        if (st === 'preparing') statusColor = 'blue';
        else if (st === 'ready') statusColor = 'green';
        else if (st === 'served' || st === 'completed') statusColor = 'teal';
        else if (st === 'cancelled') statusColor = 'red';

        return {
            id: row.id,
            orderNumber: row.order_number || 'UNKNOWN',
            table: table?.table_number ? `Table ${table.table_number}` : 'N/A',
            time: new Date(row.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            status: (row.status || 'New').charAt(0).toUpperCase() + (row.status || 'New').slice(1),
            statusColor: statusColor,
            paymentMethod: row.payment_method || 'Cash',
            items: itemsStr,
            createdAt: row.created_at
        };
    });
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
    const { error } = await db
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    if (error) throw error;
};

// ==========================================
// Payments
// ==========================================

export interface PaymentTransaction {
    id: string;
    orderNumber: string;
    customerName: string;
    tableNo: string;
    dateTime: string;
    paymentMethod: string;
    paymentStatus: string;
    statusColor: string;
    amount: number;
    orderItems: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    createdAt: string;
}

export const getPaymentTransactions = async (restaurantId: string): Promise<PaymentTransaction[]> => {
    const { data, error } = await db
        .from('orders')
        .select(`
            id,
            order_number,
            created_at,
            payment_method,
            payment_status,
            total,
            profiles(name),
            restaurant_tables(table_number),
            order_items(name, quantity, price)
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        const table = Array.isArray(row.restaurant_tables) ? row.restaurant_tables[0] : row.restaurant_tables;

        return {
            id: row.id,
            orderNumber: row.order_number || 'UNKNOWN',
            customerName: profile?.name || 'Guest',
            tableNo: table?.table_number ? `Table ${table.table_number}` : 'N/A',
            dateTime: new Date(row.created_at).toLocaleString('en-US', {
                month: 'short', day: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }),
            paymentMethod: row.payment_method || 'Cash',
            paymentStatus: (row.payment_status || 'pending').charAt(0).toUpperCase() + (row.payment_status || 'pending').slice(1),
            statusColor: (row.payment_status || 'pending').toLowerCase(),
            amount: Number(row.total) || 0,
            orderItems: Array.isArray(row.order_items) ? row.order_items : [],
            createdAt: row.created_at
        };
    });
};

export const updatePaymentStatus = async (orderId: string, paymentStatus: string): Promise<void> => {
    const { error } = await db
        .from('orders')
        .update({ payment_status: paymentStatus.toLowerCase(), updated_at: new Date().toISOString() })
        .eq('id', orderId);
    if (error) throw error;
};

// ==========================================
// Restaurant Tables (Full CRUD Operations)
// ==========================================

export interface RestaurantTable {
    id: string;
    table_number: number;
    capacity: number;
    active: boolean;
    qr_code_url: string | null;
}

/**
 * Get all tables for a restaurant
 */
export const getRestaurantTables = async (restaurantId: string): Promise<RestaurantTable[]> => {
    const { data, error } = await db
        .from('restaurant_tables')
        .select('id, table_number, capacity, active, qr_code_url')
        .eq('restaurant_id', restaurantId)
        .order('table_number', { ascending: true });
    if (error) throw error;
    return (data || []).map((row: any) => ({
        id: row.id,
        table_number: row.table_number,
        capacity: row.capacity ?? 4,
        active: row.active ?? true,
        qr_code_url: row.qr_code_url ?? null
    }));
};

/**
 * Create a new table
 */
export const createRestaurantTable = async (
    restaurantId: string,
    tableData: {
        table_number: number;
        capacity: number;
        active?: boolean;
    }
): Promise<RestaurantTable> => {
    const { data, error } = await db
        .from('restaurant_tables')
        .insert({
            restaurant_id: restaurantId,
            table_number: tableData.table_number,
            capacity: tableData.capacity,
            active: tableData.active ?? true,
            qr_code_url: null
        })
        .select('id, table_number, capacity, active, qr_code_url')
        .single();

    if (error) throw error;

    return {
        id: data.id,
        table_number: data.table_number,
        capacity: data.capacity ?? 4,
        active: data.active ?? true,
        qr_code_url: data.qr_code_url ?? null
    };
};

/**
 * Update an existing table
 */
export const updateRestaurantTable = async (
    tableId: string,
    tableData: Partial<{
        table_number: number;
        capacity: number;
        active: boolean;
        qr_code_url: string | null;
    }>
): Promise<void> => {
    const { error } = await db
        .from('restaurant_tables')
        .update(tableData)
        .eq('id', tableId);

    if (error) throw error;
};

/**
 * Delete a table
 */
export const deleteRestaurantTable = async (tableId: string): Promise<void> => {
    const { error } = await db
        .from('restaurant_tables')
        .delete()
        .eq('id', tableId);

    if (error) throw error;
};

/**
 * Toggle table active status
 */
export const toggleTableActiveStatus = async (tableId: string, active: boolean): Promise<void> => {
    const { error } = await db
        .from('restaurant_tables')
        .update({ active })
        .eq('id', tableId);

    if (error) throw error;
};
