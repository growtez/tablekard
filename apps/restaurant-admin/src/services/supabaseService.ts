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
    subscription_status: boolean; subscription_type: string | null; subscription_end_at: string | null;
    latitude: number | null; longitude: number | null; allowed_radius: number | null;
    opening_date: string | null; tagline: string | null; manifesto: string | null;
    operating_hours_weekdays: string | null; operating_hours_weekends: string | null;
    instagram_url: string | null; facebook_url: string | null; website_url: string | null;
    created_at: string; updated_at: string;
}

interface ProfileRow {
    id: string; email: string; name: string | null; role: Profile['role'];
    avatar_url: string | null; created_at: string; updated_at: string;
}

interface MenuItemRow {
    id: string; restaurant_id: string; category_id: string | null; name: string;
    short_description: string | null; long_description: string | null; price: number; is_available: boolean; is_veg: boolean;
    discount_price: number | null;
    preparation_time: number | null;
    serves: number;
    tags: string[] | null;
    variants: unknown[] | null; addons: unknown[] | null;
    model_url: string | null;
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
    subtotal: number; taxes: number; discount: number; total: number;
    status: string; payment_method: string; payment_status: string;
    transaction_id: string | null; created_at: string; updated_at: string;
    profiles?: { name?: string; email?: string } | { name?: string; email?: string }[];
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
    openingDate?: string | null;
    tagline?: string | null;
    manifesto?: string | null;
    operatingHoursWeekdays?: string | null;
    operatingHoursWeekends?: string | null;
    instagramUrl?: string | null;
    facebookUrl?: string | null;
    websiteUrl?: string | null;
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
    subscriptionEndAt: row.subscription_end_at,
    profileUrls: row.profile_urls ?? [],
    location: {
        latitude: row.latitude,
        longitude: row.longitude,
        allowedRadius: row.allowed_radius
    },
    openingDate: row.opening_date,
    tagline: row.tagline,
    manifesto: row.manifesto,
    operatingHoursWeekdays: row.operating_hours_weekdays,
    operatingHoursWeekends: row.operating_hours_weekends,
    instagramUrl: row.instagram_url,
    facebookUrl: row.facebook_url,
    websiteUrl: row.website_url
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
            allowed_radius: input.allowedRadius ?? null,
            opening_date: input.openingDate ?? null,
            tagline: input.tagline ?? null,
            manifesto: input.manifesto ?? null,
            operating_hours_weekdays: input.operatingHoursWeekdays ?? null,
            operating_hours_weekends: input.operatingHoursWeekends ?? null,
            instagram_url: input.instagramUrl ?? null,
            facebook_url: input.facebookUrl ?? null,
            website_url: input.websiteUrl ?? null
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
    shortDescription: row.short_description,
    longDescription: row.long_description,
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
    serves: row.serves,
    tags: row.tags,
    variants: (row.variants as any) ?? undefined,
    addons: (row.addons as any) ?? undefined,
    modelUrl: row.model_url
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
        short_description?: string | null;
        long_description?: string | null;
        discount_price?: number | null;
        is_available?: boolean;
        is_veg?: boolean;
        preparation_time?: number | null;
        serves?: number;
        tags?: string[] | null;
        variants?: any[] | null;
        addons?: any[] | null;
        model_url?: string | null;
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
        serves: number;
        tags: string[] | null;
        variants: any[] | null;
        addons: any[] | null;
        model_url: string | null;
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
// Offers
// ==========================================

export interface OfferRow {
    id: string;
    restaurant_id: string;
    menu_item_id: string;
    title: string;
    discount_price: number;
    valid_until: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const getOffers = async (restaurantId: string): Promise<OfferRow[]> => {
    const { data, error } = await db
        .from('offers')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as OfferRow[];
};

export const addOffer = async (
    restaurantId: string,
    offer: {
        menu_item_id: string;
        title: string;
        discount_price: number;
        valid_until?: string | null;
        is_active?: boolean;
    }
): Promise<OfferRow> => {
    const { data, error } = await db
        .from('offers')
        .insert({ restaurant_id: restaurantId, ...offer })
        .select()
        .single();
    if (error) throw error;
    return data as OfferRow;
};

export const updateOffer = async (
    offerId: string,
    offer: Partial<{
        menu_item_id: string;
        title: string;
        discount_price: number;
        valid_until: string | null;
        is_active: boolean;
    }>
): Promise<void> => {
    const { error } = await db
        .from('offers')
        .update(offer)
        .eq('id', offerId);
    if (error) throw error;
};

export const deleteOffer = async (offerId: string): Promise<void> => {
    const { error } = await db
        .from('offers')
        .delete()
        .eq('id', offerId);
    if (error) throw error;
};

export const toggleOfferActive = async (offerId: string, isActive: boolean): Promise<void> => {
    const { error } = await db
        .from('offers')
        .update({ is_active: isActive })
        .eq('id', offerId);
    if (error) throw error;
};

// ==========================================
// Orders
// ==========================================

export const getOrders = async (restaurantId: string, limitCount: number = 50): Promise<Order[]> => {
    const { data, error } = await db
        .from('orders')
        .select(`
            *,
            profiles(name)
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(limitCount);
    if (error) throw error;
    return ((data ?? []) as OrderRow[]).map(row => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        return {
            id: row.id,
            restaurantId: row.restaurant_id,
            orderNumber: row.order_number,
            type: row.type as Order['type'],
            tableNumber: row.table_number ?? undefined,
            customerId: row.customer_id ?? undefined,
            customerName: profile?.name ?? undefined,
            customerPhone: undefined,
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
        };
    });
};

export interface DashboardOrder {
    id: string;
    orderNumber: string;
    customerName: string;
    orderType: string;
    table: string;
    time: string;
    status: string;
    statusColor: string;
    paymentMethod: string;
    paymentStatus: string;
    paymentStatusColor: string;
    items: string;
    rawItems: { name: string; quantity: number; price: number }[];
    orderItems: { name: string; quantity: number; price: number; special_instructions?: string }[];
    customer: string;
    subtotal: number;
    taxes: number;
    discount: number;
    total: number;
    isPaid: boolean;
    createdAt: string;
}

export const getDashboardOrders = async (restaurantId: string): Promise<DashboardOrder[]> => {
    const { data, error } = await db
        .from('orders')
        .select(`
            id,
            order_number,
            type,
            status,
            payment_method,
            payment_status,
            subtotal,
            taxes,
            discount,
            total,
            created_at,
            restaurant_tables(table_number),
            profiles(name),
            order_items(name, quantity, price, special_instructions, status)
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => {
        const table = Array.isArray(row.restaurant_tables) ? row.restaurant_tables[0] : row.restaurant_tables;
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
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
            customerName: profile?.name || 'Guest',
            orderType: row.type || 'dine_in',
            table: table?.table_number ? `Table ${table.table_number}` : 'N/A',
            time: new Date(row.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            status: (row.status || 'New').charAt(0).toUpperCase() + (row.status || 'New').slice(1),
            statusColor: statusColor,
            paymentMethod: row.payment_method || 'Cash',
            paymentStatus: (row.payment_status || 'pending').charAt(0).toUpperCase() + (row.payment_status || 'pending').slice(1),
            paymentStatusColor: (row.payment_status || 'pending').toLowerCase(),
            items: itemsStr,
            rawItems: itemsList.map((item: any) => ({
                name: item.name,
                quantity: item.quantity,
                price: Number(item.price) || 0
            })),
            orderItems: itemsList.map((item: any) => ({
                name: item.name,
                quantity: item.quantity,
                price: Number(item.price) || 0,
                special_instructions: item.special_instructions || undefined,
                status: item.status || 'placed'
            })),
            customer: profile?.name || 'Guest',
            subtotal: Number(row.subtotal) || 0,
            taxes: Number(row.taxes) || 0,
            discount: Number(row.discount) || 0,
            total: Number(row.total) || 0,
            isPaid: (row.payment_status || '').toLowerCase() === 'paid',
            createdAt: row.created_at
        };
    });
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
    const { error } = await db
        .from('orders')
        .update({ status: status.toLowerCase(), updated_at: new Date().toISOString() })
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

        let pStatus = (row.payment_status || 'pending').toLowerCase();
        const createdDate = new Date(row.created_at);
        const hoursSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60);

