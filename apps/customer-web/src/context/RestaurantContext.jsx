import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, matchPath, useNavigate } from 'react-router-dom';
import { getRestaurantById, getTableById, getTableByNumber, getRecommendedItems } from '../services/supabaseService';
import { supabase } from '@restaurant-saas/supabase';


const RestaurantContext = createContext(null);

const SESSION_KEY_RESTAURANT = 'tablekard_restaurant_id';
const SESSION_KEY_TABLE      = 'tablekard_table_id';

export function RestaurantProvider({ children }) {
    const location = useLocation();
    const navigate = useNavigate();

    // Parse IDs from URL path or query-string
    const match          = matchPath('/order/:restaurantId/:tableId', location.pathname);
    const searchParams   = new URLSearchParams(location.search);
    const urlRestaurantId = match?.params?.restaurantId || searchParams.get('restaurant_id') || null;
    const urlTableId      = match?.params?.tableId      || searchParams.get('table_id')      || null;

    // Priority: URL > sessionStorage > null
    const [restaurantId, setRestaurantId] = useState(
        () => urlRestaurantId || sessionStorage.getItem(SESSION_KEY_RESTAURANT) || null
    );
    const [tableId, setTableId] = useState(
        () => urlTableId || sessionStorage.getItem(SESSION_KEY_TABLE) || null
    );

    // Restaurant data fetched from DB
    const [restaurant, setRestaurant] = useState(null);
    const [restaurantLoading, setRestaurantLoading] = useState(false);

    // Table data fetched from DB
    const [table, setTable] = useState(null);
    const [tableLoading, setTableLoading] = useState(false);

    // ML Recommendations pre-loading
    const [recommendations, setRecommendations] = useState([]);
    const [recommendationsLoading, setRecommendationsLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    // Track Auth state for recommendations
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setCurrentUserId(session?.user?.id || null);
        });
        
        // Initial check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setCurrentUserId(session?.user?.id || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Persist new URL params to sessionStorage and clean URL
    useEffect(() => {
        let shouldCleanUrl = false;
        
        if (urlRestaurantId) {
            setRestaurantId(urlRestaurantId);
            sessionStorage.setItem(SESSION_KEY_RESTAURANT, urlRestaurantId);
            shouldCleanUrl = true;
        }
        if (urlTableId) {
            setTableId(urlTableId);
            sessionStorage.setItem(SESSION_KEY_TABLE, urlTableId);
            shouldCleanUrl = true;
        }

        if (shouldCleanUrl) {
            // If they came through the specific QR path, drop them on the clean Home page or Menu page.
            // Using '/' provides the best new welcome experience.
            navigate('/', { replace: true });
        }
    }, [urlRestaurantId, urlTableId, navigate]);

    // Fetch restaurant info whenever restaurantId changes
    useEffect(() => {
        if (!restaurantId) {
            setRestaurant(null);
            return;
        }
        let cancelled = false;
        setRestaurantLoading(true);
        getRestaurantById(restaurantId)
            .then(data => {
                if (!cancelled) setRestaurant(data);
            })
            .catch(err => {
                if (!cancelled) console.warn('[RestaurantContext] fetch error:', err.message);
            })
            .finally(() => {
                if (!cancelled) setRestaurantLoading(false);
            });
        return () => { cancelled = true; };
    }, [restaurantId]);

    // Fetch table info whenever tableId / restaurantId changes.
    // The QR code encodes the table NUMBER (1, 2, 3…), not the UUID.
    // Detect which one we have and use the right query.
    const isUUID = (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    useEffect(() => {
        if (!tableId) {
            setTable(null);
            return;
        }
        let cancelled = false;
        setTableLoading(true);

        const fetchPromise = isUUID(tableId)
            ? getTableById(tableId)                          // UUID → fetch by id
            : getTableByNumber(restaurantId, Number(tableId)); // number → fetch by table_number

        fetchPromise
            .then(data => {
                if (!cancelled) setTable(data);
            })
            .catch(err => {
                if (!cancelled) console.warn('[RestaurantContext] table fetch error:', err.message);
            })
            .finally(() => {
                if (!cancelled) setTableLoading(false);
            });
        return () => { cancelled = true; };
    }, [tableId, restaurantId]);

    // Pre-load ML Recommendations
    useEffect(() => {
        if (!restaurantId) return;

        setRecommendationsLoading(true);
        getRecommendedItems(currentUserId, restaurantId)
            .then(data => setRecommendations(data))
            .catch(err => console.error('[RestaurantContext] ML error:', err))
            .finally(() => setRecommendationsLoading(false));
    }, [restaurantId, currentUserId]);

    return (
        <RestaurantContext.Provider value={{
            restaurantId,
            tableId,
            restaurant,          // full row: { name, logo_url, phone, email, ... }
            restaurantLoading,
            table,               // full row: { table_number, qr_code_url, ... }
            tableLoading,
            tableNumber: table?.table_number || null,
            recommendations,
            recommendationsLoading
        }}>
            {children}
        </RestaurantContext.Provider>
    );
}

export function useRestaurant() {
    const ctx = useContext(RestaurantContext);
    if (!ctx) throw new Error('useRestaurant must be used within <RestaurantProvider>');
    return ctx;
}

export default RestaurantContext;
