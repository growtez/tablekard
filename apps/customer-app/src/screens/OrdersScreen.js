import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { spacing, shadows } from '../theme';

const OrdersScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const colors = theme.colors;

    // Stats data
    const stats = {
        totalOrders: 24,
        totalSpent: '₹12.4k',
        favorites: 8,
    };

    const orders = [
        {
            id: 'ORD-7841',
            status: 'delivered',
            items: [
                { name: 'Caesar Salad', quantity: 2 },
                { name: 'Chicken Wings', quantity: 1 }
            ],
            total: 1160,
            date: '27 Dec 2024',
            time: '2:30 PM',
            rating: null,
        },
        {
            id: 'ORD-7839',
            status: 'delivered',
            items: [{ name: 'Grilled Salmon', quantity: 1 }],
            total: 740,
            date: '25 Dec 2024',
            time: '7:15 PM',
            rating: 4.5,
        },
        {
            id: 'ORD-7834',
            status: 'delivered',
            items: [{ name: 'Pasta Carbonara', quantity: 2 }],
            total: 1120,
            date: '23 Dec 2024',
            time: '1:00 PM',
            rating: 5,
        },
        {
            id: 'ORD-7821',
            status: 'delivered',
            items: [
                { name: 'Butter Chicken', quantity: 1 },
                { name: 'Naan', quantity: 2 }
            ],
            total: 520,
            date: '20 Dec 2024',
            time: '8:00 PM',
            rating: 4,
        },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'delivered': return colors.success;
            case 'cancelled': return colors.error;
            case 'preparing': return colors.warning;
            case 'on_the_way': return colors.primary;
            default: return colors.textMuted;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'delivered': return 'check-circle';
            case 'cancelled': return 'x-circle';
            case 'preparing': return 'clock';
            case 'on_the_way': return 'truck';
            default: return 'circle';
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.backBtn, { backgroundColor: colors.primaryLight }]}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={20} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Order History</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Stats Bubble */}
                <View style={[styles.statsBubble, { backgroundColor: colors.primary }, shadows.burgundy]}>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.totalOrders}</Text>
                            <Text style={styles.statLabel}>Orders</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.totalSpent}</Text>
                            <Text style={styles.statLabel}>Spent</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.favorites}</Text>
                            <Text style={styles.statLabel}>Favourite</Text>
                        </View>
                    </View>
                </View>

                {/* Section Title */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Past Orders</Text>
                    <Text style={[styles.orderCount, { color: colors.textMuted }]}>{orders.length} orders</Text>
                </View>

                {/* Order Cards */}
                {orders.map((order, index) => (
                    <TouchableOpacity
                        key={order.id}
                        style={[styles.orderCard, { backgroundColor: colors.card }, shadows.sm]}
                        onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}
                    >
                        {/* Accent Bar */}
                        <View style={[styles.accentBar, { backgroundColor: getStatusColor(order.status) }]} />

                        <View style={styles.orderContent}>
                            {/* Order Header */}
                            <View style={styles.orderHeader}>
                                <View>
                                    <Text style={[styles.orderId, { color: colors.text }]}>{order.id}</Text>
                                    <Text style={[styles.orderDate, { color: colors.textMuted }]}>
                                        {order.date} • {order.time}
                                    </Text>
                                </View>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: getStatusColor(order.status) + '15' }
                                ]}>
                                    <Icon
                                        name={getStatusIcon(order.status)}
                                        size={12}
                                        color={getStatusColor(order.status)}
                                    />
                                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                                    </Text>
                                </View>
                            </View>

                            {/* Items */}
                            <View style={[styles.orderItems, { borderColor: colors.border }]}>
                                {order.items.slice(0, 2).map((item, idx) => (
                                    <Text key={idx} style={[styles.orderItem, { color: colors.textSecondary }]}>
                                        {item.quantity}× {item.name}
                                    </Text>
                                ))}
                                {order.items.length > 2 && (
                                    <Text style={[styles.moreItems, { color: colors.textMuted }]}>
                                        +{order.items.length - 2} more
                                    </Text>
                                )}
                            </View>

                            {/* Footer */}
                            <View style={styles.orderFooter}>
                                <Text style={[styles.orderTotal, { color: colors.primary }]}>₹{order.total}</Text>

                                <View style={styles.footerActions}>
                                    {order.rating ? (
                                        <View style={styles.ratingDisplay}>
                                            <Icon name="star" size={12} color={colors.star} />
                                            <Text style={[styles.ratingText, { color: colors.text }]}>{order.rating}</Text>
                                        </View>
                                    ) : (
                                        <TouchableOpacity style={[styles.rateBtn, { borderColor: colors.primary }]}>
                                            <Text style={[styles.rateBtnText, { color: colors.primary }]}>Rate</Text>
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        style={[styles.reorderBtn, { backgroundColor: colors.primaryLight }]}
                                    >
                                        <Icon name="refresh-cw" size={14} color={colors.primary} />
                                        <Text style={[styles.reorderText, { color: colors.primary }]}>Reorder</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },

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
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700'
    },

    scrollContent: {
        padding: 20,
    },

    // Stats Bubble
    statsBubble: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 28,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        height: 40,
    },

    // Section Header
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    orderCount: {
        fontSize: 13,
    },

    // Order Card
    orderCard: {
        borderRadius: 20,
        marginBottom: 16,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    accentBar: {
        width: 4,
    },
    orderContent: {
        flex: 1,
        padding: 18,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    orderId: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    orderDate: {
        fontSize: 12,
        marginTop: 4
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 5,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600'
    },

    orderItems: {
        borderTopWidth: 1,
        borderBottomWidth: 1,
        paddingVertical: 12,
        marginBottom: 14,
    },
    orderItem: {
        fontSize: 13,
        marginBottom: 4,
        fontWeight: '500',
    },
    moreItems: {
        fontSize: 12,
        fontStyle: 'italic',
    },

    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    orderTotal: {
        fontSize: 20,
        fontWeight: '800'
    },
    footerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    ratingDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '600',
    },
    rateBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1.5,
    },
    rateBtnText: {
        fontSize: 12,
        fontWeight: '600',
    },
    reorderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
    },
    reorderText: {
        fontSize: 13,
        fontWeight: '600'
    },
});

export default OrdersScreen;