        if (pStatus === 'pending' && hoursSinceCreation > 6) {
            pStatus = 'failed';
            // Lazily update the database in the background so the failure is persisted
            updatePaymentStatus(row.id, 'failed').catch(err => 
                console.error('Failed to auto-cancel old pending payment:', err)
            );
        }

        return {
            id: row.id,
            orderNumber: row.order_number || 'UNKNOWN',
            customerName: profile?.name || 'Guest',
            tableNo: table?.table_number ? `Table ${table.table_number}` : 'N/A',
            dateTime: createdDate.toLocaleString('en-US', {
                month: 'short', day: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }),
            paymentMethod: row.payment_method || 'Cash',
            paymentStatus: pStatus.charAt(0).toUpperCase() + pStatus.slice(1),
            statusColor: pStatus,
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

export const updateSubscriptionPaymentStatus = async (paymentId: string, status: string): Promise<void> => {
    const { error } = await db
        .from('subscription_payments')
        .update({ status: status.toLowerCase() })
        .eq('id', paymentId);
    if (error) throw error;
};

// ==========================================
// Revenue
// ==========================================

export interface RevenueRecord {
    id: string;
    restaurantId: string;
    revenueDate: string;
    totalOrders: number;
    totalRevenue: number;
    totalTax: number;
    totalDiscount: number;
    createdAt: string;
    updatedAt: string;
}

export const getRevenueData = async (restaurantId: string): Promise<RevenueRecord[]> => {
    const { data, error } = await db
        .from('revenue')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('revenue_date', { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => ({
        id: row.id,
        restaurantId: row.restaurant_id,
        revenueDate: row.revenue_date,
        totalOrders: row.total_orders,
        totalRevenue: Number(row.total_revenue),
        totalTax: Number(row.total_tax),
        totalDiscount: Number(row.total_discount),
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }));
};

/**
 * Analytics & Reports
 */

export interface AnalyticsSummary {
    totalRevenue: number;
    totalOrders: number;
    revenueChange: number;
    ordersChange: number;
}

export const getAnalyticsSummary = async (
    restaurantId: string,
    startDate: Date,
    endDate: Date
): Promise<AnalyticsSummary> => {
    // 1. Fetch current period data from revenue table
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const { data, error } = await db
        .from('revenue')
        .select('total_revenue, total_orders')
        .eq('restaurant_id', restaurantId)
        .gte('revenue_date', startStr)
        .lte('revenue_date', endStr);

    if (error) throw error;

    const totalRevenue = (data || []).reduce((sum: number, row: any) => sum + Number(row.total_revenue), 0);
    const totalOrders = (data || []).reduce((sum: number, row: any) => sum + Number(row.total_orders), 0);

    // 2. Fetch previous period for comparison
    const diff = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - diff - 86400000);
    const prevEndDate = new Date(startDate.getTime() - 86400000);

    const prevStartStr = prevStartDate.toISOString().split('T')[0];
    const prevEndStr = prevEndDate.toISOString().split('T')[0];

    const { data: prevData, error: prevError } = await db
        .from('revenue')
        .select('total_revenue, total_orders')
        .eq('restaurant_id', restaurantId)
        .gte('revenue_date', prevStartStr)
        .lte('revenue_date', prevEndStr);

    if (prevError) throw prevError;

    const prevRevenue = (prevData || []).reduce((sum: number, row: any) => sum + Number(row.total_revenue), 0);
    const prevOrders = (prevData || []).reduce((sum: number, row: any) => sum + Number(row.total_orders), 0);

    const revenueChange = prevRevenue === 0 ? (totalRevenue > 0 ? 100 : 0) : ((totalRevenue - prevRevenue) / prevRevenue) * 100;
    const ordersChange = prevOrders === 0 ? (totalOrders > 0 ? 100 : 0) : ((totalOrders - prevOrders) / prevOrders) * 100;

    return {
        totalRevenue,
        totalOrders,
        revenueChange,
        ordersChange
    };
};

export interface RevenueBreakdown {
    aov: number;
    aovChange: number;
    orderTypeSplit: { dineIn: number; takeaway: number };
    paymentMethodSplit: { cash: number; online: number };
    impactAnalysis: {
        totalDiscount: number;
        discountRate: number;
        totalTax: number;
        taxRate: number;
    };
}

export const getAdvancedAnalytics = async (
    restaurantId: string,
    startDate: Date,
    endDate: Date
): Promise<RevenueBreakdown> => {
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();

    const { data: currentOrders, error } = await db
        .from('orders')
        .select('total, subtotal, discount, taxes, type, payment_method')
        .eq('restaurant_id', restaurantId)
        .eq('payment_status', 'paid')
        .gte('created_at', startStr)
        .lte('created_at', endStr);

    if (error) throw error;

    const diff = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - diff - 86400000);
    const prevEndDate = new Date(startDate.getTime() - 86400000);

    const { data: prevOrders, error: prevError } = await db
        .from('orders')
        .select('total')
        .eq('restaurant_id', restaurantId)
        .eq('payment_status', 'paid')
        .gte('created_at', prevStartDate.toISOString())
        .lte('created_at', prevEndDate.toISOString());

    if (prevError) throw prevError;

    const currentTotalRevenue = (currentOrders || []).reduce((sum: number, order: any) => sum + Number(order.total), 0);
    const currentTotalOrders = (currentOrders || []).length;
    const currentAOV = currentTotalOrders > 0 ? currentTotalRevenue / currentTotalOrders : 0;

    const prevTotalRevenue = (prevOrders || []).reduce((sum: number, order: any) => sum + Number(order.total), 0);
    const prevTotalOrders = (prevOrders || []).length;
    const prevAOV = prevTotalOrders > 0 ? prevTotalRevenue / prevTotalOrders : 0;

    const aovChange = prevAOV === 0 ? (currentAOV > 0 ? 100 : 0) : ((currentAOV - prevAOV) / prevAOV) * 100;

    let dineInOrders = 0;
    let takeawayOrders = 0;
    
    let cashOrders = 0;
    let onlineOrders = 0;

    (currentOrders || []).forEach((order: any) => {
        if (order.type === 'dine_in') {
            dineInOrders++;
        } else {
            takeawayOrders++;
        }

        if (order.payment_method === 'cash') {
            cashOrders++;
        } else {
            onlineOrders++;
        }
    });

    const totalTypedOrders = dineInOrders + takeawayOrders;
    const orderTypeSplit = {
        dineIn: totalTypedOrders > 0 ? (dineInOrders / totalTypedOrders) * 100 : 0,
        takeaway: totalTypedOrders > 0 ? (takeawayOrders / totalTypedOrders) * 100 : 0,
    };

    const totalPaidOrders = cashOrders + onlineOrders;
    const paymentMethodSplit = {
        cash: totalPaidOrders > 0 ? (cashOrders / totalPaidOrders) * 100 : 0,
        online: totalPaidOrders > 0 ? (onlineOrders / totalPaidOrders) * 100 : 0,
    };

    const currentTotalSubtotal = (currentOrders || []).reduce((sum: number, order: any) => sum + Number(order.subtotal || 0), 0);
    const currentTotalDiscount = (currentOrders || []).reduce((sum: number, order: any) => sum + Number(order.discount || 0), 0);
    const currentTotalTax = (currentOrders || []).reduce((sum: number, order: any) => sum + Number(order.taxes || 0), 0);

    const discountRate = currentTotalSubtotal > 0 ? (currentTotalDiscount / currentTotalSubtotal) * 100 : 0;
    const taxRate = currentTotalRevenue > 0 ? (currentTotalTax / currentTotalRevenue) * 100 : 0;

    return {
        aov: currentAOV,
        aovChange,
        orderTypeSplit,
        paymentMethodSplit,
        impactAnalysis: {
            totalDiscount: currentTotalDiscount,
            discountRate,
            totalTax: currentTotalTax,
            taxRate
        }
    };
};

export const getActiveTablesCount = async (restaurantId: string): Promise<number> => {
    // Fetch count of tables where active is true for this restaurant
    const { count, error } = await db
        .from('restaurant_tables')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('active', true);

    if (error) throw error;
    return count || 0;
};

export const getTotalMenuItemsCount = async (restaurantId: string): Promise<number> => {
    const { count, error } = await db
        .from('menu_items')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId);

