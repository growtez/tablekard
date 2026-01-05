import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Platform,
    PermissionsAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius } from '../theme';
import Button from '../components/Button';

const { width, height } = Dimensions.get('window');

// Try to import MapView safely
let MapView, Marker, Polyline, Geolocation;
let mapAvailable = false;

try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    Polyline = maps.Polyline;
    mapAvailable = true;
    console.log('[NavigationMapScreen] react-native-maps loaded successfully');
} catch (e) {
    console.log('[NavigationMapScreen] react-native-maps failed to load:', e.message);
}

try {
    Geolocation = require('react-native-geolocation-service').default;
    console.log('[NavigationMapScreen] Geolocation loaded successfully');
} catch (e) {
    console.log('[NavigationMapScreen] Geolocation failed to load:', e.message);
}

// Demo locations in Karimganj (Sribhumi), Assam
// Restaurant location - central Karimganj town
const DEMO_RESTAURANT = {
    name: 'Sribhumi Restaurant',
    address: 'Station Road, Karimganj, Assam 788710',
    coords: { latitude: 24.8648, longitude: 92.3538 },
};

// Customer location - nearby residential area
const DEMO_CUSTOMER = {
    name: 'Customer - Nilambazar',
    address: 'Nilambazar, Karimganj, Assam 788724',
    coords: { latitude: 24.8402, longitude: 92.3891 },
};

