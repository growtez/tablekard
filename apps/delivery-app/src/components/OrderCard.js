import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { borderRadius, spacing } from '../theme';

export default function OrderCard({
    orderNumber,
    restaurantName,
    customerName,
    customerAddress,
    itemCount,
    total,
    paymentMethod,
    status,
    readyTime,
    distance,
    onPress,
}) {
    const { theme } = useTheme();
    const colors = theme.colors;

    const getStatusConfig = () => {
        switch (status) {
            case 'ASSIGNED':
                return { color: colors.warning, label: 'New Order', icon: 'bell' };
            case 'PICKED_UP':
                return { color: colors.info, label: 'In Transit', icon: 'truck' };
            case 'READY':
                return { color: colors.success, label: 'Ready for Pickup', icon: 'check-circle' };
            default:
                return { color: colors.textMuted, label: status, icon: 'clock' };
        }
    };

    const statusConfig = getStatusConfig();

    const styles = StyleSheet.create({
        container: {
            backgroundColor: colors.card,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            marginBottom: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
        },
        orderNumber: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.primary,
        },
        statusBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: `${statusConfig.color}20`,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.sm,
        },
        statusText: {
            fontSize: 12,
            fontWeight: '600',
            color: statusConfig.color,
            marginLeft: spacing.xs,
        },
        restaurantName: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
            marginBottom: spacing.xs,
        },
        infoRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.xs,
        },
        infoText: {
            fontSize: 14,
            color: colors.textSecondary,
            marginLeft: spacing.sm,
        },
        divider: {
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: spacing.md,
        },
        footer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        priceContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        price: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
        },
        paymentBadge: {
            marginLeft: spacing.sm,
            backgroundColor: paymentMethod === 'COD' ? colors.warning + '20' : colors.success + '20',
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.sm,
        },
        paymentText: {
            fontSize: 12,
            fontWeight: '600',
            color: paymentMethod === 'COD' ? colors.warning : colors.success,
        },
        timerContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        timerText: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.primary,
            marginLeft: spacing.xs,
        },
    });

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.header}>
                <Text style={styles.orderNumber}>#{orderNumber}</Text>
                <View style={styles.statusBadge}>
                    <Icon name={statusConfig.icon} size={12} color={statusConfig.color} />
                    <Text style={styles.statusText}>{statusConfig.label}</Text>
                </View>
            </View>

            <Text style={styles.restaurantName}>{restaurantName}</Text>

            {distance && (
                <View style={styles.infoRow}>
                    <Icon name="map-pin" size={14} color={colors.iconInactive} />
                    <Text style={styles.infoText}>{distance} away</Text>
                </View>
            )}

            {customerName && (
                <View style={styles.infoRow}>
                    <Icon name="user" size={14} color={colors.iconInactive} />
                    <Text style={styles.infoText}>{customerName}</Text>
                </View>
            )}

            {itemCount && (
                <View style={styles.infoRow}>
                    <Icon name="package" size={14} color={colors.iconInactive} />
                    <Text style={styles.infoText}>{itemCount} items</Text>
                </View>
            )}

            <View style={styles.divider} />

            <View style={styles.footer}>
                <View style={styles.priceContainer}>
                    <Text style={styles.price}>₹{total}</Text>
                    <View style={styles.paymentBadge}>
                        <Text style={styles.paymentText}>
                            {paymentMethod === 'COD' ? 'COD' : 'Paid'}
                        </Text>
                    </View>
                </View>

                {readyTime && (
                    <View style={styles.timerContainer}>
                        <Icon name="clock" size={14} color={colors.primary} />
                        <Text style={styles.timerText}>Ready in {readyTime}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}