    if (error) throw error;
    return count || 0;
};

// ==========================================
// Peak Hour Heatmap
// ==========================================

// heatData[dayIndex][hourIndex] = order count (dayIndex: 0=Mon, hourIndex: 0=12am)
export type PeakHourData = number[][];

export const getPeakHourData = async (restaurantId: string): Promise<PeakHourData> => {
    // Fetch created_at for all orders of this restaurant
    const { data, error } = await db
        .from('orders')
        .select('created_at')
        .eq('restaurant_id', restaurantId);

    if (error) {
        console.error('Error fetching peak hour data:', error);
        return Array.from({ length: 7 }, () => Array(24).fill(0));
    }

    // Build a 7x24 grid initialised to 0
    // Rows: Mon(0) … Sun(6)   Columns: hour 0-23
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

    (data || []).forEach((row: any) => {
        const d = new Date(row.created_at);
        // getDay() returns 0=Sun, 1=Mon … 6=Sat — remap to 0=Mon … 6=Sun
        const dayOfWeek = (d.getDay() + 6) % 7;
        const hour = d.getHours();
        grid[dayOfWeek][hour] += 1;
    });

    return grid;
};

// ==========================================
// Best Selling Dishes
// ==========================================

export interface BestSellingDish {
    name: string;
    sold: number;
    trend: string;
    revenue: number;
    image: string;
}

export const getBestSellingDishes = async (restaurantId: string): Promise<BestSellingDish[]> => {
    // Fetch top 5 items by sales_count from menu_items
    const { data, error } = await db
        .from('menu_items')
        .select('name, sales_count, price')
        .eq('restaurant_id', restaurantId)
        .gt('sales_count', 0)
        .order('sales_count', { ascending: false });

    if (error) {
        console.error("Error fetching best selling from menu_items:", error);
        return [];
    }

    const getEmojiForDish = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('chicken') || lower.includes('meat')) return '🍗';
        if (lower.includes('paneer') || lower.includes('cheese')) return '🧀';
        if (lower.includes('biryani') || lower.includes('rice')) return '🍛';
        if (lower.includes('naan') || lower.includes('roti') || lower.includes('bread')) return '🫓';
        if (lower.includes('drink') || lower.includes('lassi') || lower.includes('coffee')) return '🥤';
        return '🍽️';
    };

    return (data || []).map((row: any) => ({
        name: row.name,
        sold: row.sales_count || 0,
        trend: row.sales_count > 20 ? '🔥 Top Pick' : 'Trending',
        revenue: (row.sales_count || 0) * (Number(row.price) || 0),
        image: getEmojiForDish(row.name)
    }));
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

