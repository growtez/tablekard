import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    StatusBar,
    TextInput,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { spacing, shadows } from '../theme';

const CartScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const colors = theme.colors;

    const [cart, setCart] = useState([
        { id: 1, name: 'Caesar Salad', price: 340, quantity: 2, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200', isVegan: true },
        { id: 2, name: 'Grilled Salmon', price: 740, quantity: 1, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200', isVegan: false },
        { id: 3, name: 'Fresh Orange Juice', price: 180, quantity: 3, image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200', isVegan: true },
    ]);

    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);

    const updateQuantity = (id, delta) => {
        setCart(prev =>
            prev.map(item =>
                item.id === id
                    ? { ...item, quantity: Math.max(1, item.quantity + delta) }
                    : item
            )
        );
    };

    const removeItem = (id) => setCart(prev => prev.filter(item => item.id !== id));

    const applyCoupon = () => {
        if (couponCode.toUpperCase() === 'DELISH20') {
            setAppliedCoupon({ code: 'DELISH20', discount: 20, type: 'percent' });
        } else if (couponCode.toUpperCase() === 'FLAT50') {
            setAppliedCoupon({ code: 'FLAT50', discount: 50, type: 'flat' });
        }
        setCouponCode('');
    };

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = 40;
    const taxes = Math.round(subtotal * 0.05);

    let discount = 0;
    if (appliedCoupon) {
        discount = appliedCoupon.type === 'percent'
            ? Math.round(subtotal * appliedCoupon.discount / 100)
            : appliedCoupon.discount;
    }

    const total = subtotal + deliveryFee + taxes - discount;

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
                <Text style={[styles.headerTitle, { color: colors.text }]}>My Cart</Text>
                <View style={styles.cartCount}>
                    <Text style={[styles.cartCountText, { color: colors.primary }]}>{cart.length} items</Text>
                </View>
            </View>

            {cart.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
                        <Icon name="shopping-bag" size={48} color={colors.primary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>Your cart is empty</Text>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                        Add delicious items from our menu to get started!
                    </Text>
                    <TouchableOpacity
                        style={[styles.browseBtn, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('Menu')}
                    >
                        <Text style={styles.browseBtnText}>Browse Menu</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Cart Items */}
                    <View style={styles.cartItemsSection}>
                        {cart.map(item => (
                            <View
                                key={item.id}
                                style={[styles.cartItem, { backgroundColor: colors.card }, shadows.sm]}
                            >
                                <Image source={{ uri: item.image }} style={styles.cartImage} />

                                <View style={styles.cartInfo}>
                                    <View style={styles.cartItemHeader}>
                                        <View style={styles.itemNameRow}>
                                            {item.isVegan && (
                                                <View style={[styles.vegBadge, { backgroundColor: colors.success + '20' }]}>
                                                    <View style={[styles.vegDot, { backgroundColor: colors.success }]} />
                                                </View>
                                            )}
                                            <Text style={[styles.cartName, { color: colors.text }]} numberOfLines={1}>
                                                {item.name}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={[styles.removeBtn, { backgroundColor: colors.errorLight }]}
                                            onPress={() => removeItem(item.id)}
                                        >
                                            <Icon name="trash-2" size={14} color={colors.error} />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.cartBottom}>
                                        <View style={[styles.quantityControls, { backgroundColor: colors.primaryLight }]}>
                                            <TouchableOpacity
                                                style={styles.qtyBtn}
                                                onPress={() => updateQuantity(item.id, -1)}
                                            >
                                                <Icon name="minus" size={16} color={colors.primary} />
                                            </TouchableOpacity>
                                            <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>
                                            <TouchableOpacity
                                                style={styles.qtyBtn}
                                                onPress={() => updateQuantity(item.id, 1)}
                                            >
                                                <Icon name="plus" size={16} color={colors.primary} />
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

                    {/* Coupon Section */}
                    <View style={[styles.couponSection, { backgroundColor: colors.card }, shadows.sm]}>
                        <View style={styles.couponHeader}>
                            <Icon name="tag" size={18} color={colors.primary} />
                            <Text style={[styles.couponTitle, { color: colors.text }]}>Apply Coupon</Text>
                        </View>

                        {appliedCoupon ? (
                            <View style={[styles.appliedCoupon, { backgroundColor: colors.successLight }]}>
                                <View style={styles.couponInfo}>
                                    <Icon name="check-circle" size={16} color={colors.success} />
                                    <Text style={[styles.appliedCode, { color: colors.success }]}>
                                        {appliedCoupon.code} applied
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => setAppliedCoupon(null)}>
                                    <Icon name="x" size={18} color={colors.success} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.couponInputRow}>
                                <TextInput
                                    style={[styles.couponInput, { backgroundColor: colors.background, color: colors.text }]}
                                    placeholder="Enter coupon code"
                                    placeholderTextColor={colors.textMuted}
                                    value={couponCode}
                                    onChangeText={setCouponCode}
                                />
                                <TouchableOpacity
                                    style={[styles.applyBtn, { backgroundColor: colors.primary }]}
                                    onPress={applyCoupon}
                                >
                                    <Text style={styles.applyBtnText}>Apply</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Order Summary */}
                    <View style={[styles.orderSummary, { backgroundColor: colors.card }, shadows.sm]}>
                        <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>

                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Subtotal</Text>
                            <Text style={[styles.summaryValue, { color: colors.text }]}>₹{subtotal}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Delivery Fee</Text>
                            <Text style={[styles.summaryValue, { color: colors.text }]}>₹{deliveryFee}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Tax (5%)</Text>
                            <Text style={[styles.summaryValue, { color: colors.text }]}>₹{taxes}</Text>
                        </View>

                        {discount > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: colors.success }]}>Discount</Text>
                                <Text style={[styles.summaryValue, { color: colors.success }]}>-₹{discount}</Text>
                            </View>
                        )}

                        <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
                            <Text style={[styles.totalValue, { color: colors.primary }]}>₹{total}</Text>
                        </View>
                    </View>

                    {/* Place Order Button */}
                    <TouchableOpacity
                        style={[styles.placeOrderBtn, { backgroundColor: colors.primary }, shadows.burgundy]}
                        onPress={() => navigation.navigate('Checkout')}
                    >
                        <Text style={styles.placeOrderText}>Proceed to Checkout</Text>
                        <Icon name="arrow-right" size={20} color="#FFFFFF" />
                    </TouchableOpacity>

                    <View style={{ height: 20 }} />
                </ScrollView>
            )}
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
    cartCount: {},
    cartCountText: {
        fontSize: 13,
        fontWeight: '600',
    },

    // Empty State
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingBottom: 100,
    },
    emptyIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    browseBtn: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 16,
    },
    browseBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },

    scrollContent: {
        padding: 20,
    },

    // Cart Items
    cartItemsSection: {
        gap: 14,
        marginBottom: 20
    },
    cartItem: {
        flexDirection: 'row',
        borderRadius: 20,
        padding: 14,
    },
    cartImage: {
        width: 80,
        height: 80,
        borderRadius: 16
    },
    cartInfo: {
        flex: 1,
        marginLeft: 14,
        justifyContent: 'space-between',
    },
    cartItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    itemNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    vegBadge: {
        width: 18,
        height: 18,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    vegDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    cartName: {
        fontSize: 15,
        fontWeight: '700',
        flex: 1,
    },
    removeBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cartBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 4,
    },
    qtyBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center'
    },
    qtyText: {
        fontWeight: '700',
        fontSize: 15,
        marginHorizontal: 12
    },
    itemPrice: {
        fontSize: 18,
        fontWeight: '800'
    },

    // Coupon
    couponSection: {
        borderRadius: 20,
        padding: 18,
        marginBottom: 20,
    },
    couponHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
    },
    couponTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    couponInputRow: {
        flexDirection: 'row',
        gap: 10,
    },
    couponInput: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 14,
    },
    applyBtn: {
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    appliedCoupon: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 12,
    },
    couponInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    appliedCode: {
        fontSize: 14,
        fontWeight: '600',
    },

    // Order Summary
    orderSummary: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 20
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    summaryLabel: {
        fontSize: 14
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        paddingTop: 16,
        marginTop: 8,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700'
    },
    totalValue: {
        fontSize: 22,
        fontWeight: '800'
    },

    // Place Order
    placeOrderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 18,
        borderRadius: 18,
    },
    placeOrderText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700'
    },
});

export default CartScreen;
