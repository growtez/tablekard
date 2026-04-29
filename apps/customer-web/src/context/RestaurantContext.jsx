import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';

const RestaurantContext = createContext(null);

const SESSION_KEY_RESTAURANT = 'tablekard_restaurant_id';
const SESSION_KEY_TABLE = 'tablekard_table_id';

export function RestaurantProvider({ children }) {
    const location = useLocation();

    // Check if current path matches the QR route pattern
    const match = matchPath('/order/:restaurantId/:tableId', location.pathname);
    
    // Also support query parameters as fallback (?restaurant_id=...&table_id=...)
    const searchParams = new URLSearchParams(location.search);
    const queryRestaurantId = searchParams.get('restaurant_id');
    const queryTableId = searchParams.get('table_id');

    const urlRestaurantId = match?.params?.restaurantId || queryRestaurantId || null;
    const urlTableId = match?.params?.tableId || queryTableId || null;

    // Priority: URL params > sessionStorage > null
    const [restaurantId, setRestaurantId] = useState(() => {
        return urlRestaurantId || sessionStorage.getItem(SESSION_KEY_RESTAURANT) || null;
    });

    const [tableId, setTableId] = useState(() => {
        return urlTableId || sessionStorage.getItem(SESSION_KEY_TABLE) || null;
    });

    // Whenever the URL contains new params, update state and persist to sessionStorage
    useEffect(() => {
        if (urlRestaurantId) {
            setRestaurantId(urlRestaurantId);
            sessionStorage.setItem(SESSION_KEY_RESTAURANT, urlRestaurantId);
        }
        if (urlTableId) {
            setTableId(urlTableId);
            sessionStorage.setItem(SESSION_KEY_TABLE, urlTableId);
        }
    }, [urlRestaurantId, urlTableId]);

    return (
        <RestaurantContext.Provider value={{ restaurantId, tableId }}>
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
