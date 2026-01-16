import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    Modal,
    StatusBar,
    Platform,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { spacing, shadows } from '../theme';
import HamburgerMenu from '../components/HamburgerMenu';

const { width } = Dimensions.get('window');

const MenuScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const colors = theme.colors;

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Starters');
    const [favorites, setFavorites] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const categories = ['Starters', 'Main Course', 'Drinks', 'Desserts'];

    const menuItems = {
        'Starters': [
            { id: 1, name: 'Caesar Salad', shortDesc: 'Crisp romaine lettuce with creamy Caesar dressing', price: 340, time: '15min', rating: 4.6, serves: 'Serves 1', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop', description: 'Fresh romaine lettuce tossed in creamy Caesar dressing.', dietType: 'veg' },
            { id: 2, name: 'Chicken Wings', shortDesc: 'Crispy fried wings tossed in spicy buffalo sauce', price: 480, time: '20min', rating: 4.8, serves: 'Serves 2', image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=400&fit=crop', description: 'Crispy fried chicken wings in signature spicy buffalo sauce.', dietType: 'non-veg' },
            { id: 3, name: 'Avocado Toast', shortDesc: 'Fresh smashed avocado on artisan sourdough', price: 380, time: '10min', rating: 4.4, serves: 'Serves 1', image: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=400&h=400&fit=crop', description: 'Perfectly ripe avocado on toasted artisan sourdough.', dietType: 'vegan' },
        ],
        'Main Course': [
            { id: 4, name: 'Grilled Salmon', shortDesc: 'Premium Atlantic salmon with lemon herb butter', price: 740, time: '25min', rating: 4.7, serves: 'Serves 1', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop', description: 'Premium Atlantic salmon grilled to perfection.', dietType: 'non-veg' },
            { id: 5, name: 'Pasta Carbonara', shortDesc: 'Classic creamy Italian pasta with bacon', price: 560, time: '20min', rating: 4.5, serves: 'Serves 2', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=400&fit=crop', description: 'Traditional Italian carbonara with crispy bacon.', dietType: 'non-veg' },
            { id: 6, name: 'Veggie Burger', shortDesc: 'Plant-based patty with fresh veggies', price: 540, time: '18min', rating: 4.3, serves: 'Serves 1', image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&h=400&fit=crop', description: 'Delicious plant-based burger patty.', dietType: 'vegan' },
        ],
        'Drinks': [
            { id: 7, name: 'Fresh Orange Juice', shortDesc: 'Pure freshly squeezed juice from premium oranges', price: 180, time: '5min', rating: 4.8, serves: 'Serves 1', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop', description: 'Pure, freshly squeezed orange juice.', dietType: 'vegan' },
            { id: 8, name: 'Iced Coffee', shortDesc: 'Smooth cold brew from premium arabica beans', price: 140, time: '3min', rating: 4.6, serves: 'Serves 1', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop', description: 'Smooth cold brew coffee served over ice.', dietType: 'veg' },
        ],
        'Desserts': [
            { id: 10, name: 'Chocolate Cake', shortDesc: 'Triple-layer chocolate cake with ganache', price: 300, time: '5min', rating: 4.9, serves: 'Serves 1', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop', description: 'Decadent triple-layer chocolate cake.', dietType: 'veg' },
            { id: 11, name: 'Tiramisu', shortDesc: 'Authentic Italian tiramisu with mascarpone', price: 320, time: '5min', rating: 4.8, serves: 'Serves 1', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=400&fit=crop', description: 'Authentic Italian tiramisu with mascarpone cream.', dietType: 'veg' },
        ]
    };

    const toggleFavorite = (itemId) => {
        setFavorites(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const addToCart = (item) => {
        setCart(prev => {
            const existingItem = prev.find(cartItem => cartItem.id === item.id);
            if (existingItem) {
                return prev.map(cartItem =>
                    cartItem.id === item.id
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                );
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId) => {
        setCart(prev => {
            const existingItem = prev.find(item => item.id === itemId);
            if (existingItem && existingItem.quantity > 1) {
                return prev.map(item =>
                    item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item
                );
            }
            return prev.filter(item => item.id !== itemId);
        });
    };

    const getItemQuantity = (itemId) => {
        const item = cart.find(i => i.id === itemId);
        return item ? item.quantity : 0;
    };

    const handleItemClick = (item) => {
        setSelectedItem(item);
        setShowModal(true);
    };

    const filteredItems = menuItems[selectedCategory].filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const cartTotal = cart.reduce((total, item) => total + item.quantity, 0);
    const cartValue = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Header */}
                <View style={styles.header}>
                    <HamburgerMenu navigation={navigation} activeRoute="Menu" />
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.primaryLight }]}>
                            <Icon name="heart" size={22} color={colors.primary} />
                            {favorites.length > 0 && (
                                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.badgeText}>{favorites.length}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.headerBtn, { backgroundColor: colors.primaryLight }]}
                            onPress={() => navigation.navigate('Cart')}
                        >
                            <Icon name="shopping-cart" size={22} color={colors.primary} />
                            {cartTotal > 0 && (
                                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.badgeText}>{cartTotal}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.heroText}>
                        <Text style={[styles.heroTitle, { color: colors.text }]}>
                            Our <Text style={{ color: colors.primary }}>Delicious</Text>
                        </Text>
                        <Text style={[styles.heroTitle, { color: colors.text }]}>Menu</Text>
                    </View>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop' }}
                        style={styles.heroImage}
                    />
                </View>

                {/* Search Bar */}
                <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Icon name="search" size={18} color={colors.textMuted} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search your favourite food..."
                        placeholderTextColor={colors.textMuted}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>

                {/* Categories */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryScroll}
                >
                    {categories.map((category) => (
                        <TouchableOpacity
                            key={category}
                            style={[
                                styles.categoryBtn,
                                selectedCategory === category
                                    ? { backgroundColor: colors.primary }
                                    : { backgroundColor: colors.card, borderColor: colors.text, borderWidth: 1 }
                            ]}
                            onPress={() => setSelectedCategory(category)}
                        >
                            <Text style={[
                                styles.categoryText,
                                { color: selectedCategory === category ? '#FFFFFF' : colors.text }
                            ]}>
                                {category}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Menu Items */}
                <View style={styles.menuItems}>
                    {filteredItems.map(item => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.menuItem, { backgroundColor: colors.card }]}
                            onPress={() => handleItemClick(item)}
                        >
                            <View style={styles.menuImageContainer}>
                                <Image source={{ uri: item.image }} style={styles.menuImage} />
                            </View>

                            <View style={styles.menuDetails}>
                                <View style={styles.menuHeader}>
                                    <View style={styles.menuTitleRow}>
                                        <Text style={[styles.menuName, { color: colors.text }]}>{item.name}</Text>
                                        <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                                            <Icon
                                                name="heart"
                                                size={18}
                                                color={favorites.includes(item.id) ? colors.primary : colors.textMuted}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={[styles.menuDesc, { color: colors.textMuted }]} numberOfLines={2}>
                                        {item.shortDesc}
                                    </Text>
                                </View>

                                <View style={styles.menuMeta}>
                                    <View style={styles.metaItem}>
                                        <Icon name="star" size={14} color={colors.star} />
                                        <Text style={[styles.metaText, { color: colors.text }]}>{item.rating}</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Icon name="clock" size={14} color={colors.textMuted} />
                                        <Text style={[styles.metaText, { color: colors.textMuted }]}>{item.time}</Text>
                                    </View>
                                    <View style={[styles.servesPill, { backgroundColor: colors.primaryLight }]}>
                                        <Icon name="users" size={12} color={colors.primary} />
                                        <Text style={[styles.servesText, { color: colors.primary }]}>{item.serves}</Text>
                                    </View>
                                </View>

                                <View style={styles.menuFooter}>
                                    <Text style={[styles.menuPrice, { color: colors.primary }]}>₹{item.price}</Text>

                                    {getItemQuantity(item.id) === 0 ? (
                                        <TouchableOpacity
                                            style={[styles.addBtn, { backgroundColor: colors.primary }]}
                                            onPress={() => addToCart(item)}
                                        >
                                            <Icon name="plus" size={20} color="#FFFFFF" />
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={[styles.qtyStepper, { backgroundColor: colors.primaryLight }]}>
                                            <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                                                <Icon name="minus" size={16} color={colors.primary} />
                                            </TouchableOpacity>
                                            <Text style={[styles.qtyText, { color: colors.text }]}>{getItemQuantity(item.id)}</Text>
                                            <TouchableOpacity onPress={() => addToCart(item)}>
                                                <Icon name="plus" size={16} color={colors.primary} />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Cart Indicator */}
            {cartTotal > 0 && !showModal && (
                <TouchableOpacity
                    style={[styles.cartGlow, { backgroundColor: colors.primary }]}
                    onPress={() => navigation.navigate('Cart')}
                >
                    <View style={styles.cartGlowContent}>
                        <View style={styles.cartGlowBadge}>
                            <Icon name="shopping-cart" size={16} color="#FFFFFF" />
                            <View style={styles.cartGlowCount}>
                                <Text style={styles.cartGlowCountText}>{cartTotal}</Text>
                            </View>
                        </View>
                        <View style={styles.cartGlowDetails}>
                            <Text style={styles.cartGlowLabel}>Your Order</Text>
                            <Text style={styles.cartGlowTotal}>₹{cartValue}</Text>
                        </View>
                        <View style={styles.cartGlowCta}>
                            <Text style={styles.cartGlowCtaText}>View Cart</Text>
                            <View style={styles.cartGlowCtaIcon}>
                                <Icon name="arrow-right" size={16} color="#FFFFFF" />
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            )}

            {/* Item Modal */}
            <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
                {selectedItem && (
                    <View style={styles.modalOverlay}>
                        <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowModal(false)} />
                        <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
                            <View style={styles.modalDragBar} />
                            <TouchableOpacity
                                style={[styles.modalCloseBtn, { backgroundColor: colors.primaryLight }]}
                                onPress={() => setShowModal(false)}
                            >
                                <Icon name="x" size={18} color={colors.primary} />
                            </TouchableOpacity>

                            <View style={styles.modalImageFrame}>
                                <Image source={{ uri: selectedItem.image }} style={styles.modalImage} />
                                <TouchableOpacity
                                    style={[styles.modalFavBtn, { backgroundColor: colors.primaryLight }]}
                                    onPress={() => toggleFavorite(selectedItem.id)}
                                >
                                    <Icon
                                        name="heart"
                                        size={20}
                                        color={colors.primary}
                                    />
                                </TouchableOpacity>
                                <View style={[styles.modalRatingPill, { backgroundColor: colors.card }]}>
                                    <Icon name="star" size={12} color={colors.star} />
                                    <Text style={[styles.modalRatingText, { color: colors.text }]}>{selectedItem.rating}</Text>
                                </View>
                            </View>

                            <View style={styles.modalInfo}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedItem.name}</Text>
                                <View style={styles.modalMeta}>
                                    <View style={[styles.modalTag, { backgroundColor: colors.primaryLight }]}>
                                        <Icon name="clock" size={12} color={colors.primary} />
                                        <Text style={[styles.modalTagText, { color: colors.primary }]}>{selectedItem.time}</Text>
                                    </View>
                                    <View style={[styles.modalTag, { backgroundColor: colors.primaryLight }]}>
                                        <Icon name="users" size={12} color={colors.primary} />
                                        <Text style={[styles.modalTagText, { color: colors.primary }]}>{selectedItem.serves}</Text>
                                    </View>
                                    <View style={[
                                        styles.modalTag,
                                        { backgroundColor: selectedItem.dietType === 'veg' || selectedItem.dietType === 'vegan' ? '#E8F5E9' : '#FFEBEE' }
                                    ]}>
                                        <Text style={[
                                            styles.modalTagText,
                                            { color: selectedItem.dietType === 'veg' || selectedItem.dietType === 'vegan' ? '#4CAF50' : '#F44336' }
                                        ]}>
                                            {selectedItem.dietType === 'vegan' ? 'Vegan' : selectedItem.dietType === 'veg' ? 'Veg' : 'Non-Veg'}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>{selectedItem.description}</Text>

                                <View style={styles.modalFooter}>
                                    <Text style={[styles.modalPrice, { color: colors.primary }]}>₹{selectedItem.price}</Text>

                                    {getItemQuantity(selectedItem.id) === 0 ? (
                                        <TouchableOpacity
                                            style={[styles.modalAddBtn, { backgroundColor: colors.primary }]}
                                            onPress={() => { addToCart(selectedItem); setShowModal(false); }}
                                        >
                                            <Text style={styles.modalAddText}>Add to Order</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={[styles.modalQtyStepper, { backgroundColor: colors.primaryLight }]}>
                                            <TouchableOpacity style={styles.stepperBtn} onPress={() => removeFromCart(selectedItem.id)}>
                                                <Icon name="minus" size={18} color={colors.primary} />
                                            </TouchableOpacity>
                                            <Text style={[styles.stepperCount, { color: colors.text }]}>{getItemQuantity(selectedItem.id)}</Text>
                                            <TouchableOpacity style={styles.stepperBtn} onPress={() => addToCart(selectedItem)}>
                                                <Icon name="plus" size={18} color={colors.primary} />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </Modal>
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
    hamburger: { gap: 4, padding: 8 },
    hamburgerLine: { width: 20, height: 2.5, borderRadius: 2 },
    headerRight: { flexDirection: 'row', gap: 12 },
    headerBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },

    // Hero
    heroSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    heroText: {},
    heroTitle: { fontSize: 26, fontWeight: '800', lineHeight: 34 },
    heroImage: { width: 80, height: 80, borderRadius: 40 },

    // Search
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 14,
        gap: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    searchInput: { flex: 1, fontSize: 14 },

    // Categories
    categoryScroll: { paddingHorizontal: 20, gap: 10, marginBottom: 20 },
    categoryBtn: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
    },
    categoryText: { fontSize: 13, fontWeight: '600' },

    // Menu Items
    menuItems: { paddingHorizontal: 20, gap: 16 },
    menuItem: {
        flexDirection: 'row',
        borderRadius: 16,
        overflow: 'hidden',
    },
    menuImageContainer: { width: 100 },
    menuImage: { width: 100, height: 120 },
    menuDetails: { flex: 1, padding: 12, justifyContent: 'space-between' },
    menuHeader: {},
    menuTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    menuName: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
    menuDesc: { fontSize: 12, marginTop: 4, lineHeight: 16 },
    menuMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, fontWeight: '500' },
    servesPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    servesText: { fontSize: 11, fontWeight: '600' },
    menuFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    menuPrice: { fontSize: 18, fontWeight: '800' },
    addBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    qtyStepper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    qtyText: { fontSize: 14, fontWeight: '700' },

    // Cart Glow
    cartGlow: {
        position: 'absolute',
        bottom: 16,
        left: 20,
        right: 20,
        borderRadius: 20,
    },
    cartGlowContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    cartGlowBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    cartGlowCount: {
        position: 'absolute',
        top: -8,
        right: -12,
        backgroundColor: '#FFFFFF',
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cartGlowCountText: { fontSize: 10, fontWeight: '800', color: '#8B3A1E' },
    cartGlowDetails: { flex: 1, marginLeft: 16 },
    cartGlowLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '500' },
    cartGlowTotal: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
    cartGlowCta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cartGlowCtaText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    cartGlowCtaIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center'
    },

    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalSheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '80%',
        paddingBottom: 40,
    },
    modalDragBar: {
        width: 40,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    modalCloseBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    modalImageFrame: { position: 'relative', alignItems: 'center', paddingHorizontal: 20 },
    modalImage: { width: width - 80, height: 180, borderRadius: 20 },
    modalFavBtn: {
        position: 'absolute',
        bottom: 16,
        right: 36,
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalRatingPill: {
        position: 'absolute',
        bottom: 16,
        left: 36,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    modalRatingText: { fontSize: 13, fontWeight: '700' },
    modalInfo: { padding: 24 },
    modalTitle: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
    modalMeta: { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
    modalTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    modalTagText: { fontSize: 12, fontWeight: '600' },
    modalDesc: { fontSize: 14, lineHeight: 22, marginBottom: 24 },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalPrice: { fontSize: 28, fontWeight: '900' },
    modalAddBtn: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
    },
    modalAddText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    modalQtyStepper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
        gap: 16,
    },
    stepperBtn: { padding: 4 },
    stepperCount: { fontSize: 18, fontWeight: '800' },
});

export default MenuScreen;
