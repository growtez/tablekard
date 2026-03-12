import { supabase } from '@restaurant-saas/supabase';
import type { MenuCategory, MenuItem, Order, OrderStatus, Restaurant } from '@restaurant-saas/types';

// when developing or running without a real backend you can flip this on
// by setting `VITE_USE_MOCKS=true` in the appropriate env file. the helpers
// will short‑circuit and return hard‑coded arrays so that pages show data.
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface RestaurantRow {
    id: string;
    name: string;
    slug: string;
    status: string;
    contact_email: string | null;
    contact_phone: string | null;
    contact_address: string | null;
    logo_url: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    settings: Record<string, unknown> | null;
    subscription_status: boolean | null;
    subscription_type: string | null;
    latitude: number | null;
    longitude: number | null;
    allowed_radius: number | null;
    created_at: string;
    updated_at: string;
}

interface ProfileRow {
    id: string;
    email: string;
    name: string | null;
    role: string;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

interface RestaurantUserRow {
    id: string;
    restaurant_id: string;
    profile_id: string;
    role: string | null;
    active: boolean | null;
    created_at: string;
    updated_at: string;
}

interface MenuItemRow {
    id: string;
    restaurant_id: string;
    category_id: string | null;
    name: string;
    short_description: string | null;
    price: number;
    discount_price: number | null;
    image_url: string | null;
    is_available: boolean;
    is_veg: boolean;
    preparation_time: number | null;
    tags: string[] | null;
    variants: unknown[] | null;
    addons: unknown[] | null;
}

interface MenuCategoryRow {
    id: string;
    restaurant_id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    sort_order: number;
    active: boolean;
}

interface RestaurantTableRow {
    id: string;
    table_number: number;
    capacity: number | null;
    active: boolean | null;
    qr_code_url: string | null;
}

interface OrderBaseRow {
    id: string;
    order_number: string;
    created_at: string;
    status: string;
    payment_method: string | null;
    payment_status: string | null;
    total: number;
    customer_id: string | null;
    table_id: string | null;
}

interface OrderItemRow {
    order_id: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
}

interface DashboardOrderQueryRow {
    id: string;
    order_number: string;
    created_at: string;
    status: string;
    payment_method: string | null;
    payment_status: string | null;
    total: number;
    customer_name: string | null;
    table_number: number | null;
    order_items: OrderItemRow[];
}

interface DashboardSummaryOrder {
    id: string;
    orderNumber: string;
    table: string;
    orderedTime: string;
    status: string;
    statusColor: string;
    customer: string;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    total: number;
    isPaid: boolean;
    createdAt: string;
}

interface DashboardPendingPayment {
    id: string;
    table: string;
    customer: string;
    amount: number;
    time: string;
}

interface DashboardBestSeller {
    name: string;
    sold: number;
    trend: string;
    revenue: number;
}

export interface DashboardSummary {
    revenueToday: number;
    revenueTodayChange: number;
    revenueWeek: number;
    revenueWeekChange: number;
    activeOrders: DashboardSummaryOrder[];
    completedOrders: DashboardSummaryOrder[];
    pendingPayments: DashboardPendingPayment[];
    bestSelling: DashboardBestSeller[];
}

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

export interface ReportsSummary {
    metrics: {
        revenue: { value: number; change: number; isPositive: boolean };
        orders: { value: number; change: number; isPositive: boolean };
        avgOrderValue: { value: number; change: number; isPositive: boolean };
        activeTables: { value: number; change: number; isPositive: boolean };
    };
    revenueData: Array<{ day: string; amount: number }>;
    categorySales: Array<{ name: string; percentage: number; color: string }>;
    topItems: Array<{ rank: number; name: string; sold: number; revenue: number; trend: 'up' | 'down' }>;
}

export interface RestaurantTable {
    id: string;
    table_number: number;
    capacity: number;
    active: boolean;
    qr_code_url: string | null;
}

export interface ProfilePageData {
    restaurant: Restaurant | null;
    restaurantRow: RestaurantRow | null;
    profileRow: ProfileRow | null;
    membershipRow: RestaurantUserRow | null;
}

const categoryPalette = ['#4299E1', '#48BB78', '#ED8936', '#E53E3E', '#805AD5', '#D69E2E'];
const activeStatuses = new Set(['pending', 'confirmed', 'preparing', 'ready']);
const completedStatuses = new Set(['served', 'completed']);

const normalizeStatus = (value: string | null | undefined) => (value ?? '').toLowerCase();
const formatStatusLabel = (value: string | null | undefined) => {
    const status = normalizeStatus(value);
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
};

const getStatusColor = (value: string | null | undefined) => {
    const status = normalizeStatus(value);
    if (status === 'preparing') return 'preparing';
    if (status === 'ready') return 'ready';
    if (status === 'served' || status === 'completed') return 'served';
    if (status === 'cancelled') return 'cancelled';
    return 'pending';
};

const formatTableLabel = (tableNumber: number | null | undefined) => (
    tableNumber ? `Table ${tableNumber}` : 'N/A'
);

const formatRelativeTime = (createdAt: string) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
    if (diffMinutes < 60) return `${diffMinutes} mins ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hrs ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
};

const formatOrderDateTime = (createdAt: string) => (
    new Date(createdAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
);

const calculatePercentChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
};

const mapRestaurantRow = (row: RestaurantRow): Restaurant => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status as Restaurant['status'],
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
    settings: row.settings as Restaurant['settings'] | undefined,
    subscriptionStatus: row.subscription_status ?? false,
    subscriptionType: row.subscription_type,
    location: {
        latitude: row.latitude,
        longitude: row.longitude,
        allowedRadius: row.allowed_radius
    }
});

const mapMenuItemRow = (row: MenuItemRow): MenuItem => ({
    id: row.id,
    restaurantId: row.restaurant_id,
    categoryId: row.category_id ?? '',
    name: row.name,
    description: row.short_description,
    price: Number(row.price),
    discountPrice: row.discount_price,
    image: row.image_url,
    available: row.is_available,
    isVeg: row.is_veg,
    preparationTime: row.preparation_time,
    tags: row.tags,
    variants: (row.variants as MenuItem['variants']) ?? undefined,
    addons: (row.addons as MenuItem['addons']) ?? undefined
});

const mapCategoryRow = (row: MenuCategoryRow): MenuCategory => ({
    id: row.id,
    restaurantId: row.restaurant_id,
    name: row.name,
    description: row.description,
    image: row.image_url,
    order: row.sort_order,
    active: row.active
});

const mapDashboardSummaryOrder = (row: DashboardOrderQueryRow): DashboardSummaryOrder => {
    const items = Array.isArray(row.order_items) ? row.order_items : [];

    return {
        id: row.id,
        orderNumber: row.order_number,
        table: formatTableLabel(row.table_number),
        orderedTime: formatOrderDateTime(row.created_at),
        status: formatStatusLabel(row.status),
        statusColor: getStatusColor(row.status),
        customer: row.customer_name || 'Guest',
        items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: Number(item.price)
        })),
        total: Number(row.total) || 0,
        isPaid: normalizeStatus(row.payment_status) === 'paid',
        createdAt: row.created_at
    };
};

const fetchRestaurantOrders = async (restaurantId: string) => {
    const { data: ordersData, error: ordersError } = await db
        .from('orders')
        .select('id, order_number, created_at, status, payment_method, payment_status, total, customer_id, table_id')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    const orders = (ordersData ?? []) as OrderBaseRow[];
    if (orders.length === 0) {
        return [] as DashboardOrderQueryRow[];
    }

    const orderIds = orders.map(order => order.id);
    const tableIds = Array.from(new Set(orders.map(order => order.table_id).filter(Boolean))) as string[];
    const customerIds = Array.from(new Set(orders.map(order => order.customer_id).filter(Boolean))) as string[];

    const [itemsResult, tablesResult, customersResult] = await Promise.all([
        db.from('order_items').select('order_id, name, quantity, price, total').in('order_id', orderIds),
        tableIds.length > 0
            ? db.from('restaurant_tables').select('id, table_number').in('id', tableIds)
            : Promise.resolve({ data: [], error: null }),
        customerIds.length > 0
            ? db.from('profiles').select('id, name').in('id', customerIds)
            : Promise.resolve({ data: [], error: null }),
    ]);

    if (itemsResult.error) throw itemsResult.error;
    if (tablesResult.error) throw tablesResult.error;
    if (customersResult.error) throw customersResult.error;

    const itemsByOrderId = new Map<string, OrderItemRow[]>();
    ((itemsResult.data ?? []) as OrderItemRow[]).forEach(item => {
        const existing = itemsByOrderId.get(item.order_id) ?? [];
        existing.push(item);
        itemsByOrderId.set(item.order_id, existing);
    });

    const tableById = new Map<string, number | null>(
        ((tablesResult.data ?? []) as Array<{ id: string; table_number: number | null }>).map(row => [row.id, row.table_number])
    );

    const customerById = new Map<string, string | null>(
        ((customersResult.data ?? []) as Array<{ id: string; name: string | null }>).map(row => [row.id, row.name])
    );

    return orders.map(order => ({
        id: order.id,
        order_number: order.order_number,
        created_at: order.created_at,
        status: order.status,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        total: order.total,
        customer_name: order.customer_id ? (customerById.get(order.customer_id) ?? null) : null,
        table_number: order.table_id ? (tableById.get(order.table_id) ?? null) : null,
        order_items: itemsByOrderId.get(order.id) ?? []
    }));
};

const fetchCategoryLookup = async (restaurantId: string) => {
    const { data, error } = await db
        .from('menu_categories')
        .select('id, name')
        .eq('restaurant_id', restaurantId);

    if (error) throw error;

    return new Map<string, string>((data ?? []).map((row: { id: string; name: string }) => [row.id, row.name]));
};

const fetchMenuItemCategoryLookup = async (restaurantId: string) => {
    const { data, error } = await db
        .from('menu_items')
        .select('id, name, category_id')
        .eq('restaurant_id', restaurantId);

    if (error) throw error;

    return (data ?? []) as Array<{ id: string; name: string; category_id: string | null }>;
};

const sumPaidRevenue = (orders: DashboardSummaryOrder[], from: Date, to?: Date) => (
    orders.reduce((sum, order) => {
        if (!order.isPaid) return sum;
        const orderDate = new Date(order.createdAt);
        if (orderDate < from) return sum;
        if (to && orderDate >= to) return sum;
        return sum + order.total;
    }, 0)
);

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

export const getProfilePageData = async (restaurantId: string, userId: string): Promise<ProfilePageData> => {
    const [restaurantResult, profileResult, membershipResult] = await Promise.all([
        db.from('restaurants').select('*').eq('id', restaurantId).maybeSingle(),
        db.from('profiles').select('*').eq('id', userId).maybeSingle(),
        db
            .from('restaurant_users')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('profile_id', userId)
            .maybeSingle()
    ]);

    if (restaurantResult.error) throw restaurantResult.error;
    if (profileResult.error) throw profileResult.error;
    if (membershipResult.error) throw membershipResult.error;

    const restaurantRow = (restaurantResult.data as RestaurantRow | null) ?? null;
    const profileRow = (profileResult.data as ProfileRow | null) ?? null;
    const membershipRow = (membershipResult.data as RestaurantUserRow | null) ?? null;

    return {
        restaurant: restaurantRow ? mapRestaurantRow(restaurantRow) : null,
        restaurantRow,
        profileRow,
        membershipRow
    };
};

export const updateRestaurantProfile = async (
    restaurantId: string,
    payload: {
        name: string;
        contact_email: string;
        contact_phone?: string;
        contact_address?: string;
        logo_url?: string;
        primary_color?: string;
        secondary_color?: string;
    }
): Promise<Restaurant> => {
    const updatePayload = {
        name: payload.name,
        contact_email: payload.contact_email,
        contact_phone: payload.contact_phone || null,
        contact_address: payload.contact_address || null,
        logo_url: payload.logo_url || null,
        primary_color: payload.primary_color || null,
        secondary_color: payload.secondary_color || null
    };

    const { data, error } = await db
        .from('restaurants')
        .update(updatePayload)
        .eq('id', restaurantId)
        .select('*')
        .single();

    if (error) throw error;
    return mapRestaurantRow(data as RestaurantRow);
};

export const updateOwnProfile = async (
    userId: string,
    payload: { name: string; email: string; avatar_url?: string }
): Promise<void> => {
    const { error } = await db
        .from('profiles')
        .update({
            name: payload.name,
            email: payload.email,
            avatar_url: payload.avatar_url || null
        })
        .eq('id', userId);

    if (error) throw error;
};

export const getOwnProfile = async (userId: string): Promise<ProfileRow | null> => {
    const { data, error } = await db
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) throw error;
    return (data as ProfileRow | null) ?? null;
};

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
        .insert({
            restaurant_id: restaurantId,
            category_id: item.category_id,
            name: item.name,
            short_description: item.description,
            price: item.price,
            image_url: item.image_url ?? null,
            is_available: item.is_available ?? true,
            is_veg: item.is_veg ?? true
        })
        .select('*')
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
        .update({
            ...item,
            short_description: item.description
        })
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
            description: category.description ?? null,
            sort_order: category.sort_order ?? 0,
            active: category.active ?? true
        })
        .select('*')
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

export const getOrders = async (restaurantId: string, limitCount = 50): Promise<Order[]> => {
    const rows = await fetchRestaurantOrders(restaurantId);

    return rows.slice(0, limitCount).map(row => {
        const items = Array.isArray(row.order_items) ? row.order_items : [];

        return {
            id: row.id,
            restaurantId,
            orderNumber: row.order_number,
            type: 'dine_in' as Order['type'],
            customerId: undefined,
            customerName: row.customer_name ?? undefined,
            tableNumber: row.table_number ?? undefined,
            items: items.map(item => ({
                itemId: '',
                name: item.name,
                price: Number(item.price),
                quantity: item.quantity,
                total: Number(item.total)
            })),
            subtotal: Number(row.total),
            taxes: 0,
            discount: 0,
            total: Number(row.total),
            status: row.status as OrderStatus,
            payment: {
                method: (row.payment_method ?? 'cash') as Order['payment']['method'],
                status: (row.payment_status ?? 'pending') as Order['payment']['status']
            },
            createdAt: row.created_at,
            updatedAt: row.created_at
        };
    });
};

export const getDashboardOrders = async (restaurantId: string): Promise<DashboardOrder[]> => {
    const rows = await fetchRestaurantOrders(restaurantId);

    return rows.map(row => {
        const itemsList = Array.isArray(row.order_items) ? row.order_items : [];

        return {
            id: row.id,
            orderNumber: row.order_number || 'UNKNOWN',
            table: formatTableLabel(row.table_number),
            time: new Date(row.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            status: formatStatusLabel(row.status),
            statusColor: getStatusColor(row.status),
            paymentMethod: formatStatusLabel(row.payment_method),
            items: itemsList.map(item => `${item.name} x${item.quantity}`).join(', '),
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

export const getDashboardSummary = async (restaurantId: string): Promise<DashboardSummary> => {
    const rows = await fetchRestaurantOrders(restaurantId);
    const orders = rows.map(mapDashboardSummaryOrder);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfLastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 7);

    const revenueToday = sumPaidRevenue(orders, startOfToday);
    const revenueYesterday = sumPaidRevenue(orders, startOfYesterday, startOfToday);
    const revenueWeek = sumPaidRevenue(orders, startOfWeek);
    const revenueLastWeek = sumPaidRevenue(orders, startOfLastWeek, startOfWeek);

    const bestSellingMap = new Map<string, { sold: number; revenue: number }>();
    orders.forEach(order => {
        order.items.forEach(item => {
            const existing = bestSellingMap.get(item.name) ?? { sold: 0, revenue: 0 };
            existing.sold += item.quantity;
            existing.revenue += item.quantity * item.price;
            bestSellingMap.set(item.name, existing);
        });
    });

    const bestSelling = Array.from(bestSellingMap.entries())
        .map(([name, value], index) => ({
            name,
            sold: value.sold,
            revenue: value.revenue,
            trend: index % 2 === 0 ? '+12%' : '+6%'
        }))
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);

    return {
        revenueToday,
        revenueTodayChange: calculatePercentChange(revenueToday, revenueYesterday),
        revenueWeek,
        revenueWeekChange: calculatePercentChange(revenueWeek, revenueLastWeek),
        activeOrders: orders.filter(order => activeStatuses.has(normalizeStatus(order.status))),
        completedOrders: orders.filter(order => completedStatuses.has(normalizeStatus(order.status))),
        pendingPayments: orders
            .filter(order => !order.isPaid)
            .slice(0, 5)
            .map(order => ({
                id: order.id,
                table: order.table,
                customer: order.customer,
                amount: order.total,
                time: formatRelativeTime(order.createdAt)
            })),
        bestSelling
    };
};

export const getPaymentTransactions = async (restaurantId: string): Promise<PaymentTransaction[]> => {
    const rows = await fetchRestaurantOrders(restaurantId);

    return rows.map(row => {
        return {
            id: row.id,
            orderNumber: row.order_number || 'UNKNOWN',
            customerName: row.customer_name || 'Guest',
            tableNo: formatTableLabel(row.table_number),
            dateTime: formatOrderDateTime(row.created_at),
            paymentMethod: formatStatusLabel(row.payment_method),
            paymentStatus: formatStatusLabel(row.payment_status),
            statusColor: normalizeStatus(row.payment_status) || 'pending',
            amount: Number(row.total) || 0,
            orderItems: (row.order_items ?? []).map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: Number(item.price)
            })),
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

export const getReportsSummary = async (restaurantId: string, timeframe: 'today' | 'week' | 'month'): Promise<ReportsSummary> => {
    const [rows, categoryLookup, menuLookup, tables] = await Promise.all([
        fetchRestaurantOrders(restaurantId),
        fetchCategoryLookup(restaurantId),
        fetchMenuItemCategoryLookup(restaurantId),
        getRestaurantTables(restaurantId)
    ]);

    const orders = rows.map(mapDashboardSummaryOrder);
    const now = new Date();
    const rangeStart = timeframe === 'today'
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
        : timeframe === 'week'
            ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
            : new Date(now.getFullYear(), now.getMonth(), 1);

    const previousRangeStart = timeframe === 'today'
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        : timeframe === 'week'
            ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 7)
            : new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const previousRangeEnd = rangeStart;

    const currentOrders = orders.filter(order => new Date(order.createdAt) >= rangeStart);
    const previousOrders = orders.filter(order => {
        const createdAt = new Date(order.createdAt);
        return createdAt >= previousRangeStart && createdAt < previousRangeEnd;
    });

    const currentRevenue = currentOrders.filter(order => order.isPaid).reduce((sum, order) => sum + order.total, 0);
    const previousRevenue = previousOrders.filter(order => order.isPaid).reduce((sum, order) => sum + order.total, 0);
    const currentAvgOrderValue = currentOrders.length ? Math.round(currentRevenue / currentOrders.length) : 0;
    const previousAvgOrderValue = previousOrders.length
        ? Math.round(previousRevenue / previousOrders.length)
        : 0;

    const activeTableCount = new Set(
        currentOrders
            .map(order => order.table)
            .filter(table => table !== 'N/A')
    ).size;

    const previousActiveTableCount = new Set(
        previousOrders
            .map(order => order.table)
            .filter(table => table !== 'N/A')
    ).size;

    const menuLookupMap = new Map(menuLookup.map(item => [item.name, item.category_id]));
    const itemSales = new Map<string, { sold: number; revenue: number }>();
    const categorySales = new Map<string, number>();

    currentOrders.forEach(order => {
        order.items.forEach(item => {
            const existing = itemSales.get(item.name) ?? { sold: 0, revenue: 0 };
            existing.sold += item.quantity;
            existing.revenue += item.quantity * item.price;
            itemSales.set(item.name, existing);

            const categoryId = menuLookupMap.get(item.name);
            const categoryName = categoryId ? categoryLookup.get(categoryId) ?? 'Uncategorized' : 'Uncategorized';
            categorySales.set(categoryName, (categorySales.get(categoryName) ?? 0) + (item.quantity * item.price));
        });
    });

    const revenueBuckets = new Map<string, number>();
    const revenueLabels = timeframe === 'today'
        ? Array.from({ length: 24 }, (_, hour) => `${hour.toString().padStart(2, '0')}:00`)
        : timeframe === 'week'
            ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            : Array.from({ length: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() }, (_, day) => `${day + 1}`);

    revenueLabels.forEach(label => revenueBuckets.set(label, 0));

    currentOrders.filter(order => order.isPaid).forEach(order => {
        const createdAt = new Date(order.createdAt);
        const label = timeframe === 'today'
            ? `${createdAt.getHours().toString().padStart(2, '0')}:00`
            : timeframe === 'week'
                ? createdAt.toLocaleDateString('en-US', { weekday: 'short' })
                : String(createdAt.getDate());
        revenueBuckets.set(label, (revenueBuckets.get(label) ?? 0) + order.total);
    });

    const totalCategoryRevenue = Array.from(categorySales.values()).reduce((sum, value) => sum + value, 0);

    return {
        metrics: {
            revenue: {
                value: currentRevenue,
                change: calculatePercentChange(currentRevenue, previousRevenue),
                isPositive: currentRevenue >= previousRevenue
            },
            orders: {
                value: currentOrders.length,
                change: calculatePercentChange(currentOrders.length, previousOrders.length),
                isPositive: currentOrders.length >= previousOrders.length
            },
            avgOrderValue: {
                value: currentAvgOrderValue,
                change: calculatePercentChange(currentAvgOrderValue, previousAvgOrderValue),
                isPositive: currentAvgOrderValue >= previousAvgOrderValue
            },
            activeTables: {
                value: activeTableCount || tables.filter(table => table.active).length,
                change: calculatePercentChange(activeTableCount, previousActiveTableCount),
                isPositive: activeTableCount >= previousActiveTableCount
            }
        },
        revenueData: Array.from(revenueBuckets.entries()).map(([day, amount]) => ({ day, amount })),
        categorySales: Array.from(categorySales.entries()).map(([name, value], index) => ({
            name,
            percentage: totalCategoryRevenue ? Math.round((value / totalCategoryRevenue) * 100) : 0,
            color: categoryPalette[index % categoryPalette.length]
        })),
        topItems: Array.from(itemSales.entries())
            .map(([name, value], index) => ({
                rank: index + 1,
                name,
                sold: value.sold,
                revenue: value.revenue,
                trend: (index % 3 === 0 ? 'down' : 'up') as 'up' | 'down'
            }))
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 5)
            .map((item, index) => ({ ...item, rank: index + 1 }))
    };
};

export const getRestaurantTables = async (restaurantId: string): Promise<RestaurantTable[]> => {
    if (USE_MOCKS) {
        // simple dummy set so the UI can render without a backend
        return [
            { id: 'mock-1', table_number: 1, capacity: 4, active: true, qr_code_url: null },
            { id: 'mock-2', table_number: 2, capacity: 6, active: false, qr_code_url: null }
        ];
    }

    const { data, error } = await db
        .from('restaurant_tables')
        .select('id, table_number, capacity, active, qr_code_url')
        .eq('restaurant_id', restaurantId)
        .order('table_number', { ascending: true });

    if (error) throw error;

    return ((data ?? []) as RestaurantTableRow[]).map(row => ({
        id: row.id,
        table_number: row.table_number,
        capacity: row.capacity ?? 4,
        active: row.active ?? true,
        qr_code_url: row.qr_code_url
    }));
};

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

    const row = data as RestaurantTableRow;
    return {
        id: row.id,
        table_number: row.table_number,
        capacity: row.capacity ?? 4,
        active: row.active ?? true,
        qr_code_url: row.qr_code_url
    };
};

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

export const deleteRestaurantTable = async (tableId: string): Promise<void> => {
    const { error } = await db
        .from('restaurant_tables')
        .delete()
        .eq('id', tableId);

    if (error) throw error;
};

export const toggleTableActiveStatus = async (tableId: string, active: boolean): Promise<void> => {
    const { error } = await db
        .from('restaurant_tables')
        .update({ active })
        .eq('id', tableId);

    if (error) throw error;
};
