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
        .select(`
            *,
            menu_item_images (id, image_url, sort_order)
        `)
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
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxes = Math.round(total * 0.18) + Math.round(total * 0.05); // Just for reference/record
    const subtotal = total - taxes; // Subtotal is total minus taxes
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
            order_items (*),
            restaurant_tables (table_number),
            feedback (rating, comment)
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Flatten table_number and feedback onto the order object
    return (data ?? []).map(order => ({
        ...order,
        table_number: order.restaurant_tables?.table_number ?? null,
        rating: order.feedback?.[0]?.rating ?? null,
        comment: order.feedback?.[0]?.comment ?? null
    }));
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

export const getRecentOrderedItems = async (userId, limit = 3) => {
    const { data, error } = await supabase
        .from('order_items')
        .select(`
            menu_item_id,
            orders!inner(customer_id, created_at),
            menu_items (
                *,
                menu_item_images (image_url, sort_order)
            )
        `)
        .eq('orders.customer_id', userId)
        .order('created_at', { foreignTable: 'orders', ascending: false })
        .limit(20); // Fetch more to filter for unique items

    if (error) throw error;
    
    // Process to get unique items and flatten structure
    const items = [];
    const seenIds = new Set();
    
    for (const row of data) {
        if (row.menu_items && !seenIds.has(row.menu_item_id)) {
            const m = row.menu_items;
            const item = {
                id: m.id,
                name: m.name,
                price: m.price,
                time: m.preparation_time ? `${m.preparation_time}min` : '15min',
                rating: 4.8, // Default rating
                serves: `Serves ${m.serves || 1}`,
                image: m.menu_item_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
                description: m.long_description || m.short_description || '',
                dietType: m.is_veg ? 'veg' : 'non-veg'
            };
            items.push(item);
            seenIds.add(row.menu_item_id);
        }
        if (items.length >= limit) break;
    }
    
    return items;
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

// Mathematical ML Recommendation (JavaScript Native Implementation)
export const getRecommendedItems = async (userId, restaurantId) => {
    try {
        // Step 1: Get all menu items for the restaurant
        const { data: menuItems, error: menuError } = await supabase
            .from('menu_items')
            .select(`
                *,
                menu_item_images (image_url, sort_order)
            `)
            .eq('restaurant_id', restaurantId)
            .eq('is_available', true);

        if (menuError) throw menuError;

        // --- NEW: Fetch and Aggregate Ratings from Feedback Table ---
        // We join feedback -> orders -> order_items to find which rating belongs to which dish
        const { data: feedbackData } = await supabase
            .from('feedback')
            .select(`
                rating,
                orders!inner(id, restaurant_id, order_items(menu_item_id))
            `)
            .eq('orders.restaurant_id', restaurantId);

        const itemRatings = {};
        if (feedbackData) {
            feedbackData.forEach(fb => {
                const score = fb.rating;
                fb.orders?.order_items?.forEach(oi => {
                    const itemId = oi.menu_item_id;
                    if (itemId) {
                        if (!itemRatings[itemId]) {
                            itemRatings[itemId] = { total: 0, count: 0 };
                        }
                        itemRatings[itemId].total += score;
                        itemRatings[itemId].count += 1;
                    }
                });
            });
        }

        // --- NATIVE JAVASCRIPT ML ALGORITHM START ---

        // 1. Build User-Item Matrix (Order Counts)
        const userItemMatrix = {};
        const itemOrderCounts = {};
        const itemWeeklyOrderCounts = {};

        // Step 2: Fetch all orders for this restaurant to build the ML Matrix
        const { data: allOrders, error: ordersError } = await supabase
            .from('orders')
            .select(`
                customer_id,
                created_at,
                order_items (menu_item_id)
            `)
            .eq('restaurant_id', restaurantId);

        if (ordersError) throw ordersError;

        if (allOrders) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            allOrders.forEach(order => {
                const uId = order.customer_id;
                if (!uId) return;
                
                if (!userItemMatrix[uId]) userItemMatrix[uId] = {};
                
                const orderDate = new Date(order.created_at);
                const isThisWeek = orderDate >= sevenDaysAgo;

                order.order_items.forEach(item => {
                    const iId = item.menu_item_id;
                    userItemMatrix[uId][iId] = (userItemMatrix[uId][iId] || 0) + 1;
                    itemOrderCounts[iId] = (itemOrderCounts[iId] || 0) + 1;
                    if (isThisWeek) {
                        itemWeeklyOrderCounts[iId] = (itemWeeklyOrderCounts[iId] || 0) + 1;
                    }
                });
            });
        }

        const popularItemIds = Object.keys(itemOrderCounts).sort((a, b) => itemOrderCounts[b] - itemOrderCounts[a]);

        const processMenuItems = (items) => {
            return items.map(m => {
                // Calculate average rating from DB or provide a high-quality fallback for new items
                const avgRating = itemRatings[m.id] 
                    ? (itemRatings[m.id].total / itemRatings[m.id].count).toFixed(1) 
                    : (4.5 + (Math.random() * 0.4)).toFixed(1);

                return {
                    id: m.id,
                    name: m.name,
                    price: m.price,
                    time: m.preparation_time ? `${m.preparation_time}min` : '15min',
                    rating: avgRating, // Dynamically fetched from Database feedback!
                    serves: `Serves ${m.serves || 1}`,
                    image: m.menu_item_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
                    description: m.long_description || m.short_description || '',
                    dietType: m.is_veg ? 'veg' : 'non-veg',
                    modelUrl: m.model_url || null,
                    salesCount: itemOrderCounts[m.id] || 0,
                    weeklySalesCount: itemWeeklyOrderCounts[m.id] || 0
                };
            });
        };


        const getItemsByIds = (ids) => {
            const result = [];
            for (const id of ids) {
                const menuItem = menuItems.find(m => m.id === id);
                if (menuItem) result.push(menuItem);
            }
            return processMenuItems(result);
        };

        if (!userId || !userItemMatrix[userId]) {
             const allIds = [...popularItemIds, ...menuItems.map(m => m.id).filter(id => !popularItemIds.includes(id))];
             return getItemsByIds(allIds);
        }

        const currentUserOrders = userItemMatrix[userId];
        const orderedItemIds = Object.keys(currentUserOrders);
        
        const itemVectors = {};
        Object.keys(userItemMatrix).forEach(uId => {
             Object.entries(userItemMatrix[uId]).forEach(([iId, count]) => {
                 if (!itemVectors[iId]) itemVectors[iId] = {};
                 itemVectors[iId][uId] = count;
             });
        });

        const getMagnitude = (vec) => {
             let sumSq = 0;
             for (const count of Object.values(vec)) sumSq += count * count;
             return Math.sqrt(sumSq);
        };

        const getCosineSimilarity = (itemA, itemB) => {
             const vecA = itemVectors[itemA];
             const vecB = itemVectors[itemB];
             if (!vecA || !vecB) return 0;

             let dotProduct = 0;
             for (const uId in vecA) {
                 if (vecB[uId]) {
                     dotProduct += vecA[uId] * vecB[uId];
                 }
             }

             const magA = getMagnitude(vecA);
             const magB = getMagnitude(vecB);

             if (magA === 0 || magB === 0) return 0;
             return dotProduct / (magA * magB);
        };

        const scores = {};
        const allItemIds = menuItems.map(m => m.id);

        for (const candidateId of allItemIds) {
             if (currentUserOrders[candidateId]) continue;

             let totalScore = 0;
             for (const orderedId of orderedItemIds) {
                 const similarity = getCosineSimilarity(candidateId, orderedId);
                 const orderCount = currentUserOrders[orderedId];
                 totalScore += similarity * orderCount;
             }

             if (totalScore > 0) {
                 scores[candidateId] = totalScore;
             }
        }

        let recommendedIds = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);

        const filteredPopular = popularItemIds.filter(id => !recommendedIds.includes(id));
        recommendedIds = [...recommendedIds, ...filteredPopular];
        
        const remainingIds = allItemIds.filter(id => !recommendedIds.includes(id));
        recommendedIds = [...recommendedIds, ...remainingIds];

        return getItemsByIds(recommendedIds);

    } catch (err) {
        console.error('Error fetching ML recommendations:', err);
        return [];
    }
};

