import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    Animated,
    Linking,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import { spacing, shadows } from '../theme';

const { width, height } = Dimensions.get('window');

const OrderTrackingScreen = ({ route, navigation }) => {
    const { theme, isDark } = useTheme();
    const colors = theme.colors;
    const { selectedAddress, currentLocation } = useLocation();
    const { orderId = 'ORD-ABC123' } = route.params || {};
    const mapRef = useRef(null);

    // Animated pulse for delivery marker
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Restaurant location (fixed)
    const restaurantLocation = {
        latitude: 26.4776,
        longitude: 90.5599,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
    };

    // User's delivery location
    const deliveryLocation = {
        latitude: currentLocation?.latitude || 26.4826,
        longitude: currentLocation?.longitude || 90.5649,
    };

    // Simulated delivery partner location (would come from Firebase in production)
    const [deliveryPartnerLocation, setDeliveryPartnerLocation] = useState({
        latitude: 26.4801,
        longitude: 90.5624,
    });

    // Estimated time
    const [estimatedTime, setEstimatedTime] = useState(15);

    // Order tracking steps
    const steps = [
        { id: 1, label: 'Order Placed', time: '2:30 PM', completed: true, icon: 'check-circle' },
        { id: 2, label: 'Preparing', time: '2:35 PM', completed: true, icon: 'coffee' },
        { id: 3, label: 'Out for Delivery', time: '2:50 PM', completed: true, icon: 'truck' },
        { id: 4, label: 'Delivered', time: null, completed: false, icon: 'home' },
    ];

    // Pulse animation for delivery marker
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.3,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    // Simulate delivery partner movement (in production, this would be real-time from Firebase)
    useEffect(() => {
        const interval = setInterval(() => {
            setDeliveryPartnerLocation(prev => ({
                latitude: prev.latitude + (deliveryLocation.latitude - prev.latitude) * 0.05,
                longitude: prev.longitude + (deliveryLocation.longitude - prev.longitude) * 0.05,
            }));
            setEstimatedTime(prev => Math.max(1, prev - 1));
        }, 10000); // Update every 10 seconds

        return () => clearInterval(interval);
    }, []);

    // Route coordinates for polyline
    const routeCoordinates = [
        restaurantLocation,
        deliveryPartnerLocation,
        deliveryLocation,
    ];

    const handleCall = () => {
        Linking.openURL('tel:+911234567890');
    };

    const handleChat = () => {
        // Navigate to chat screen or open messaging
        navigation.navigate('Chat', { orderId });
    };

    const fitToMarkers = () => {
        if (mapRef.current) {
            mapRef.current.fitToCoordinates(routeCoordinates, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
            });
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.backBtn, { backgroundColor: colors.primaryLight }]}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={22} color={colors.primary} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Track Order</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>{orderId}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.refreshBtn, { backgroundColor: colors.primaryLight }]}
                    onPress={fitToMarkers}
                >
                    <Icon name="maximize" size={18} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Map Section */}
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
                    initialRegion={{
                        ...restaurantLocation,
                        latitudeDelta: 0.03,
                        longitudeDelta: 0.03,
                    }}
                    onLayout={fitToMarkers}
                >
                    {/* Restaurant Marker */}
                    <Marker coordinate={restaurantLocation} title="Restaurant" anchor={{ x: 0.5, y: 0.5 }}>
                        <View style={[styles.markerContainer, { backgroundColor: colors.primary }]}>
                            <Icon name="home" size={16} color="#FFFFFF" />
                        </View>
                    </Marker>

                    {/* Delivery Partner Marker */}
                    <Marker
                        coordinate={deliveryPartnerLocation}
                        title="Delivery Partner"
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View style={styles.deliveryMarkerWrapper}>
                            <Animated.View
                                style={[
                                    styles.deliveryMarkerPulse,
                                    {
                                        backgroundColor: colors.success + '30',
                                        transform: [{ scale: pulseAnim }]
                                    }
                                ]}
                            />
                            <View style={[styles.deliveryMarker, { backgroundColor: colors.success }]}>
                                <Icon name="truck" size={16} color="#FFFFFF" />
                            </View>
                        </View>
                    </Marker>

                    {/* User Location Marker */}
                    <Marker coordinate={deliveryLocation} title="Your Location" anchor={{ x: 0.5, y: 0.5 }}>
                        <View style={[styles.markerContainer, { backgroundColor: '#1A1A1A' }]}>
                            <Icon name="map-pin" size={16} color="#FFFFFF" />
                        </View>
                    </Marker>

                    {/* Route Polyline */}
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeColor={colors.primary}
                        strokeWidth={4}
                        lineDashPattern={[10, 5]}
                    />
                </MapView>

                {/* ETA Overlay */}
                <View style={[styles.etaOverlay, { backgroundColor: colors.card }, shadows.md]}>
                    <Icon name="clock" size={18} color={colors.primary} />
                    <Text style={[styles.etaText, { color: colors.text }]}>
                        {estimatedTime} min{estimatedTime !== 1 ? 's' : ''}
                    </Text>
                    <Text style={[styles.etaLabel, { color: colors.textMuted }]}>away</Text>
                </View>
            </View>

            {/* Bottom Sheet */}
            <View style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Driver Card */}
                    <View style={styles.driverCard}>
                        <View style={styles.driverInfo}>
                            <View style={[styles.driverAvatar, { backgroundColor: colors.primary }]}>
                                <Text style={styles.driverInitials}>RK</Text>
                            </View>
                            <View style={styles.driverDetails}>
                                <Text style={[styles.driverName, { color: colors.text }]}>Rahul Kumar</Text>
                                <View style={styles.vehicleRow}>
                                    <Icon name="navigation" size={12} color={colors.textMuted} />
                                    <Text style={[styles.vehicleText, { color: colors.textMuted }]}>
                                        Honda Activa • MH 01 AB 1234
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.driverActions}>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: colors.successLight }]}
                                onPress={handleCall}
                            >
                                <Icon name="phone" size={18} color={colors.success} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: colors.primaryLight }]}
                                onPress={handleChat}
                            >
                                <Icon name="message-circle" size={18} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Order Status Timeline */}
                    <View style={styles.timelineCard}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Status</Text>
                        {steps.map((step, index) => (
                            <View key={step.id} style={styles.timelineStep}>
                                <View style={styles.stepIndicator}>
                                    <View style={[
                                        styles.stepDot,
                                        step.completed
                                            ? { backgroundColor: colors.success, borderColor: colors.success }
                                            : { borderColor: colors.border, backgroundColor: colors.card }
                                    ]}>
                                        {step.completed && <Icon name="check" size={12} color="#FFFFFF" />}
                                    </View>
                                    {index < steps.length - 1 && (
                                        <View style={[
                                            styles.stepLine,
                                            { backgroundColor: step.completed ? colors.success : colors.border }
                                        ]} />
                                    )}
                                </View>
                                <View style={styles.stepContent}>
                                    <View style={styles.stepHeader}>
                                        <Text style={[
                                            styles.stepLabel,
                                            { color: step.completed ? colors.text : colors.textMuted }
                                        ]}>
                                            {step.label}
                                        </Text>
                                        {step.time && (
                                            <Text style={[styles.stepTime, { color: colors.textMuted }]}>
                                                {step.time}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Delivery Address */}
                    <View style={[styles.addressCard, { borderColor: colors.border }]}>
                        <View style={[styles.addressIcon, { backgroundColor: colors.primaryLight }]}>
                            <Icon name="map-pin" size={18} color={colors.primary} />
                        </View>
                        <View style={styles.addressInfo}>
                            <Text style={[styles.addressLabel, { color: colors.textMuted }]}>Delivering to</Text>
                            <Text style={[styles.addressText, { color: colors.text }]}>
                                {selectedAddress?.address || 'BOC Gate, Chapaguri Rd, Bongaigaon, Assam 783380'}
                            </Text>
                        </View>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerCenter: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700'
    },
    headerSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    refreshBtn: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },

    // Map
    mapContainer: {
        height: height * 0.35,
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    markerContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    deliveryMarkerWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    deliveryMarkerPulse: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    deliveryMarker: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    etaOverlay: {
        position: 'absolute',
        top: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    etaText: {
        fontSize: 18,
        fontWeight: '800',
    },
    etaLabel: {
        fontSize: 14,
    },

    // Bottom Sheet
    bottomSheet: {
        flex: 1,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        marginTop: -24,
        paddingHorizontal: 20,
        paddingTop: 24,
    },

    // Driver Card
    driverCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    driverAvatar: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    driverInitials: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    driverDetails: {
        gap: 4,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '700',
    },
    vehicleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    vehicleText: {
        fontSize: 12,
    },
    driverActions: {
        flexDirection: 'row',
        gap: 10,
    },
    actionBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Timeline
    timelineCard: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 20,
    },
    timelineStep: {
        flexDirection: 'row',
        minHeight: 48,
    },
    stepIndicator: {
        alignItems: 'center',
        marginRight: 16,
        width: 24,
    },
    stepDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepLine: {
        width: 2,
        flex: 1,
        marginVertical: 4,
    },
    stepContent: {
        flex: 1,
        paddingBottom: 16,
    },
    stepHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stepLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    stepTime: {
        fontSize: 12,
    },

    // Address Card
    addressCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1.5,
    },
    addressIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    addressInfo: {
        flex: 1,
    },
    addressLabel: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    addressText: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
    },
});

export default OrderTrackingScreen;