// ==========================================
// Subscription Payments
// ==========================================

export interface SubscriptionPaymentRecord {
    id: string;
    planDuration: number;
    amount: number;
    status: string;
    paidAt: string | null;
    startsAt: string | null;
    endsAt: string | null;
    createdAt: string;
}

export const getSubscriptionPayments = async (restaurantId: string): Promise<SubscriptionPaymentRecord[]> => {
    const { data, error } = await db
        .from('subscription_payments')
        .select('id, plan_duration, amount, status, paid_at, starts_at, ends_at, created_at')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    // Show raw DB status — 'failed' only appears after the super-admin
    // has authorised the update via the service role key.
    return ((data ?? []) as any[]).map(row => ({
        id: row.id,
        planDuration: row.plan_duration,
        amount: Number(row.amount),
        status: row.status,
        paidAt: row.paid_at,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        createdAt: row.created_at
    }));
};

// ==========================================
// BCG Matrix & Feedback
// ==========================================

export interface BCGItem {
    id: string;
    name: string;
    sales: number;
    revenue: number;
    category: 'star' | 'cow' | 'gem' | 'dog';
}

export const getBCGMatrixData = async (restaurantId: string): Promise<BCGItem[]> => {
    const { data, error } = await db
        .from('menu_items')
        .select('id, name, sales_count, price')
        .eq('restaurant_id', restaurantId);

    if (error) {
        console.error("Error fetching BCG data:", error);
        return [];
    }

    const items = (data || []).map((row: any) => {
        const sales = row.sales_count || 0;
        const price = Number(row.price) || 0;
        return {
            id: row.id,
            name: row.name,
            sales,
            revenue: sales * price
        };
    });

    if (items.length === 0) return [];

    const totalSales = items.reduce((sum: number, item: any) => sum + item.sales, 0);
    const totalRevenue = items.reduce((sum: number, item: any) => sum + item.revenue, 0);
    
    const avgSales = totalSales / items.length;
    const avgRevenue = totalRevenue / items.length;

    return items.map((item: any) => {
        let category: 'star' | 'cow' | 'gem' | 'dog' = 'dog';
        if (item.sales >= avgSales && item.revenue >= avgRevenue) category = 'star';
        else if (item.sales >= avgSales && item.revenue < avgRevenue) category = 'cow';
        else if (item.sales < avgSales && item.revenue >= avgRevenue) category = 'gem';
        else category = 'dog';

        return { ...item, category };
    });
};

export interface FeedbackRecord {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    customerName: string;
    orderItems: string;
}

export const getRecentFeedback = async (restaurantId: string): Promise<FeedbackRecord[]> => {
    const { data, error } = await db
        .from('feedback')
        .select(`
            id,
            rating,
            comment,
            created_at,
            orders!inner(
                restaurant_id,
                profiles(name),
                order_items(name)
            )
        `)
        .eq('orders.restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error("Error fetching feedback:", error);
        return [];
    }

    return (data || []).map((row: any) => {
        const order = Array.isArray(row.orders) ? row.orders[0] : row.orders;
        const profile = order?.profiles ? (Array.isArray(order.profiles) ? order.profiles[0] : order.profiles) : null;
        const items = order?.order_items || [];
        const itemsStr = Array.isArray(items) ? items.map((i: any) => i.name).join(', ') : '';

        return {
            id: row.id,
            rating: row.rating,
            comment: row.comment || '',
            createdAt: row.created_at,
            customerName: profile?.name || 'Guest',
            orderItems: itemsStr
        };
    });
};