export default function NavigationMapScreen({ navigation, route }) {
    const { theme } = useTheme();
    const colors = theme.colors;
    const mapRef = useRef(null);

    console.log('[NavigationMapScreen] Component rendering');
    console.log('[NavigationMapScreen] mapAvailable:', mapAvailable);
    console.log('[NavigationMapScreen] route.params:', JSON.stringify(route?.params));

    const {
        destinationType = 'restaurant',
        destinationName,
        destinationAddress,
        destinationCoords,
    } = route?.params || {};

    const destination = destinationType === 'restaurant'
        ? {
            name: destinationName || DEMO_RESTAURANT.name,
            address: destinationAddress || DEMO_RESTAURANT.address,
            coords: destinationCoords || DEMO_RESTAURANT.coords,
        }
        : {
            name: destinationName || DEMO_CUSTOMER.name,
            address: destinationAddress || DEMO_CUSTOMER.address,
            coords: destinationCoords || DEMO_CUSTOMER.coords,
        };

    const [riderLocation, setRiderLocation] = useState(null);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [distance, setDistance] = useState('--');
    const [duration, setDuration] = useState('--');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const generateRoute = (start, end) => {
        const points = [];
        const steps = 20;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            points.push({
                latitude: start.latitude + (end.latitude - start.latitude) * t,
                longitude: start.longitude + (end.longitude - start.longitude) * t,
            });
        }
        return points;
    };

    const updateRouteAndStats = (riderLoc) => {
        if (!riderLoc) return;
        const routePoints = generateRoute(riderLoc, destination.coords);
        setRouteCoordinates(routePoints);
        const dist = calculateDistance(
            riderLoc.latitude, riderLoc.longitude,
            destination.coords.latitude, destination.coords.longitude
        );
        setDistance(`${dist.toFixed(1)} km`);
        const timeMinutes = Math.ceil((dist / 20) * 60);
        setDuration(`${timeMinutes} min`);
    };

    useEffect(() => {
        console.log('[NavigationMapScreen] useEffect starting');

        // Use fallback location immediately
        const fallbackLocation = {
            latitude: 26.1600,
            longitude: 91.7700,
        };

        // Set fallback FIRST to ensure screen renders
        setRiderLocation(fallbackLocation);
        updateRouteAndStats(fallbackLocation);
        setLoading(false);
        console.log('[NavigationMapScreen] Fallback set, loading done');

        // Try to get real location in background (delayed)
        const timer = setTimeout(async () => {
            try {
                console.log('[NavigationMapScreen] Attempting real location');

                if (!Geolocation) {
                    console.log('[NavigationMapScreen] Geolocation not available');
                    return;
                }

                if (Platform.OS === 'android') {
                    console.log('[NavigationMapScreen] Requesting permission');
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                        {
                            title: 'Location',
                            message: 'App needs location access',
                            buttonPositive: 'OK',
                        }
                    );
                    console.log('[NavigationMapScreen] Permission:', granted);
                    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                        return;
                    }
                }

                console.log('[NavigationMapScreen] Getting position');
                Geolocation.getCurrentPosition(
                    (position) => {
                        console.log('[NavigationMapScreen] Got:', position.coords.latitude);
                        setRiderLocation({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        });
                    },
                    (err) => {
                        console.log('[NavigationMapScreen] Geo error:', err.code);
                    },
                    { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
                );
            } catch (e) {
                console.log('[NavigationMapScreen] Timer error:', e.message);
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    const recenterMap = () => {
        if (mapRef.current && riderLocation) {
            mapRef.current.animateToRegion({
                latitude: riderLocation.latitude,
                longitude: riderLocation.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            }, 500);
        }
    };

    const handleArrived = () => {
        navigation.goBack();
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        map: {
            flex: 1,
        },
        header: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.xl + spacing.lg,
            paddingBottom: spacing.md,
        },
        backButton: {
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 4,
        },
        myLocationButton: {
            position: 'absolute',
            right: spacing.lg,
            bottom: 300,
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 5,
            zIndex: 10,
        },
        bottomCard: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: spacing.xl,
            paddingBottom: spacing.xxl,
            elevation: 10,
        },
        destinationRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: spacing.lg,
        },
        destinationIcon: {
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: destinationType === 'restaurant' ? colors.warning + '20' : colors.success + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
        },
        destinationInfo: {
            flex: 1,
        },
        destinationLabel: {
            fontSize: 12,
            fontWeight: '600',
            color: colors.textMuted,
            textTransform: 'uppercase',
            marginBottom: spacing.xs,
        },
        destinationName: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
            marginBottom: spacing.xs,
        },
        destinationAddress: {
            fontSize: 14,
            color: colors.textSecondary,
        },
        statsRow: {
            flexDirection: 'row',
            marginBottom: spacing.lg,
            backgroundColor: colors.cardElevated,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
        },
        statItem: {
            flex: 1,
            alignItems: 'center',
        },
        statDivider: {
            width: 1,
            backgroundColor: colors.border,
        },
        statValue: {
            fontSize: 22,
            fontWeight: '700',
            color: colors.primary,
        },
        statLabel: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: spacing.xs,
        },
        loadingContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.background,
        },
        loadingText: {
            marginTop: spacing.md,
            fontSize: 16,
            color: colors.textSecondary,
        },
        errorText: {
            color: colors.error,
            fontSize: 14,
            marginTop: spacing.sm,
        },
        mapPlaceholder: {
            flex: 1,
            backgroundColor: colors.cardElevated,
            alignItems: 'center',
            justifyContent: 'center',
        },
        mapPlaceholderIcon: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.secondary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.lg,
        },
        mapPlaceholderText: {
            fontSize: 16,
            color: colors.textSecondary,
            textAlign: 'center',
            paddingHorizontal: spacing.xl,
        },
        riderMarker: {
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: colors.primary,
            borderWidth: 3,
            borderColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
        },
        destMarker: {
            alignItems: 'center',
        },
        destMarkerBubble: {
            backgroundColor: destinationType === 'restaurant' ? colors.warning : colors.success,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.sm,
            marginBottom: 4,
        },
        destMarkerText: {
            color: '#fff',
            fontSize: 11,
            fontWeight: '600',
        },
        destMarkerPin: {
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: destinationType === 'restaurant' ? colors.warning : colors.success,
            borderWidth: 2,
            borderColor: '#fff',
        },
    });

    // Show loading
    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Getting your location...</Text>
                    {error && <Text style={styles.errorText}>{error}</Text>}
                </View>
            </View>
        );
    }

    // Render map or fallback
    const renderMap = () => {
        if (!mapAvailable || !MapView) {
            console.log('[NavigationMapScreen] Rendering map placeholder');
            return (
                <View style={styles.mapPlaceholder}>
                    <View style={styles.mapPlaceholderIcon}>
                        <Icon name="map" size={36} color={colors.primary} />
                    </View>
                    <Text style={styles.mapPlaceholderText}>
                        Map not available.{'\n'}Navigate to: {destination.name}
                    </Text>
                </View>
            );
        }

        console.log('[NavigationMapScreen] Rendering MapView');
        return (
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                    latitude: riderLocation?.latitude || destination.coords.latitude,
                    longitude: riderLocation?.longitude || destination.coords.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                showsUserLocation={false}
                showsMyLocationButton={false}
            >
                {riderLocation && (
                    <Marker coordinate={riderLocation} anchor={{ x: 0.5, y: 0.5 }}>
                        <View style={styles.riderMarker}>
                            <Icon name="navigation" size={12} color="#fff" />
                        </View>
                    </Marker>
                )}
                <Marker coordinate={destination.coords} anchor={{ x: 0.5, y: 1 }}>
                    <View style={styles.destMarker}>
                        <View style={styles.destMarkerBubble}>
                            <Text style={styles.destMarkerText}>{destination.name}</Text>
                        </View>
                        <View style={styles.destMarkerPin} />
                    </View>
                </Marker>
                {routeCoordinates.length > 0 && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeColor={colors.primary}
                        strokeWidth={4}
                    />
                )}
            </MapView>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {renderMap()}

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={22} color={colors.iconActive} />
                </TouchableOpacity>
            </View>

            {/* My Location Button */}
            <TouchableOpacity style={styles.myLocationButton} onPress={recenterMap}>
                <Icon name="crosshair" size={24} color={colors.primary} />
            </TouchableOpacity>

            {/* Bottom Card */}
            <View style={styles.bottomCard}>
                <View style={styles.destinationRow}>
                    <View style={styles.destinationIcon}>
                        <Icon
                            name={destinationType === 'restaurant' ? 'home' : 'user'}
                            size={22}
                            color={destinationType === 'restaurant' ? colors.warning : colors.success}
                        />
                    </View>
                    <View style={styles.destinationInfo}>
                        <Text style={styles.destinationLabel}>
                            {destinationType === 'restaurant' ? 'Pickup From' : 'Deliver To'}
                        </Text>
                        <Text style={styles.destinationName}>{destination.name}</Text>
                        <Text style={styles.destinationAddress} numberOfLines={2}>{destination.address}</Text>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{distance}</Text>
                        <Text style={styles.statLabel}>Distance</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{duration}</Text>
                        <Text style={styles.statLabel}>Estimated Time</Text>
                    </View>
                </View>

                <Button
                    title={destinationType === 'restaurant' ? "I've Arrived" : "Arrived at Customer"}
                    onPress={handleArrived}
                    icon={<Icon name="check" size={20} color={colors.textOnPrimary} />}
                />
            </View>
        </View>
    );
}
