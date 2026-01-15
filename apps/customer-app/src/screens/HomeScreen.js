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
import BottomNavBar from '../components/BottomNavBar';

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
    const [activeCategory, setActiveCategory] = useState('All');
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

    const handleItemClick = (item) => {
        setSelectedItem(item);
        setShowModal(true);
    };

    // Categories
    const categories = ['All', 'Pizza', 'Burger', 'Chinese', 'Indian', 'Desserts'];

    // Featured Offers
    const featuredOffers = [
        { id: 'featured1', name: 'Special Pizza', price: 299, time: '20min', rating: 4.5, discount: '20%', subtitle: 'Premium Margherita', serves: 'Serves 2-3', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop', description: 'Delicious special pizza with authentic Italian flavors.' },
        { id: 'featured2', name: 'Burger Combo', price: 199, time: '15min', rating: 4.8, discount: '30%', subtitle: 'With Fries & Drink', serves: 'Serves 1', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop', description: 'Juicy beef burger with crispy fries.' },
        { id: 'featured3', name: 'Pasta Special', price: 249, time: '25min', rating: 4.6, discount: 'B1G1', subtitle: 'Creamy Alfredo', serves: 'Serves 1-2', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop', description: 'Creamy pasta with rich sauce.' },
    ];

    // Popular Items
    const popularItems = [
        { id: 'popular1', name: 'Classic Margherita', price: 249, time: '25min', rating: 4.9, serves: 'Serves 2', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop', description: 'Traditional Italian pizza.' },
        { id: 'popular2', name: 'Butter Chicken', price: 329, time: '30min', rating: 4.8, serves: 'Serves 1', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop', description: 'Tender chicken in creamy curry.' },
        { id: 'popular3', name: 'Chocolate Lava', price: 149, time: '15min', rating: 4.9, serves: 'Serves 1', image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=400&fit=crop', description: 'Decadent chocolate cake.' },
        { id: 'popular4', name: 'Veg Biryani', price: 199, time: '35min', rating: 4.7, serves: 'Serves 2', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=400&fit=crop', description: 'Aromatic basmati rice with spices.' },
    ];

    const handleScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / (width - 48));
        setCurrentOfferIndex(index);
    };

    const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity style={styles.menuIcon}>
                            <View style={[styles.hamburger, { backgroundColor: colors.primary }]} />
                            <View style={[styles.hamburger, { backgroundColor: colors.primary }]} />
                            <View style={[styles.hamburger, { backgroundColor: colors.primary }]} />
                        </TouchableOpacity>

                        <View style={styles.headerRight}>
                            <TouchableOpacity
                                style={[styles.iconBtn, { backgroundColor: colors.primaryLight }]}
                                onPress={() => navigation.navigate('Cart')}
                            >
                                <Icon name="heart" size={20} color={colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.iconBtn, { backgroundColor: colors.primaryLight }]}
                                onPress={() => navigation.navigate('Cart')}
                            >
                                <Icon name="shopping-bag" size={20} color={colors.primary} />
                                {totalCartItems > 0 && (
                                    <View style={[styles.cartBadge, { backgroundColor: colors.primary }]}>
                                        <Text style={styles.cartBadgeText}>{totalCartItems}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Location Bar */}
                    <TouchableOpacity
                        style={[styles.locationBar, { backgroundColor: colors.card, borderColor: colors.border }, shadows.sm]}
                        onPress={() => navigation.navigate('Address')}
                    >
                        <View style={[styles.locationIcon, { backgroundColor: colors.primaryLight }]}>
                            <Icon name="map-pin" size={16} color={colors.primary} />
                        </View>
                        <View style={styles.locationInfo}>
                            <Text style={[styles.locationLabel, { color: colors.textMuted }]}>Deliver to</Text>
                            <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
                                {selectedAddress?.label || 'Select Address'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.gpsBtn, { backgroundColor: colors.primaryLight }]}
                            onPress={getCurrentLocation}
                        >
                            <Icon name="navigation" size={14} color={colors.primary} />
                        </TouchableOpacity>
                    </TouchableOpacity>

                    {/* Search Bar */}
                    <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }, shadows.sm]}>
                        <Icon name="search" size={20} color={colors.textMuted} />
                        <TextInput
                            placeholder="Search dishes, cuisines..."
                            placeholderTextColor={colors.textMuted}
                            style={[styles.searchInput, { color: colors.text }]}
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />
                        <TouchableOpacity style={[styles.filterBtn, { backgroundColor: colors.primary }]}>
                            <Icon name="sliders" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Categories */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesScroll}
                >
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryPill,
                                activeCategory === cat
                                    ? { backgroundColor: colors.primary }
                                    : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }
                            ]}
                            onPress={() => setActiveCategory(cat)}
                        >
                            <Text style={[
                                styles.categoryText,
                                { color: activeCategory === cat ? '#FFFFFF' : colors.text }
                            ]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Discount Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Special Offers</Text>
                    <TouchableOpacity>
                        <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
                    </TouchableOpacity>
                </View>

                {/* Featured Offers Carousel */}
                <ScrollView
                    ref={scrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={styles.featuredScroll}
                >
                    {featuredOffers.map((offer) => (
                        <TouchableOpacity
                            key={offer.id}
                            style={[styles.discountCard, { backgroundColor: colors.card }, shadows.md]}
                            onPress={() => handleItemClick(offer)}
                        >
                            {/* Discount Badge */}
                            <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
                                <Text style={styles.discountBadgeText}>{offer.discount}</Text>
                                <Text style={styles.discountOffText}>OFF</Text>
                            </View>

                            <Image source={{ uri: offer.image }} style={styles.discountImage} />

                            <View style={styles.discountInfo}>
                                <Text style={[styles.discountName, { color: colors.text }]} numberOfLines={1}>
                                    {offer.name}
                                </Text>
                                <Text style={[styles.discountSubtitle, { color: colors.textMuted }]}>
                                    {offer.subtitle}
                                </Text>
                                <View style={styles.discountMeta}>
                                    <View style={styles.metaItem}>
                                        <Icon name="clock" size={12} color={colors.textMuted} />
                                        <Text style={[styles.metaText, { color: colors.textMuted }]}>{offer.time}</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Icon name="star" size={12} color={colors.star} />
                                        <Text style={[styles.metaText, { color: colors.text }]}>{offer.rating}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.discountPrice, { color: colors.primary }]}>₹{offer.price}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Dots */}
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

                {/* Popular Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Most Popular</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
                        <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
                    </TouchableOpacity>
                </View>

                {/* Popular Items Grid */}
                <View style={styles.popularGrid}>
                    {popularItems.map(item => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.popularCard, { backgroundColor: colors.card }, shadows.sm]}
                            onPress={() => handleItemClick(item)}
                        >
                            <View style={styles.popularImageContainer}>
                                <Image source={{ uri: item.image }} style={styles.popularImage} />
                                <TouchableOpacity
                                    style={[styles.heartBtn, { backgroundColor: favorites.includes(item.id) ? colors.primary : 'rgba(255,255,255,0.9)' }]}
                                    onPress={() => toggleFavorite(item.id)}
                                >
                                    <Icon name="heart" size={14} color={favorites.includes(item.id) ? '#FFFFFF' : colors.navInactive} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.popularInfo}>
                                <Text style={[styles.popularName, { color: colors.text }]} numberOfLines={1}>
                                    {item.name}
                                </Text>
                                <View style={styles.popularMeta}>
                                    <View style={styles.metaItem}>
                                        <Icon name="clock" size={10} color={colors.textMuted} />
                                        <Text style={[styles.smallMetaText, { color: colors.textMuted }]}>{item.time}</Text>
                                    </View>
                                    <View style={styles.ratingBadge}>
                                        <Icon name="star" size={10} color={colors.star} />
                                        <Text style={[styles.smallMetaText, { color: colors.text }]}>{item.rating}</Text>
                                    </View>
                                </View>
                                <View style={styles.priceRow}>
                                    <Text style={[styles.popularPrice, { color: colors.primary }]}>₹{item.price}</Text>
                                    <TouchableOpacity
                                        style={[styles.addBtn, { backgroundColor: colors.primary }]}
                                        onPress={() => addToCart(item)}
                                    >
                                        <Icon name="plus" size={14} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Cart Indicator */}
            {totalCartItems > 0 && (
                <TouchableOpacity
                    style={[styles.cartIndicator, { backgroundColor: colors.primary }, shadows.burgundy]}
                    onPress={() => navigation.navigate('Cart')}
                >
                    <Icon name="shopping-bag" size={20} color="#FFFFFF" />
                    <Text style={styles.cartIndicatorText}>{totalCartItems} items • View Cart</Text>
                    <Icon name="arrow-right" size={18} color="#FFFFFF" />
                </TouchableOpacity>
            )}

            {/* Item Modal */}
            <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
                {selectedItem && (
                    <View style={styles.modalOverlay}>
                        <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowModal(false)} />
                        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                            <View style={styles.modalDragBar} />
                            <TouchableOpacity
                                style={[styles.modalCloseBtn, { backgroundColor: colors.primaryLight }]}
                                onPress={() => setShowModal(false)}
                            >
                                <Icon name="x" size={20} color={colors.primary} />
                            </TouchableOpacity>

                            <Image source={{ uri: selectedItem.image }} style={styles.modalImage} />

                            <View style={styles.modalInfo}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedItem.name}</Text>
                                <View style={styles.modalMeta}>
                                    <View style={[styles.modalTag, { backgroundColor: colors.primaryLight }]}>
                                        <Icon name="clock" size={12} color={colors.primary} />
                                        <Text style={[styles.modalTagText, { color: colors.primary }]}>{selectedItem.time}</Text>
                                    </View>
                                    <View style={[styles.modalTag, { backgroundColor: colors.primaryLight }]}>
                                        <Icon name="star" size={12} color={colors.primary} />
                                        <Text style={[styles.modalTagText, { color: colors.primary }]}>{selectedItem.rating}</Text>
                                    </View>
                                    <View style={[styles.modalTag, { backgroundColor: colors.primaryLight }]}>
                                        <Icon name="users" size={12} color={colors.primary} />
                                        <Text style={[styles.modalTagText, { color: colors.primary }]}>{selectedItem.serves}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>{selectedItem.description}</Text>

                                <View style={styles.modalFooter}>
                                    <Text style={[styles.modalPrice, { color: colors.primary }]}>₹{selectedItem.price}</Text>
                                    <TouchableOpacity
                                        style={[styles.modalAddBtn, { backgroundColor: colors.primary }, shadows.burgundy]}
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

            {/* Bottom Navigation */}
            <BottomNavBar navigation={navigation} activeRoute="Home" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: {
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    menuIcon: { gap: 5, padding: 8 },
    hamburger: { width: 22, height: 2.5, borderRadius: 2 },
    headerRight: { flexDirection: 'row', gap: 10 },
    iconBtn: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    cartBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cartBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },

    // Location
    locationBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
    },
    locationIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    locationInfo: { flex: 1 },
    locationLabel: { fontSize: 11, marginBottom: 2, fontWeight: '500' },
    locationText: { fontSize: 14, fontWeight: '600' },
    gpsBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Search
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 14,
        gap: 12,
        borderWidth: 1,
    },
    searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
    filterBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },

    // Categories
    categoriesScroll: {
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 24,
    },
    categoryPill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
    },
    categoryText: { fontSize: 13, fontWeight: '600' },

    // Section Header
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16
    },
    sectionTitle: { fontSize: 18, fontWeight: '700' },
    seeAll: { fontSize: 13, fontWeight: '600' },

    // Featured/Discount Cards
    featuredScroll: { paddingHorizontal: 20, gap: 16 },
    discountCard: {
        width: width - 60,
        borderRadius: 20,
        overflow: 'hidden',
        flexDirection: 'row',
        padding: 12,
    },
    discountBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        zIndex: 10,
        alignItems: 'center',
    },
    discountBadgeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
    discountOffText: { color: '#FFFFFF', fontSize: 9, fontWeight: '600' },
    discountImage: {
        width: 110,
        height: 110,
        borderRadius: 16,
    },
    discountInfo: {
        flex: 1,
        paddingLeft: 14,
        justifyContent: 'space-between',
    },
    discountName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    discountSubtitle: { fontSize: 12, marginBottom: 8 },
    discountMeta: { flexDirection: 'row', gap: 14, marginBottom: 8 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, fontWeight: '500' },
    discountPrice: { fontSize: 20, fontWeight: '800' },

    // Dots
    dotsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 20 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    dotActive: { width: 24 },

    // Popular Grid
    popularGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        gap: 12,
    },
    popularCard: {
        width: (width - 52) / 2,
        borderRadius: 20,
        overflow: 'hidden',
    },
    popularImageContainer: { position: 'relative' },
    popularImage: { width: '100%', height: 120 },
    heartBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    popularInfo: { padding: 14 },
    popularName: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
    popularMeta: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    smallMetaText: { fontSize: 11, fontWeight: '500' },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    popularPrice: { fontSize: 16, fontWeight: '800' },
    addBtn: {
        width: 30,
        height: 30,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },

    // Cart Indicator
    cartIndicator: {
        position: 'absolute',
        bottom: 90,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 16,
        borderRadius: 16,
    },
    cartIndicatorText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: {
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
    modalImage: { width: '100%', height: 220 },
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
