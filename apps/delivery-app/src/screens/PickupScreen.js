import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    ScrollView,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius } from '../theme';
import Button from '../components/Button';

export default function PickupScreen({ navigation, route }) {
    const { theme } = useTheme();
    const colors = theme.colors;

    const order = route?.params?.order || {
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
        total: 410,
        paymentMethod: 'COD',
    };

    const [readyTimer, setReadyTimer] = useState(30); // 30 seconds
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (readyTimer > 0 && !isReady) {
            const timer = setInterval(() => {
                setReadyTimer(prev => {
                    if (prev <= 1) {
                        setIsReady(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [readyTimer, isReady]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const openMaps = () => {
        navigation.navigate('NavigationMap', {
            destinationType: 'restaurant',
            destinationName: order.restaurantName,
            destinationAddress: order.restaurantAddress || 'Station Road, Karimganj, Assam',
            destinationCoords: order.restaurantCoords || { latitude: 24.8648, longitude: 92.3538 },
        });
    };

    const callRestaurant = () => {
        Linking.openURL(`tel:${order.restaurantPhone}`);
    };

    const handlePickedUp = () => {
        navigation.replace('Delivery', { order });
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        backButton: {
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: colors.cardElevated,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
        },
        headerTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.text,
        },
        content: {
            flex: 1,
        },
        scrollContent: {
            padding: spacing.lg,
            paddingBottom: 120,
        },
        timerCard: {
            backgroundColor: isReady ? colors.success + '15' : colors.warning + '15',
            borderRadius: borderRadius.lg,
            padding: spacing.xl,
            alignItems: 'center',
            marginBottom: spacing.lg,
            borderWidth: 1,
            borderColor: isReady ? colors.success + '30' : colors.warning + '30',
        },
        timerLabel: {
            fontSize: 14,
            color: isReady ? colors.success : colors.warning,
            fontWeight: '600',
            marginBottom: spacing.sm,
        },
        timerValue: {
            fontSize: 48,
            fontWeight: '700',
            color: isReady ? colors.success : colors.warning,
        },
        readyText: {
            fontSize: 24,
            fontWeight: '700',
            color: colors.success,
        },
        restaurantCard: {
            backgroundColor: colors.card,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            marginBottom: spacing.lg,
            borderWidth: 1,
            borderColor: colors.border,
        },
        restaurantName: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.text,
            marginBottom: spacing.sm,
        },
        addressRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: spacing.md,
        },
        addressText: {
            flex: 1,
            fontSize: 14,
            color: colors.textSecondary,
            marginLeft: spacing.sm,
            lineHeight: 20,
        },
        actionButtons: {
            flexDirection: 'row',
            gap: spacing.md,
        },
        actionButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.cardElevated,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.md,
        },
        actionButtonText: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.primary,
            marginLeft: spacing.sm,
        },
        orderCard: {
            backgroundColor: colors.card,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: colors.border,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.text,
            marginBottom: spacing.md,
        },
        orderItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: spacing.sm,
        },
        itemName: {
            flex: 1,
            fontSize: 14,
            color: colors.textBody,
        },
        itemQuantity: {
            fontSize: 14,
            color: colors.textSecondary,
            marginHorizontal: spacing.md,
        },
        itemPrice: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
        },
        divider: {
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: spacing.md,
        },
        totalRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        totalLabel: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
        },
        totalValue: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.primary,
        },
        paymentBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: order.paymentMethod === 'COD' ? colors.warning + '20' : colors.success + '20',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
            marginTop: spacing.md,
            alignSelf: 'flex-start',
        },
        paymentText: {
            fontSize: 14,
            fontWeight: '600',
            color: order.paymentMethod === 'COD' ? colors.warning : colors.success,
            marginLeft: spacing.sm,
        },
        footer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            padding: spacing.lg,
        },
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.card} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={22} color={colors.iconActive} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pickup Order</Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Timer Card */}
                    <View style={styles.timerCard}>
                        <Text style={styles.timerLabel}>
                            {isReady ? 'ORDER IS READY' : 'READY IN'}
                        </Text>
                        {isReady ? (
                            <Text style={styles.readyText}>Pick it up! 🎉</Text>
                        ) : (
                            <Text style={styles.timerValue}>{formatTime(readyTimer)}</Text>
                        )}
                    </View>

                    {/* Restaurant Card */}
                    <View style={styles.restaurantCard}>
                        <Text style={styles.restaurantName}>{order.restaurantName}</Text>
                        <View style={styles.addressRow}>
                            <Icon name="map-pin" size={16} color={colors.iconInactive} />
                            <Text style={styles.addressText}>{order.restaurantAddress}</Text>
                        </View>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={styles.actionButton} onPress={openMaps}>
                                <Icon name="navigation" size={18} color={colors.primary} />
                                <Text style={styles.actionButtonText}>Navigate</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionButton} onPress={callRestaurant}>
                                <Icon name="phone" size={18} color={colors.primary} />
                                <Text style={styles.actionButtonText}>Call</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Order Items */}
                    <View style={styles.orderCard}>
                        <Text style={styles.sectionTitle}>Order Items</Text>
                        {(order.items || []).map((item, index) => (
                            <View key={index} style={styles.orderItem}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                                <Text style={styles.itemPrice}>₹{item.price}</Text>
                            </View>
                        ))}
                        <View style={styles.divider} />
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>₹{order.total}</Text>
                        </View>
                        <View style={styles.paymentBadge}>
                            <Icon
                                name={order.paymentMethod === 'COD' ? 'dollar-sign' : 'check-circle'}
                                size={16}
                                color={order.paymentMethod === 'COD' ? colors.warning : colors.success}
                            />
                            <Text style={styles.paymentText}>
                                {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Already Paid'}
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Button
                    title={isReady ? "Order Picked Up" : "Waiting for Order..."}
                    onPress={handlePickedUp}
                    disabled={!isReady}
                    icon={<Icon name="check" size={20} color={colors.textOnPrimary} />}
                />
            </View>
        </SafeAreaView>
    );
}
