import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    ScrollView,
    TouchableOpacity,
    Switch,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius } from '../theme';
import Button from '../components/Button';
import OrderCard from '../components/OrderCard';

export default function HomeScreen({ navigation }) {
    const { theme } = useTheme();
    const colors = theme.colors;

    const [isOnline, setIsOnline] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [pulseAnim] = useState(new Animated.Value(1));

    // Mock order for demo - Karimganj (Sribhumi), Assam
    const mockOrder = {
        orderNumber: 'ORD-001234',
        restaurantName: 'Sribhumi Restaurant',
        restaurantAddress: 'Station Road, Karimganj, Assam 788710',
        restaurantPhone: '+91 98765 43210',
        restaurantCoords: { latitude: 24.8648, longitude: 92.3538 },
        customerName: 'Rajesh Kumar',
        customerPhone: '+91 98765 43210',
        customerAddress: 'Nilambazar, Karimganj, Assam 788724',
        customerCoords: { latitude: 24.8402, longitude: 92.3891 },
        items: [
            { name: 'Chicken Biryani', quantity: 1, price: 250 },
            { name: 'Butter Naan', quantity: 4, price: 120 },
            { name: 'Raita', quantity: 1, price: 40 },
        ],
        itemCount: 3,
        total: 410,
        paymentMethod: 'COD',
        status: 'ASSIGNED',
        readyTime: '5 mins',
        distance: '4.5 km',
    };

    // Pulse animation for waiting state
    useEffect(() => {
        if (isOnline && !currentOrder) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
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
        }
    }, [isOnline, currentOrder]);

    // Simulate receiving an order after going online
    useEffect(() => {
        if (isOnline && !currentOrder) {
            const timer = setTimeout(() => {
                setCurrentOrder(mockOrder);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOnline]);

    const todayStats = {
        deliveries: 5,
        earnings: 450,
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        onlineToggle: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        statusIndicator: {
            width: 10,
            height: 10,
            borderRadius: 5,
            marginRight: spacing.sm,
        },
        onlineText: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginRight: spacing.sm,
        },
        profileButton: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.cardElevated,
            alignItems: 'center',
            justifyContent: 'center',
        },
        content: {
            flex: 1,
            paddingHorizontal: spacing.lg,
        },
        waitingContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: 100,
        },
        offlineContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: 100,
        },
        iconContainer: {
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: colors.cardElevated,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.xl,
        },
        waitingText: {
            fontSize: 20,
            fontWeight: '600',
            color: colors.text,
            marginBottom: spacing.sm,
        },
        waitingSubtext: {
            fontSize: 14,
            color: colors.textSecondary,
        },
        offlineText: {
            fontSize: 20,
            fontWeight: '600',
            color: colors.textSecondary,
            marginBottom: spacing.sm,
        },
        offlineSubtext: {
            fontSize: 14,
            color: colors.textMuted,
            textAlign: 'center',
            paddingHorizontal: spacing.xl,
        },
        orderContainer: {
            paddingTop: spacing.xl,
        },
        newOrderBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.warning + '20',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
            marginBottom: spacing.lg,
            alignSelf: 'flex-start',
        },
        newOrderText: {
            fontSize: 14,
            fontWeight: '700',
            color: colors.warning,
            marginLeft: spacing.sm,
        },
        statsContainer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            flexDirection: 'row',
            paddingVertical: spacing.lg,
            paddingHorizontal: spacing.xl,
        },
        statItem: {
            flex: 1,
            alignItems: 'center',
        },
        statValue: {
            fontSize: 24,
            fontWeight: '700',
            color: colors.text,
        },
        statLabel: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: spacing.xs,
        },
        statDivider: {
            width: 1,
            backgroundColor: colors.border,
        },
        actionButton: {
            marginTop: spacing.lg,
        },
    });

    const handleOrderPress = () => {
        navigation.navigate('Pickup', { order: currentOrder });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.card} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.onlineToggle}>
                    <View style={[
                        styles.statusIndicator,
                        { backgroundColor: isOnline ? colors.success : colors.textMuted }
                    ]} />
                    <Text style={styles.onlineText}>
                        {isOnline ? 'Online' : 'Offline'}
                    </Text>
                    <Switch
                        value={isOnline}
                        onValueChange={(value) => {
                            setIsOnline(value);
                            if (!value) setCurrentOrder(null);
                        }}
                        trackColor={{ false: colors.border, true: colors.success + '50' }}
                        thumbColor={isOnline ? colors.success : colors.textMuted}
                    />
                </View>

                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Icon name="user" size={22} color={colors.iconActive} />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {!isOnline ? (
                    // Offline State
                    <View style={styles.offlineContainer}>
                        <View style={styles.iconContainer}>
                            <Icon name="wifi-off" size={50} color={colors.textMuted} />
                        </View>
                        <Text style={styles.offlineText}>You're Offline</Text>
                        <Text style={styles.offlineSubtext}>
                            Go online to start receiving delivery requests
                        </Text>
                    </View>
                ) : !currentOrder ? (
                    // Waiting for Orders
                    <View style={styles.waitingContainer}>
                        <Animated.View style={[
                            styles.iconContainer,
                            { transform: [{ scale: pulseAnim }] }
                        ]}>
                            <Icon name="truck" size={50} color={colors.primary} />
                        </Animated.View>
                        <Text style={styles.waitingText}>Waiting for orders...</Text>
                        <Text style={styles.waitingSubtext}>
                            You'll be notified when a new order arrives
                        </Text>
                    </View>
                ) : (
                    // Order Assigned
                    <ScrollView
                        style={styles.orderContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.newOrderBadge}>
                            <Icon name="bell" size={16} color={colors.warning} />
                            <Text style={styles.newOrderText}>NEW ORDER!</Text>
                        </View>

                        <OrderCard
                            orderNumber={currentOrder.orderNumber}
                            restaurantName={currentOrder.restaurantName}
                            distance={currentOrder.distance}
                            itemCount={currentOrder.itemCount}
                            total={currentOrder.total}
                            paymentMethod={currentOrder.paymentMethod}
                            status={currentOrder.status}
                            readyTime={currentOrder.readyTime}
                            onPress={handleOrderPress}
                        />

                        <Button
                            title="Go to Restaurant"
                            onPress={handleOrderPress}
                            style={styles.actionButton}
                            icon={<Icon name="navigation" size={20} color={colors.textOnPrimary} />}
                        />
                    </ScrollView>
                )}
            </View>

            {/* Stats Footer */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{todayStats.deliveries}</Text>
                    <Text style={styles.statLabel}>Deliveries Today</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>₹{todayStats.earnings}</Text>
                    <Text style={styles.statLabel}>Earned Today</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