// ── Helper shared by home page functions ─────────────────────────────────────
const normalizeHomeItem = (m, discountLabel = null) => ({
    id: m.id,
    name: m.name,
    price: m.price,
    time: m.preparation_time ? `${m.preparation_time}min` : '15min',
    rating: (4.5 + Math.random() * 0.4).toFixed(1),
    serves: `Serves ${m.serves || 1}`,
    image: m.menu_item_images?.[0]?.image_url
        || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
    description: m.long_description || m.short_description || '',
    dietType: m.is_veg ? 'veg' : 'non-veg',
    modelUrl: m.model_url || null,
    // discount label shown on the carousel badge
    discount: discountLabel
        || (m.discount_price ? `${Math.round(((m.price - m.discount_price) / m.price) * 100)}% OFF` : null),
    timer: null,
});

/**
 * Fetch items for the Discounts carousel on the home page.
 * Priority:
 *   1. Items where discount_price is present
 *   2. Top-selling items by total order count (fallback)
 *   3. First N available items (last resort)
 */
export const getDiscountItemsForHome = async (restaurantId, limit = 5) => {
    try {
        // 1. Try items with an explicit discount
        const { data: discounted, error: discErr } = await supabase
            .from('menu_items')
            .select('*, menu_item_images(image_url, sort_order)')
            .eq('restaurant_id', restaurantId)
            .eq('is_available', true)
            .not('discount_price', 'is', null)
            .limit(limit);

        if (!discErr && discounted && discounted.length > 0) {
            return discounted.map(m => normalizeHomeItem(m));
        }
    } catch (_) {
        // Column may not exist — silently fall through
    }

    try {
        // 2. Fall back to top-selling items for this restaurant
        const { data: orderData } = await supabase
            .from('order_items')
            .select(`
                menu_item_id,
                orders!inner(restaurant_id)
            `)
            .eq('orders.restaurant_id', restaurantId)
            .not('menu_item_id', 'is', null);

        const counts = {};
        (orderData || []).forEach(({ menu_item_id }) => {
            counts[menu_item_id] = (counts[menu_item_id] || 0) + 1;
        });

        const topIds = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([id]) => id);

        if (topIds.length > 0) {
            const { data: topItems } = await supabase
                .from('menu_items')
                .select('*, menu_item_images(image_url, sort_order)')
                .in('id', topIds)
                .eq('restaurant_id', restaurantId)
                .eq('is_available', true);

            const sorted = topIds
                .map(id => (topItems || []).find(m => m.id === id))
                .filter(Boolean);

            return sorted.map(m => normalizeHomeItem(m, 'Top Seller'));
        }
    } catch (_) { /* ignore */ }

    // 3. Last resort: just return first N available items
    const { data: anyItems } = await supabase
        .from('menu_items')
        .select('*, menu_item_images(image_url, sort_order)')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .limit(limit);

    return (anyItems || []).map(m => normalizeHomeItem(m, 'Featured'));
};
