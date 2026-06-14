import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, matchPath, useNavigate } from 'react-router-dom';
import { getRestaurantById, getTableById, getTableByNumber, getRecommendedItems } from '../services/supabaseService';
import { supabase } from '@restaurant-saas/supabase';


const RestaurantContext = createContext(null);

const SESSION_KEY_RESTAURANT = 'tablekard_restaurant_id';
const SESSION_KEY_TABLE      = 'tablekard_table_id';

// Helper function for distance calculation using Haversine formula
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const phi1 = lat1 * Math.PI/180;
    const phi2 = lat2 * Math.PI/180;
    const deltaPhi = (lat2-lat1) * Math.PI/180;
    const deltaLambda = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

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

    // Geofencing states
    const [geofenceStatus, setGeofenceStatus] = useState('not_checked'); // 'not_checked' | 'checking' | 'inside' | 'outside' | 'error' | 'disabled'
    const [distance, setDistance] = useState(null);
    const [userCoords, setUserCoords] = useState(null);

    const lat = restaurant?.latitude !== undefined && restaurant?.latitude !== null ? restaurant.latitude : restaurant?.location?.latitude;
    const lon = restaurant?.longitude !== undefined && restaurant?.longitude !== null ? restaurant.longitude : restaurant?.location?.longitude;
    const rad = restaurant?.allowed_radius !== undefined && restaurant?.allowed_radius !== null ? restaurant.allowed_radius : restaurant?.location?.allowedRadius;

    const allowedRadius = rad ? Number(rad) : 150;

    const checkGeofence = () => {
        console.log('[Geofence] Checking location. Restaurant coords:', lat, lon, 'allowed radius:', allowedRadius);
        if (lat === null || lat === undefined || lon === null || lon === undefined) {
            console.log('[Geofence] Geofencing disabled: restaurant lat/lon not configured');
            setGeofenceStatus('disabled');
            return;
        }

        if (!navigator.geolocation) {
            setGeofenceStatus('error');
            console.warn('[RestaurantContext] Geolocation not supported by browser');
            return;
        }

        setGeofenceStatus('checking');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const uLat = position.coords.latitude;
                const uLon = position.coords.longitude;
                setUserCoords({ latitude: uLat, longitude: uLon });

                const rLat = Number(lat);
                const rLon = Number(lon);
                const dist = getDistanceInMeters(uLat, uLon, rLat, rLon);
                setDistance(dist);

                console.log('[Geofence] User coords:', uLat, uLon, 'Distance to restaurant:', dist, 'm');

                if (dist <= allowedRadius) {
                    setGeofenceStatus('inside');
                } else {
                    setGeofenceStatus('outside');
                }
            },
            (error) => {
                console.error('[RestaurantContext] Geolocation error:', error);
                setGeofenceStatus('error');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    // Run automatically when restaurant data is loaded
    useEffect(() => {
        if (restaurant) {
            const currentLat = restaurant?.latitude !== undefined && restaurant?.latitude !== null ? restaurant.latitude : restaurant?.location?.latitude;
            const currentLon = restaurant?.longitude !== undefined && restaurant?.longitude !== null ? restaurant.longitude : restaurant?.location?.longitude;
            console.log('[Geofence] Restaurant loaded:', restaurant, 'lat:', currentLat, 'lon:', currentLon);
            if (currentLat !== null && currentLat !== undefined && currentLon !== null && currentLon !== undefined) {
                checkGeofence();
            } else {
                setGeofenceStatus('disabled');
            }
        }
    }, [restaurant]);

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
            recommendationsLoading,
            geofenceStatus,
            distance,
            userCoords,
            allowedRadius,
            checkGeofence
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
