import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius } from '../theme';
import Button from '../components/Button';

export default function ProfileScreen({ navigation }) {
    const { theme, themeMode, toggleTheme } = useTheme();
    const colors = theme.colors;

    // Mock rider data - in production this comes from Firebase
    const riderData = {
        name: 'Rahul Kumar',
        riderId: 'RD-12345',
        restaurantName: 'Pizza Palace',
        phone: '+91 98765 43210',
        vehicleType: 'Bike',
        vehicleNumber: 'KA 01 AB 1234',
        rating: 4.8,
        totalDeliveries: 156,
        totalEarnings: 12450,
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => navigation.replace('Login')
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
            backgroundColor: colors.primary,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.xl,
            paddingBottom: spacing.xxl + spacing.lg,
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
        },
        headerTop: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.xl,
        },
        headerTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.textOnPrimary,
        },
        backButton: {
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
        },
        profileInfo: {
            alignItems: 'center',
        },
        avatarContainer: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.secondary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.md,
        },
        riderName: {
            fontSize: 24,
            fontWeight: '700',
            color: colors.textOnPrimary,
            marginBottom: spacing.xs,
        },
        riderId: {
            fontSize: 14,
            color: 'rgba(255,255,255,0.8)',
            marginBottom: spacing.xs,
        },
        restaurantBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.2)',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.full,
        },
        restaurantName: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.textOnPrimary,
            marginLeft: spacing.xs,
        },
        statsContainer: {
            flexDirection: 'row',
            backgroundColor: colors.card,
            marginHorizontal: spacing.lg,
            marginTop: -spacing.xxl,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
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
            backgroundColor: colors.divider,
        },
        content: {
            flex: 1,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.xl,
        },
        section: {
            backgroundColor: colors.card,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.lg,
            overflow: 'hidden',
        },
        sectionTitle: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 1,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.sm,
        },
        menuItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: colors.divider,
        },
        menuItemLast: {
            borderBottomWidth: 0,
        },
        menuIcon: {
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: colors.cardElevated,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
        },
        menuContent: {
            flex: 1,
        },
        menuLabel: {
            fontSize: 16,
            fontWeight: '500',
            color: colors.text,
        },
        menuValue: {
            fontSize: 14,
            color: colors.textSecondary,
            marginTop: 2,
        },
        menuArrow: {
            marginLeft: spacing.sm,
        },
        logoutButton: {
            marginTop: spacing.md,
            marginBottom: spacing.xxl,
        },
        logoutButtonStyle: {
            backgroundColor: colors.error + '10',
            borderColor: colors.error,
        },
    });

    const MenuItem = ({ icon, label, value, onPress, isLast }) => (
        <TouchableOpacity
            style={[styles.menuItem, isLast && styles.menuItemLast]}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={styles.menuIcon}>
                <Icon name={icon} size={20} color={colors.primary} />
            </View>
            <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{label}</Text>
                {value && <Text style={styles.menuValue}>{value}</Text>}
            </View>
            {onPress && (
                <Icon name="chevron-right" size={20} color={colors.iconInactive} style={styles.menuArrow} />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Icon name="arrow-left" size={22} color={colors.textOnPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>My Profile</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <View style={styles.profileInfo}>
                        <View style={styles.avatarContainer}>
                            <Icon name="user" size={36} color={colors.primary} />
                        </View>
                        <Text style={styles.riderName}>{riderData.name}</Text>
                        <Text style={styles.riderId}>{riderData.riderId}</Text>
                        <View style={styles.restaurantBadge}>
                            <Icon name="home" size={14} color={colors.textOnPrimary} />
                            <Text style={styles.restaurantName}>{riderData.restaurantName}</Text>
                        </View>
                    </View>
                </View>

                {/* Stats Card */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>⭐ {riderData.rating}</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{riderData.totalDeliveries}</Text>
                        <Text style={styles.statLabel}>Deliveries</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>₹{riderData.totalEarnings}</Text>
                        <Text style={styles.statLabel}>Earnings</Text>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Vehicle Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Vehicle Details</Text>
                        <MenuItem
                            icon="truck"
                            label="Vehicle Type"
                            value={riderData.vehicleType}
                        />
                        <MenuItem
                            icon="hash"
                            label="Vehicle Number"
                            value={riderData.vehicleNumber}
                            isLast
                        />
                    </View>

                    {/* Contact Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Contact</Text>
                        <MenuItem
                            icon="phone"
                            label="Phone"
                            value={riderData.phone}
                            isLast
                        />
                    </View>

                    {/* App Settings */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Settings</Text>
                        <MenuItem
                            icon="bell"
                            label="Notifications"
                            onPress={() => { }}
                        />
                        <MenuItem
                            icon="help-circle"
                            label="Help & Support"
                            onPress={() => { }}
                            isLast
                        />
                    </View>

                    {/* Logout */}
                    <View style={styles.logoutButton}>
                        <Button
                            title="Logout"
                            onPress={handleLogout}
                            variant="secondary"
                            icon={<Icon name="log-out" size={20} color={colors.error} />}
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
