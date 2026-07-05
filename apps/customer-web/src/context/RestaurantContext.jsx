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
    const [restaurantLoading, setRestaurantLoading] = useState(
        () => !!(urlRestaurantId || sessionStorage.getItem(SESSION_KEY_RESTAURANT))
    );

    // Table data fetched from DB
    const [table, setTable] = useState(null);
    const [tableLoading, setTableLoading] = useState(false);

    // ML Recommendations pre-loading
    const [recommendations, setRecommendations] = useState([]);
    const [recommendationsLoading, setRecommendationsLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    // Geofencing states
    // Start as 'checking' if we already have a restaurantId (from session/URL) so the guard
    // doesn't flash the ScanQR or inner pages before geofence resolves.
    const [geofenceStatus, setGeofenceStatus] = useState(
        () => (urlRestaurantId || sessionStorage.getItem(SESSION_KEY_RESTAURANT)) ? 'checking' : 'not_checked'
    ); // 'not_checked' | 'checking' | 'inside' | 'outside' | 'error' | 'disabled'
    const [distance, setDistance] = useState(null);
    const [userCoords, setUserCoords] = useState(null);

    const lat = restaurant?.latitude !== undefined && restaurant?.latitude !== null ? restaurant.latitude : restaurant?.location?.latitude;
    const lon = restaurant?.longitude !== undefined && restaurant?.longitude !== null ? restaurant.longitude : restaurant?.location?.longitude;
    const rad = restaurant?.allowed_radius !== undefined && restaurant?.allowed_radius !== null ? restaurant.allowed_radius : restaurant?.location?.allowedRadius;

    const allowedRadius = (rad !== undefined && rad !== null) ? Number(rad) : 150;

    // checkGeofence accepts an optional restaurantData argument so it can be called
    // immediately after fetch without relying on stale closure values of lat/lon/rad.
    const checkGeofence = (restaurantData) => {
        const r = restaurantData || restaurant;
        const rLat = r?.latitude !== undefined && r?.latitude !== null ? r.latitude : r?.location?.latitude;
        const rLon = r?.longitude !== undefined && r?.longitude !== null ? r.longitude : r?.location?.longitude;
        const rRad = r?.allowed_radius !== undefined && r?.allowed_radius !== null ? r.allowed_radius : r?.location?.allowedRadius;
        const rAllowedRadius = (rRad !== undefined && rRad !== null) ? Number(rRad) : 150;

        console.log('[Geofence] Checking location. Restaurant coords:', rLat, rLon, 'allowed radius:', rAllowedRadius);
        if (rLat === null || rLat === undefined || rLon === null || rLon === undefined) {
            console.log('[Geofence] Geofencing disabled: restaurant lat/lon not configured');
            setGeofenceStatus('disabled');
            return;
        }

        if (!navigator.geolocation) {
            setGeofenceStatus('error');
            console.warn('[RestaurantContext] Geolocation not supported by browser');
            return;
        }

        const attemptGeofence = (attempt = 1) => {
            setGeofenceStatus('checking');
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const uLat = position.coords.latitude;
                    const uLon = position.coords.longitude;
                    setUserCoords({ latitude: uLat, longitude: uLon });

                    const dist = getDistanceInMeters(uLat, uLon, Number(rLat), Number(rLon));
                    setDistance(dist);
                    const accuracy = position.coords.accuracy || 0;

                    console.log(`[Geofence] Attempt ${attempt} User coords:`, uLat, uLon, 'Distance:', dist, 'm', 'Accuracy:', accuracy, 'm');

                    if (dist <= rAllowedRadius) {
                        setGeofenceStatus('inside');
                    } else {
                        // If they are 'outside' but accuracy is poor, retry automatically up to 3 times
                        // because the phone's GPS is still finding satellites.
                        if (accuracy > rAllowedRadius && attempt < 3) {
                            console.log(`[Geofence] Poor accuracy. Retrying automatically in 2s...`);
                            setTimeout(() => attemptGeofence(attempt + 1), 2000);
                        } else {
                            setGeofenceStatus('outside');
                        }
                    }
                },
                (error) => {
                    console.error('[RestaurantContext] Geolocation error:', error);
                    setGeofenceStatus('error');
                },
                // Allow up to 30s cached position for faster first-load; high accuracy for precision
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
            );
        };
        attemptGeofence(1);
    };

    // Run automatically when restaurant data is loaded.
    // Pass `restaurant` directly to avoid stale-closure issues with lat/lon.
    useEffect(() => {
        if (restaurant) {
            const currentLat = restaurant?.latitude !== undefined && restaurant?.latitude !== null ? restaurant.latitude : restaurant?.location?.latitude;
            const currentLon = restaurant?.longitude !== undefined && restaurant?.longitude !== null ? restaurant.longitude : restaurant?.location?.longitude;
            console.log('[Geofence] Restaurant loaded, lat:', currentLat, 'lon:', currentLon);
            if (currentLat !== null && currentLat !== undefined && currentLon !== null && currentLon !== undefined) {
                checkGeofence(restaurant);
            } else {
                setGeofenceStatus('disabled');
            }
        }
    }, [restaurant]); // eslint-disable-line react-hooks/exhaustive-deps

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
            // If they came through the specific QR path, drop them on the clean Home page.
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
        if (!tableId || tableId === 'null' || tableId === 'undefined') {
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
