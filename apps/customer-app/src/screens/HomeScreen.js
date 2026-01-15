import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Image,
    Dimensions,
    Modal,
    StatusBar,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import { spacing, shadows } from '../theme';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { selectedAddress, getCurrentLocation } = useLocation();
    const colors = theme.colors;

    const [searchTerm, setSearchTerm] = useState('');
    const [favorites, setFavorites] = useState([]);
    const [cart, setCart] = useState([]);
    const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [activeFilter, setActiveFilter] = useState('popular');
    const scrollRef = useRef(null);

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

    // Filters
    const filters = [
        { id: 'popular', label: 'Popular this week' },
        { id: 'all', label: 'Most selling' },
        { id: 'expensive', label: 'Most expensive' },
        { id: 'budget', label: 'Under ₹200' },
    ];

    // Featured Offers (Discounts)
    const featuredOffers = [
        { id: 'featured1', name: 'Sushi Pack', price: 299, time: '15 min', rating: 4.8, discount: '20% OFF', subtitle: 'Special sushi selection', serves: 'Serves 1-2', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=400&fit=crop', description: 'A curated selection of premium seafood sushi.' },
        { id: 'featured2', name: 'Salmon Platter', price: 399, time: '15 min', rating: 4.8, discount: '20% OFF', subtitle: 'Premium grilled salmon', serves: 'Serves 1', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=400&fit=crop', description: 'Atlantic salmon grilled to perfection.' },
        { id: 'featured3', name: 'California Rolls', price: 249, time: '12 min', rating: 4.7, discount: '20% OFF', subtitle: 'Classic rolls', serves: 'Serves 1', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=400&fit=crop', description: 'Classic California rolls with avocado.' },
    ];

    // Popular Items
    const popularItems = [
        { id: 'popular1', name: 'Margherita', price: 168, time: '25min', rating: 4.9, serves: 'Serves 2', desc: 'cheese layers 🧀', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=300&fit=crop', description: 'Classic Italian pizza with fresh mozzarella.' },
        { id: 'popular2', name: 'Tikka Masala', price: 198, time: '30min', rating: 4.8, serves: 'Serves 1', desc: 'spicy layers 🌶️', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=300&fit=crop', description: 'Authentic Indian curry with tender chicken.' },
        { id: 'popular3', name: 'Lava Cake', price: 568, time: '15min', rating: 4.9, serves: 'Serves 1', desc: 'chocolate 🍫', image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=300&h=300&fit=crop', description: 'Warm chocolate cake with molten center.' },
        { id: 'popular4', name: 'Caesar Salad', price: 120, time: '10min', rating: 4.7, serves: 'Serves 1', desc: 'fresh greens 🥗', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=300&fit=crop', description: 'Fresh romaine with Caesar dressing.' },
    ];

    // Recent Orders
    const recentOrders = [
        { id: 'recent1', name: 'Pepperoni Pizza', price: 148, time: '20min', rating: 4.6, orderDate: '2 days ago', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=300&fit=crop', serves: 'Serves 2', description: 'Signature pepperoni pizza.' },
        { id: 'recent2', name: 'Grilled Salmon', price: 228, time: '25min', rating: 4.8, orderDate: '1 week ago', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&h=300&fit=crop', serves: 'Serves 1', description: 'Fresh grilled salmon fillet.' },
        { id: 'recent3', name: 'Vegan Burger', price: 138, time: '20min', rating: 4.5, orderDate: '1 week ago', image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=300&h=300&fit=crop', serves: 'Serves 1', description: 'Plant-based burger patty.' },
    ];

    const getFilteredItems = () => {
        switch (activeFilter) {
            case 'popular':
                return [...popularItems].sort((a, b) => b.rating - a.rating);
            case 'expensive':
                return [...popularItems].sort((a, b) => b.price - a.price);
            case 'budget':
                return popularItems.filter(item => item.price < 200);
            default:
                return popularItems;
        }
    };

    const filteredItems = getFilteredItems();

    const handleScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const cardWidth = width - 80;
        const index = Math.round(scrollPosition / cardWidth);
        setCurrentOfferIndex(Math.min(index, featuredOffers.length - 1));
    };

    const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.background }]}>
                    <View style={styles.headerRow}>
                        <View style={styles.headerLeft}>
                            <TouchableOpacity style={styles.hamburger}>
                                <View style={[styles.hamburgerLine, { backgroundColor: colors.primary }]} />
                                <View style={[styles.hamburgerLine, { backgroundColor: colors.primary, width: 16 }]} />
                                <View style={[styles.hamburgerLine, { backgroundColor: colors.primary }]} />
                            </TouchableOpacity>
                            <Text style={[styles.brandName, { color: colors.primary }]}>Delish</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.headerIconBtn, { backgroundColor: colors.primaryLight }]}
                            onPress={() => { }}
                        >
                            <Icon name="heart" size={22} color={colors.primary} />
                            {favorites.length > 0 && (
                                <View style={[styles.headerBadge, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.headerBadgeText}>{favorites.length}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.heroText}>
                        <Text style={[styles.heroTitle, { color: colors.text }]}>
                            Find Your <Text style={{ color: colors.primary }}>Best</Text>
                        </Text>
                        <Text style={[styles.heroTitle, { color: colors.text }]}>Food Around You</Text>
                    </View>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop' }}
                        style={styles.heroImage}
                    />
                </View>

                {/* Deliver To Bar (Only this is different from web) */}
                <TouchableOpacity
                    style={[styles.deliverBar, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => navigation.navigate('Address')}
                >
                    <View style={[styles.deliverIcon, { backgroundColor: colors.primaryLight }]}>
                        <Icon name="map-pin" size={16} color={colors.primary} />
                    </View>
                    <View style={styles.deliverInfo}>
                        <Text style={[styles.deliverLabel, { color: colors.textMuted }]}>Deliver to</Text>
                        <Text style={[styles.deliverText, { color: colors.text }]} numberOfLines={1}>
                            {selectedAddress?.label || 'Select Address'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.gpsBtn, { backgroundColor: colors.primaryLight }]}
                        onPress={getCurrentLocation}
                    >
                        <Icon name="navigation" size={14} color={colors.primary} />
                    </TouchableOpacity>
                    <Icon name="chevron-down" size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Search Bar */}
                <TouchableOpacity
                    style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => navigation.navigate('Menu')}
                >
                    <Icon name="search" size={18} color={colors.textMuted} />
                    <Text style={[styles.searchPlaceholder, { color: colors.textMuted }]}>
                        Search your favourite food
                    </Text>
                </TouchableOpacity>

                {/* Categories Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoryScroll}
                    >
                        {filters.map((filter) => (
                            <TouchableOpacity
                                key={filter.id}
                                style={[
                                    styles.categoryPill,
                                    activeFilter === filter.id
                                        ? { backgroundColor: colors.primary }
                                        : { backgroundColor: colors.card, borderColor: colors.text, borderWidth: 1 }
                                ]}
                                onPress={() => setActiveFilter(filter.id)}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    { color: activeFilter === filter.id ? '#FFFFFF' : colors.text }
                                ]}>
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Popular Items Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            {filters.find(f => f.id === activeFilter)?.label || 'Popular this week'}
                        </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
                            <View style={styles.viewAllBtn}>
                                <Text style={[styles.viewAllText, { color: colors.primary }]}>View all</Text>
                                <View style={[styles.arrowSquare, { backgroundColor: colors.primary }]}>
                                    <Icon name="arrow-right" size={12} color="#FFFFFF" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Food Grid - 2 columns */}
                    <View style={styles.foodGrid}>
                        {filteredItems.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.foodCard, { backgroundColor: colors.card }]}
                                onPress={() => handleItemClick(item)}
                            >
                                <View style={styles.foodImageContainer}>
                                    <Image source={{ uri: item.image }} style={styles.foodImage} />
                                    <TouchableOpacity
                                        style={[
                                            styles.favBtn,
                                            { backgroundColor: favorites.includes(item.id) ? colors.primary : 'rgba(255,255,255,0.9)' }
                                        ]}
                                        onPress={() => toggleFavorite(item.id)}
                                    >
                                        <Icon
                                            name="heart"
                                            size={12}
                                            color={favorites.includes(item.id) ? '#FFFFFF' : colors.primary}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <Text style={[styles.foodName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                                <View style={styles.foodMeta}>
                                    <View style={styles.foodMetaItem}>
                                        <Icon name="clock" size={10} color={colors.textMuted} />
                                        <Text style={[styles.foodMetaText, { color: colors.textMuted }]}>{item.time}</Text>
                                    </View>
                                    <View style={styles.foodMetaItem}>
                                        <Icon name="star" size={10} color={colors.star} />
                                        <Text style={[styles.foodMetaText, { color: colors.text }]}>{item.rating}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.foodPrice, { color: colors.primary }]}>₹{item.price}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Discounts Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Discounts for you</Text>
                        <TouchableOpacity>
                            <View style={styles.viewAllBtn}>
                                <Text style={[styles.viewAllText, { color: colors.primary }]}>View all</Text>
                                <View style={[styles.arrowSquare, { backgroundColor: colors.primary }]}>
                                    <Icon name="arrow-right" size={12} color="#FFFFFF" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Discount Cards Horizontal Scroll */}
                    <ScrollView
                        ref={scrollRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        contentContainerStyle={styles.discountScroll}
                    >
                        {featuredOffers.map((offer) => (
                            <TouchableOpacity
                                key={offer.id}
                                style={[styles.discountCard, { backgroundColor: colors.card }]}
                                onPress={() => handleItemClick(offer)}
                            >
                                <View style={styles.discountImageContainer}>
                                    <Image source={{ uri: offer.image }} style={styles.discountImage} />
                                    <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
                                        <Text style={styles.discountBadgeValue}>{offer.discount.split(' ')[0]}</Text>
                                        <Text style={styles.discountBadgeOff}>{offer.discount.split(' ')[1]}</Text>
                                    </View>
                                </View>
                                <View style={styles.discountInfo}>
                                    <Text style={[styles.discountName, { color: colors.text }]}>{offer.name}</Text>
                                    <View style={styles.discountMeta}>
                                        <View style={styles.discountMetaItem}>
                                            <Icon name="clock" size={12} color={colors.textMuted} />
                                            <Text style={[styles.discountMetaText, { color: colors.textMuted }]}>{offer.time}</Text>
                                        </View>
                                        <View style={styles.discountMetaItem}>
                                            <Icon name="star" size={12} color={colors.star} />
                                            <Text style={[styles.discountMetaText, { color: colors.text }]}>{offer.rating}</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.discountPrice, { color: colors.primary }]}>₹{offer.price}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Pagination Dots */}
                    <View style={styles.dotsContainer}>
                        {featuredOffers.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    { backgroundColor: currentOfferIndex === index ? colors.primary : colors.border },
                                    currentOfferIndex === index && styles.dotActive
                                ]}
                            />
                        ))}
                    </View>
                </View>

                {/* Recent Orders Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Orders</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
                            <View style={styles.viewAllBtn}>
                                <Text style={[styles.viewAllText, { color: colors.primary }]}>View all</Text>
                                <View style={[styles.arrowSquare, { backgroundColor: colors.primary }]}>
                                    <Icon name="arrow-right" size={12} color="#FFFFFF" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Recent Items List */}
                    <View style={styles.recentList}>
                        {recentOrders.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.recentItem, { backgroundColor: colors.card }]}
                                onPress={() => handleItemClick(item)}
                            >
                                <Image source={{ uri: item.image }} style={styles.recentImage} />
                                <View style={styles.recentInfo}>
                                    <Text style={[styles.recentName, { color: colors.text }]}>{item.name}</Text>
                                    <View style={styles.recentMeta}>
                                        <Text style={[styles.recentTime, { color: colors.textMuted }]}>{item.time}</Text>
                                        <View style={styles.recentRating}>
                                            <Icon name="star" size={10} color={colors.star} />
                                            <Text style={[styles.recentRatingText, { color: colors.text }]}>{item.rating}</Text>
                                        </View>
                                    </View>
                                </View>
                                <Text style={[styles.recentPrice, { color: colors.primary }]}>₹{item.price}</Text>

                                {getItemQuantity(item.id) === 0 ? (
                                    <TouchableOpacity
                                        style={[styles.reorderBtn, { backgroundColor: colors.primary }]}
                                        onPress={() => addToCart(item)}
                                    >
                                        <Icon name="plus" size={16} color="#FFFFFF" />
                                    </TouchableOpacity>
                                ) : (
                                    <View style={[styles.qtyStepper, { backgroundColor: colors.primaryLight }]}>
                                        <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                                            <Icon name="minus" size={14} color={colors.primary} />
                                        </TouchableOpacity>
                                        <Text style={[styles.qtyText, { color: colors.text }]}>{getItemQuantity(item.id)}</Text>
                                        <TouchableOpacity onPress={() => addToCart(item)}>
                                            <Icon name="plus" size={14} color={colors.primary} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Frosted Glow Cart Indicator */}
            {totalCartItems > 0 && !showModal && (
                <TouchableOpacity
                    style={[styles.cartGlow, { backgroundColor: colors.primary }]}
                    onPress={() => navigation.navigate('Cart')}
                >
                    <View style={styles.cartGlowContent}>
                        <View style={styles.cartGlowBadge}>
                            <Icon name="shopping-cart" size={16} color="#FFFFFF" />
                            <View style={styles.cartGlowCount}>
                                <Text style={styles.cartGlowCountText}>{totalCartItems > 9 ? '9+' : totalCartItems}</Text>
                            </View>
                        </View>
                        <View style={styles.cartGlowDetails}>
                            <Text style={styles.cartGlowLabel}>Your Order</Text>
                            <Text style={styles.cartGlowTotal}>₹{cartTotal}</Text>
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
                                    {selectedItem.serves && (
                                        <View style={[styles.modalTag, { backgroundColor: colors.primaryLight }]}>
                                            <Icon name="users" size={12} color={colors.primary} />
                                            <Text style={[styles.modalTagText, { color: colors.primary }]}>{selectedItem.serves}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>{selectedItem.description}</Text>

                                <View style={styles.modalFooter}>
                                    <Text style={[styles.modalPrice, { color: colors.primary }]}>₹{selectedItem.price}</Text>
                                    <TouchableOpacity
                                        style={[styles.modalAddBtn, { backgroundColor: colors.primary }]}
                                        onPress={() => { addToCart(selectedItem); setShowModal(false); }}
                                    >
                                        <Icon name="shopping-bag" size={18} color="#FFFFFF" />
                                        <Text style={styles.modalAddText}>Add to Cart</Text>
                                    </TouchableOpacity>
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
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 16,
        paddingBottom: 12,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    hamburger: { gap: 4, padding: 8 },
    hamburgerLine: { width: 20, height: 2.5, borderRadius: 2 },
    brandName: { fontSize: 20, fontWeight: '800', letterSpacing: 1 },
    headerIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    headerBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },

    // Hero
    heroSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    heroText: {},
    heroTitle: { fontSize: 26, fontWeight: '800', lineHeight: 34 },
    heroImage: { width: 100, height: 100, borderRadius: 50 },

    // Deliver Bar
    deliverBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
    },
    deliverIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    deliverInfo: { flex: 1 },
    deliverLabel: { fontSize: 11, marginBottom: 2 },
    deliverText: { fontSize: 14, fontWeight: '600' },
    gpsBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },

    // Search
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 14,
        gap: 12,
        borderWidth: 1,
        marginBottom: 20,
    },
    searchPlaceholder: { fontSize: 14 },

    // Section
    section: { marginBottom: 24 },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 14,
    },
    sectionTitle: { fontSize: 18, fontWeight: '700' },
    viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    viewAllText: { fontSize: 13, fontWeight: '600' },
    arrowSquare: {
        width: 22,
        height: 22,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center'
    },

    // Categories
    categoryScroll: { paddingHorizontal: 20, gap: 10 },
    categoryPill: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 25,
    },
    categoryText: { fontSize: 12, fontWeight: '600' },

    // Food Grid
    foodGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        gap: 12,
    },
    foodCard: {
        width: (width - 52) / 2,
        borderRadius: 16,
        overflow: 'hidden',
        paddingBottom: 14,
    },
    foodImageContainer: { position: 'relative' },
    foodImage: { width: '100%', height: 110 },
    favBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    foodName: { fontSize: 14, fontWeight: '700', paddingHorizontal: 12, marginTop: 10 },
    foodMeta: { flexDirection: 'row', gap: 12, paddingHorizontal: 12, marginTop: 6 },
    foodMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    foodMetaText: { fontSize: 11 },
    foodPrice: { fontSize: 16, fontWeight: '800', paddingHorizontal: 12, marginTop: 8 },

    // Discounts
    discountScroll: { paddingHorizontal: 20, gap: 16 },
    discountCard: {
        width: width - 60,
        borderRadius: 16,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    discountImageContainer: { position: 'relative', width: 110 },
    discountImage: { width: 110, height: 110 },
    discountBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignItems: 'center',
    },
    discountBadgeValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
    discountBadgeOff: { color: '#FFFFFF', fontSize: 8, fontWeight: '600' },
    discountInfo: { flex: 1, padding: 12, justifyContent: 'center' },
    discountName: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
    discountMeta: { flexDirection: 'row', gap: 14, marginBottom: 8 },
    discountMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    discountMetaText: { fontSize: 12 },
    discountPrice: { fontSize: 18, fontWeight: '800' },

    // Dots
    dotsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 16 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    dotActive: { width: 24 },

    // Recent Orders
    recentList: { paddingHorizontal: 20, gap: 12 },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 12,
    },
    recentImage: { width: 56, height: 56, borderRadius: 12 },
    recentInfo: { flex: 1, marginLeft: 12 },
    recentName: { fontSize: 14, fontWeight: '700' },
    recentMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
    recentTime: { fontSize: 12 },
    recentRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    recentRatingText: { fontSize: 12, fontWeight: '600' },
    recentPrice: { fontSize: 16, fontWeight: '800', marginRight: 12 },
    reorderBtn: {
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
        overflow: 'hidden',
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
    modalMeta: { flexDirection: 'row', gap: 10, marginBottom: 16 },
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
    },
    modalAddText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

export default HomeScreen;
