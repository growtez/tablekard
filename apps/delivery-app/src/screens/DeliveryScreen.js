import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    Linking,
    Dimensions,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius } from '../theme';
import Button from '../components/Button';

const { height } = Dimensions.get('window');

export default function DeliveryScreen({ navigation, route }) {
    const { theme } = useTheme();
    const colors = theme.colors;

    const order = route?.params?.order || {
        orderNumber: 'ORD-001234',
        customerName: 'John Doe',
        customerPhone: '+91 98765 43210',
        customerAddress: '123 Main Street, Apartment 4B, City Center',
        total: 450,
        paymentMethod: 'COD',
    };

    const [isDelivering, setIsDelivering] = useState(true);

    const openMaps = () => {
        navigation.navigate('NavigationMap', {
            destinationType: 'customer',
            destinationName: order.customerName,
            destinationAddress: order.customerAddress,
            destinationCoords: order.customerCoords || { latitude: 24.8402, longitude: 92.3891 },
        });
    };

    const callCustomer = () => {
        Linking.openURL(`tel:${order.customerPhone}`);
    };

    const handleMarkDelivered = () => {
        if (order.paymentMethod === 'COD') {
            Alert.alert(
                'Confirm Cash Collection',
                `Have you collected ₹${order.total} from the customer?`,
                [
                    { text: 'No', style: 'cancel' },
                    {
                        text: 'Yes, Collected',
                        onPress: () => completeDelivery()
                    },
                ]
            );
        } else {
            completeDelivery();
        }
    };

    const completeDelivery = () => {
        Alert.alert(
            'Delivery Complete! 🎉',
            'Great job! The order has been delivered successfully.',
            [
                {
                    text: 'OK',
                    onPress: () => navigation.popToTop()
                },
            ]
        );
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.xl + spacing.lg,
            paddingBottom: spacing.md,
        },
        backButton: {
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        mapContainer: {
            height: height * 0.55,
            backgroundColor: colors.cardElevated,
            alignItems: 'center',
            justifyContent: 'center',
        },
        mapPlaceholder: {
            alignItems: 'center',
        },
        mapIcon: {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: colors.secondary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.lg,
        },
        mapText: {
            fontSize: 16,
            color: colors.textSecondary,
            marginBottom: spacing.md,
        },
        openMapButton: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.primary,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.md,
        },
        openMapText: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.textOnPrimary,
            marginLeft: spacing.sm,
        },
        detailsContainer: {
            flex: 1,
            backgroundColor: colors.card,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            marginTop: -30,
            padding: spacing.xl,
            paddingTop: spacing.xxl,
        },
        customerSection: {
            marginBottom: spacing.lg,
        },
        sectionLabel: {
            fontSize: 12,
            fontWeight: '600',
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: spacing.sm,
        },
        customerName: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.text,
            marginBottom: spacing.sm,
        },
        addressRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
        },
        addressText: {
            flex: 1,
            fontSize: 14,
            color: colors.textSecondary,
            marginLeft: spacing.sm,
            lineHeight: 20,
        },
        contactButtons: {
            flexDirection: 'row',
            gap: spacing.md,
            marginTop: spacing.lg,
        },
        contactButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.cardElevated,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.md,
        },
        contactButtonText: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.primary,
            marginLeft: spacing.sm,
        },
        divider: {
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: spacing.lg,
        },
        paymentSection: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.xl,
        },
        paymentLeft: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        paymentLabel: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
        },
        paymentValue: {
            fontSize: 24,
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
            marginLeft: spacing.md,
        },
        paymentBadgeText: {
            fontSize: 12,
            fontWeight: '700',
            color: order.paymentMethod === 'COD' ? colors.warning : colors.success,
        },
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={22} color={colors.iconActive} />
                </TouchableOpacity>
            </View>

            {/* Map Placeholder */}
            <View style={styles.mapContainer}>
                <View style={styles.mapPlaceholder}>
                    <View style={styles.mapIcon}>
                        <Icon name="map" size={40} color={colors.primary} />
                    </View>
                    <Text style={styles.mapText}>Navigate to customer location</Text>
                    <TouchableOpacity style={styles.openMapButton} onPress={openMaps}>
                        <Icon name="navigation" size={18} color={colors.textOnPrimary} />
                        <Text style={styles.openMapText}>Open in Maps</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Details Card */}
            <View style={styles.detailsContainer}>
                {/* Customer Info */}
                <View style={styles.customerSection}>
                    <Text style={styles.sectionLabel}>Deliver To</Text>
                    <Text style={styles.customerName}>{order.customerName}</Text>
                    <View style={styles.addressRow}>
                        <Icon name="map-pin" size={16} color={colors.iconInactive} />
                        <Text style={styles.addressText}>{order.customerAddress}</Text>
                    </View>

                    <View style={styles.contactButtons}>
                        <TouchableOpacity style={styles.contactButton} onPress={callCustomer}>
                            <Icon name="phone" size={18} color={colors.primary} />
                            <Text style={styles.contactButtonText}>Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.contactButton} onPress={openMaps}>
                            <Icon name="navigation" size={18} color={colors.primary} />
                            <Text style={styles.contactButtonText}>Navigate</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Payment Info */}
                <View style={styles.paymentSection}>
                    <View>
                        <Text style={styles.paymentLabel}>Amount to Collect</Text>
                        <View style={styles.paymentLeft}>
                            <Text style={styles.paymentValue}>₹{order.total}</Text>
                            <View style={styles.paymentBadge}>
                                <Text style={styles.paymentBadgeText}>
                                    {order.paymentMethod === 'COD' ? 'CASH' : 'PAID'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Deliver Button */}
                <Button
                    title={order.paymentMethod === 'COD'
                        ? `Collected ₹${order.total} & Delivered`
                        : 'Mark as Delivered'
                    }
                    onPress={handleMarkDelivered}
                    icon={<Icon name="check-circle" size={20} color={colors.textOnPrimary} />}
                />
            </View>
        </View>
    );
}
