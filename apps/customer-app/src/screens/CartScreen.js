import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    StatusBar,
    Platform,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { spacing, shadows } from '../theme';

const { width } = Dimensions.get('window');

const CartScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const colors = theme.colors;

    const [activeTab, setActiveTab] = useState('cart');

    const [cartItems, setCartItems] = useState([
        { id: 1, name: 'Caesar Salad', price: 180, quantity: 2, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200', rating: 4.8, serves: '1-2' },
        { id: 2, name: 'Grilled Salmon', price: 450, quantity: 1, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200', rating: 4.9, serves: '1' },
        { id: 3, name: 'Fresh Orange Juice', price: 120, quantity: 3, image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200', rating: 4.5, serves: '1' },
    ]);

    const [orders, setOrders] = useState([
        { id: 'ORD001', status: 'ready', items: [{ name: 'Chicken Wings', quantity: 1, price: 480 }, { name: 'Iced Coffee', quantity: 2, price: 140 }], total: 760, orderDate: 'Jan 10, 2:30 PM', paymentStatus: 'Paid via UPI', discount: 0 },
        { id: 'ORD002', status: 'preparing', items: [{ name: 'Pasta Carbonara', quantity: 1, price: 560 }, { name: 'Chocolate Cake', quantity: 1, price: 300 }], total: 860, orderDate: 'Jan 10, 3:15 PM', paymentStatus: 'Not Paid', discount: 0 },
        { id: 'ORD003', status: 'placed', items: [{ name: 'Veggie Burger', quantity: 2, price: 540 }], total: 1080, orderDate: 'Jan 10, 3:45 PM', paymentStatus: 'Paid via Cash', discount: 50 },
    ]);

    const updateQuantity = (id, increment) => {
        setCartItems(prev =>
            prev.map(item => {
                if (item.id === id) {
                    const newQuantity = Math.max(0, item.quantity + increment);
                    return newQuantity === 0 ? null : { ...item, quantity: newQuantity };
                }
                return item;
            }).filter(Boolean)
        );
    };

    const removeItem = (id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const getTotalPrice = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getServiceCharge = () => Math.round(getTotalPrice() * 0.05);
    const getTax = () => Math.round(getTotalPrice() * 0.18);
    const getGrandTotal = () => getTotalPrice() + getServiceCharge() + getTax();

    const getStatusIcon = (status) => {
        switch (status) {
            case 'placed': return 'check-circle';
            case 'preparing': return 'coffee';
            case 'ready': return 'clock';
            default: return 'clock';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'placed': return '#4CAF50';
            case 'preparing': return '#FF9800';
            case 'ready': return '#d9b550';
            default: return '#888888';
        }
    };

    const placeOrder = () => {
        if (cartItems.length === 0) return;

        const newOrder = {
            id: `ORD00${orders.length + 1}`,
            status: 'placed',
            items: cartItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            total: getGrandTotal(),
            orderDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            paymentStatus: 'Not Paid',
            discount: 0
        };

        setOrders(prev => [newOrder, ...prev]);
        setCartItems([]);
        setActiveTab('orders');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity style={styles.hamburger}>
                        <View style={[styles.hamburgerLine, { backgroundColor: colors.primary }]} />
                        <View style={[styles.hamburgerLine, { backgroundColor: colors.primary, width: 16 }]} />
                        <View style={[styles.hamburgerLine, { backgroundColor: colors.primary }]} />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={[styles.liveQueueBtn, { backgroundColor: colors.primaryLight }]}
                    onPress={() => navigation.navigate('OrderTracking')}
                >
                    <Icon name="list" size={20} color={colors.primary} />
                    <View style={[styles.liveDot, { backgroundColor: '#4CAF50' }]} />
                </TouchableOpacity>
            </View>

            {/* Hero Title */}
            <View style={styles.heroSection}>
                <Text style={[styles.heroTitle, { color: colors.text }]}>
                    My <Text style={[styles.highlight, { color: colors.primary }]}>Orders</Text>
                </Text>
                <Text style={[styles.heroTitle, { color: colors.text }]}>
                    <Text style={styles.ampersand}>&</Text>{' '}
                    <Text style={[styles.highlight, { color: colors.primary }]}>Cart</Text>
                </Text>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabSection}>
                <View style={[styles.tabNav, { backgroundColor: colors.card }]}>
                    <TouchableOpacity
                        style={[
                            styles.tabBtn,
                            activeTab === 'cart' && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => setActiveTab('cart')}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'cart' ? '#FFFFFF' : colors.textMuted }
                        ]}>
                            Cart ({cartItems.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tabBtn,
                            activeTab === 'orders' && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => setActiveTab('orders')}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'orders' ? '#FFFFFF' : colors.textMuted }
                        ]}>
                            Orders ({orders.length})
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                {/* Cart Content */}
                {activeTab === 'cart' && (
                    <View style={styles.cartContent}>
                        {cartItems.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Icon name="shopping-bag" size={64} color={colors.textMuted} />
                                <Text style={[styles.emptyTitle, { color: colors.text }]}>Your cart is empty</Text>
                                <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>Add some delicious items to get started!</Text>
                            </View>
                        ) : (
                            <>
                                {/* Cart Items */}
                                <View style={styles.cartItems}>
                                    {cartItems.map(item => (
                                        <View key={item.id} style={[styles.cartItem, { backgroundColor: colors.card }]}>
                                            <Image source={{ uri: item.image }} style={styles.cartImage} />
                                            <View style={styles.cartInfo}>
                                                <View style={styles.cartHeader}>
                                                    <Text style={[styles.cartName, { color: colors.text }]}>{item.name}</Text>
                                                    <TouchableOpacity
                                                        style={[styles.removeBtn, { backgroundColor: '#FFEBEE' }]}
                                                        onPress={() => removeItem(item.id)}
                                                    >
                                                        <Icon name="trash-2" size={14} color="#F44336" />
                                                    </TouchableOpacity>
                                                </View>
                                                <View style={styles.cartMeta}>
                                                    <View style={styles.cartRating}>
                                                        <Icon name="star" size={12} color={colors.star} />
                                                        <Text style={[styles.cartRatingText, { color: colors.text }]}>{item.rating}</Text>
                                                    </View>
                                                    <View style={styles.cartServes}>
                                                        <Icon name="users" size={12} color={colors.textMuted} />
                                                        <Text style={[styles.cartServesText, { color: colors.textMuted }]}>Serves {item.serves}</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.cartBottom}>
                                                    <View style={[styles.qtyControls, { backgroundColor: colors.primaryLight }]}>
                                                        <TouchableOpacity onPress={() => updateQuantity(item.id, -1)}>
                                                            <Icon name="minus" size={14} color={colors.primary} />
                                                        </TouchableOpacity>
                                                        <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>
                                                        <TouchableOpacity onPress={() => updateQuantity(item.id, 1)}>
                                                            <Icon name="plus" size={14} color={colors.primary} />
                                                        </TouchableOpacity>
                                                    </View>
                                                    <Text style={[styles.itemPrice, { color: colors.primary }]}>
                                                        ₹{item.price * item.quantity}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </View>

                                {/* Order Summary */}
                                <Text style={[styles.summaryTitle, { color: colors.text }]}>Summary</Text>
                                <View style={[styles.orderSummary, { backgroundColor: colors.card }]}>
                                    <View style={styles.summaryRow}>
                                        <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Subtotal</Text>
                                        <Text style={[styles.summaryValue, { color: colors.text }]}>₹{getTotalPrice()}</Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Service Charge (5%)</Text>
                                        <Text style={[styles.summaryValue, { color: colors.text }]}>₹{getServiceCharge()}</Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Tax (18%)</Text>
                                        <Text style={[styles.summaryValue, { color: colors.text }]}>₹{getTax()}</Text>
                                    </View>
                                    <View style={[styles.summaryRow, styles.discountRow]}>
                                        <Text style={[styles.summaryLabel, { color: '#4CAF50' }]}>Discount</Text>
                                        <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>- ₹0</Text>
                                    </View>
                                    <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: colors.border }]}>
                                        <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount</Text>
                                        <Text style={[styles.totalValue, { color: colors.primary }]}>₹{getGrandTotal()}</Text>
                                    </View>
                                </View>

                                {/* Place Order Button */}
                                <TouchableOpacity
                                    style={[styles.placeOrderBtn, { backgroundColor: colors.primary }]}
                                    onPress={placeOrder}
                                >
                                    <Text style={styles.placeOrderText}>Place Order</Text>
                                    <Icon name="arrow-right" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}

                {/* Orders Content */}
                {activeTab === 'orders' && (
                    <View style={styles.ordersContent}>
                        {orders.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Icon name="clock" size={64} color={colors.textMuted} />
                                <Text style={[styles.emptyTitle, { color: colors.text }]}>No active orders yet</Text>
                                <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>Order some delicious food!</Text>
                            </View>
                        ) : (
                            <>
                                <Text style={[styles.sectionHeading, { color: colors.text }]}>Today's Orders</Text>
                                <View style={styles.ordersList}>
                                    {orders.map(order => (
                                        <View key={order.id} style={[styles.orderItem, { backgroundColor: colors.card }]}>
                                            <View style={styles.orderHeader}>
                                                <View style={styles.orderIdRow}>
                                                    <Text style={[styles.orderId, { color: colors.text }]}>Order #{order.id}</Text>
                                                    <View style={[styles.orderStatus, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                                                        <Icon name={getStatusIcon(order.status)} size={14} color={getStatusColor(order.status)} />
                                                        <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Text style={[styles.orderDate, { color: colors.textMuted }]}>{order.orderDate}</Text>
                                            </View>

                                            <View style={[styles.orderItems, { borderColor: colors.border }]}>
                                                {order.items.map((item, index) => (
                                                    <View key={index} style={styles.orderItemRow}>
                                                        <Text style={[styles.orderItemName, { color: colors.textSecondary }]}>
                                                            {item.quantity}x {item.name}
                                                        </Text>
                                                        <Text style={[styles.orderItemPrice, { color: colors.textSecondary }]}>
                                                            ₹{item.price * item.quantity}
                                                        </Text>
                                                    </View>
                                                ))}
                                                <View style={styles.orderItemRow}>
                                                    <Text style={[styles.orderItemName, { color: colors.textMuted }]}>Service Charge & Tax</Text>
                                                    <Text style={[styles.orderItemPrice, { color: colors.textMuted }]}>₹{Math.round(order.total * 0.23)}</Text>
                                                </View>
                                                {order.discount > 0 && (
                                                    <View style={styles.orderItemRow}>
                                                        <Text style={[styles.orderItemName, { color: '#4CAF50' }]}>Discount</Text>
                                                        <Text style={[styles.orderItemPrice, { color: '#4CAF50' }]}>- ₹{order.discount}</Text>
                                                    </View>
                                                )}
                                            </View>

                                            <View style={styles.orderFooter}>
                                                <View style={[
                                                    styles.paymentBadge,
                                                    { backgroundColor: order.paymentStatus.includes('Not') ? '#FFEBEE' : '#E8F5E9' }
                                                ]}>
                                                    <Text style={[
                                                        styles.paymentText,
                                                        { color: order.paymentStatus.includes('Not') ? '#F44336' : '#4CAF50' }
                                                    ]}>
                                                        {order.paymentStatus}
                                                    </Text>
                                                </View>
                                                <View style={styles.orderTotalInline}>
                                                    <Text style={[styles.orderTotal, { color: colors.primary }]}>₹{order.total}</Text>
                                                    <Text style={[styles.orderTotalNote, { color: colors.textMuted }]}>(Incl. all taxes)</Text>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 16,
        paddingBottom: 12,
    },
    headerLeft: {},
    hamburger: { gap: 4, padding: 8 },
    hamburgerLine: { width: 20, height: 2.5, borderRadius: 2 },
    liveQueueBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    liveDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
    },

    // Hero
    heroSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '600',
        lineHeight: 42,
    },
    highlight: {
        fontWeight: '800',
    },
    ampersand: {
        fontWeight: '300',
    },

    // Tabs
    tabSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    tabNav: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 4,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },

    // Cart Content
    cartContent: {
        paddingHorizontal: 20,
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyDesc: {
        fontSize: 14,
        textAlign: 'center',
    },

    // Cart Items
    cartItems: {
        gap: 16,
        marginBottom: 24,
    },
    cartItem: {
        flexDirection: 'row',
        borderRadius: 16,
        overflow: 'hidden',
    },
    cartImage: {
        width: 90,
        height: 100,
    },
    cartInfo: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    cartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cartName: {
        fontSize: 15,
        fontWeight: '700',
        flex: 1,
    },
    removeBtn: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cartMeta: {
        flexDirection: 'row',
        gap: 14,
        marginTop: 6,
    },
    cartRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    cartRatingText: {
        fontSize: 12,
        fontWeight: '600',
    },
    cartServes: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    cartServesText: {
        fontSize: 12,
    },
    cartBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    qtyControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    qtyText: {
        fontSize: 14,
        fontWeight: '700',
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: '800',
    },

    // Summary
    summaryTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    orderSummary: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 14,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    discountRow: {},
    totalRow: {
        borderTopWidth: 1,
        paddingTop: 12,
        marginTop: 4,
        marginBottom: 0,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '700',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '800',
    },

    // Place Order
    placeOrderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 18,
        borderRadius: 16,
    },
    placeOrderText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },

    // Orders Content
    ordersContent: {
        paddingHorizontal: 20,
    },
    sectionHeading: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    ordersList: {
        gap: 16,
    },
    orderItem: {
        borderRadius: 16,
        padding: 16,
    },
    orderHeader: {
        marginBottom: 14,
    },
    orderIdRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderId: {
        fontSize: 15,
        fontWeight: '700',
    },
    orderStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 16,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    orderDate: {
        fontSize: 12,
        marginTop: 4,
    },
    orderItems: {
        borderTopWidth: 1,
        borderBottomWidth: 1,
        paddingVertical: 12,
        marginBottom: 14,
    },
    orderItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    orderItemName: {
        fontSize: 13,
    },
    orderItemPrice: {
        fontSize: 13,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paymentBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    paymentText: {
        fontSize: 11,
        fontWeight: '600',
    },
    orderTotalInline: {
        alignItems: 'flex-end',
    },
    orderTotal: {
        fontSize: 18,
        fontWeight: '800',
    },
    orderTotalNote: {
        fontSize: 10,
    },
});

export default CartScreen;
