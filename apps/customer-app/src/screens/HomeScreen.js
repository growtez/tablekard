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
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import { spacing, shadows } from '../theme';
import HamburgerMenu from '../components/HamburgerMenu';

// Import local assets
const heroIllustration = require('../assets/food_app_hero.png');

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

    // Filters - matching customer-web
    const filters = [
        { id: 'popular', label: 'Popular this week' },
        { id: 'all', label: 'Most selling' },
        { id: 'expensive', label: 'Most expensive' },
        { id: 'budget', label: 'Under ₹200' },
    ];

    // Featured Offers (Discounts)
    const featuredOffers = [
        { id: 'featured1', name: 'Sushi Pack', price: 299, time: '15 min', rating: 4.8, discount: '20% OFF', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=400&fit=crop', description: 'A curated selection of premium seafood sushi.' },
        { id: 'featured2', name: 'Salmon Platter', price: 399, time: '15 min', rating: 4.8, discount: '20% OFF', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=400&fit=crop', description: 'Atlantic salmon grilled to perfection.' },
        { id: 'featured3', name: 'California Rolls', price: 249, time: '12 min', rating: 4.7, discount: '20% OFF', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=400&fit=crop', description: 'Classic California rolls with avocado.' },
    ];

    // Popular Items
    const popularItems = [
        { id: 'popular1', name: 'Margherita', price: 168, time: '25min', rating: 4.9, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=300&fit=crop', description: 'Classic Italian pizza with fresh mozzarella.' },
        { id: 'popular2', name: 'Tikka Masala', price: 198, time: '30min', rating: 4.8, image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=300&fit=crop', description: 'Authentic Indian curry with tender chicken.' },
        { id: 'popular3', name: 'Lava Cake', price: 568, time: '15min', rating: 4.9, image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=300&h=300&fit=crop', description: 'Warm chocolate cake with molten center.' },
        { id: 'popular4', name: 'Caesar Salad', price: 120, time: '10min', rating: 4.7, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=300&fit=crop', description: 'Fresh romaine with Caesar dressing.' },
    ];

    // Recent Orders
    const recentOrders = [
        { id: 'recent1', name: 'Pepperoni Pizza', price: 148, time: '20min', rating: 4.6, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=300&fit=crop', description: 'Signature pepperoni pizza.' },
        { id: 'recent2', name: 'Grilled Salmon', price: 228, time: '25min', rating: 4.8, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&h=300&fit=crop', description: 'Fresh grilled salmon fillet.' },
        { id: 'recent3', name: 'Vegan Burger', price: 138, time: '20min', rating: 4.5, image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=300&h=300&fit=crop', description: 'Plant-based burger patty.' },
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
        const cardWidth = 230 + 16; // card width + gap
        const index = Math.round(scrollPosition / cardWidth);
        setCurrentOfferIndex(Math.min(index, featuredOffers.length - 1));
    };

    const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header - Matching customer-web */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <HamburgerMenu navigation={navigation} activeRoute="Home" />
                        <Text style={styles.brandName}>DELISH</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.headerIconBtn}
                        onPress={() => navigation.navigate('Menu')}
                    >
                        <Icon name="search" size={22} color="#8B3A1E" />
                    </TouchableOpacity>
                </View>

                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.heroText}>
                        <Text style={styles.heroTitle}>
                            Find Your <Text style={styles.heroHighlight}>Best</Text>
                        </Text>
                        <Text style={styles.heroTitle}>Food Around You</Text>
                    </View>
                    <View style={styles.heroIllustration}>
                        <Image
                            source={heroIllustration}
                            style={styles.heroImage}
                            resizeMode="contain"
                        />
                    </View>
                </View>

                {/* Deliver To Bar */}
                <TouchableOpacity style={styles.deliverBar} onPress={() => navigation.navigate('Address')}>
                    <View style={styles.deliverIcon}>
                        <Icon name="map-pin" size={16} color="#8B3A1E" />
                    </View>
                    <View style={styles.deliverInfo}>
                        <Text style={styles.deliverLabel}>Deliver to</Text>
                        <Text style={styles.deliverText} numberOfLines={1}>
                            {selectedAddress?.label || 'Select Address'}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.gpsBtn} onPress={getCurrentLocation}>
                        <Icon name="navigation" size={14} color="#8B3A1E" />
                    </TouchableOpacity>
                    <Icon name="chevron-down" size={18} color="#B8ADA9" />
                </TouchableOpacity>

                {/* Categories Section - with exact customer-web styling */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Categories</Text>
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
                                    activeFilter === filter.id && styles.categoryPillActive
                                ]}
                                onPress={() => setActiveFilter(filter.id)}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    activeFilter === filter.id && styles.categoryTextActive
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
                        <Text style={styles.sectionTitle}>
                            {filters.find(f => f.id === activeFilter)?.label || 'Popular this week'}
                        </Text>
                        <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('Menu')}>
                            <Text style={styles.viewAllText}>View all</Text>
                            <View style={styles.arrowSquare}>
                                <Icon name="arrow-right" size={12} color="#FFFFFF" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Food Grid - 2 columns with black border */}
                    <View style={styles.foodGrid}>
                        {filteredItems.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.foodCard}
                                onPress={() => handleItemClick(item)}
                            >
                                <View style={styles.foodImageContainer}>
                                    <Image source={{ uri: item.image }} style={styles.foodImage} />
                                    <TouchableOpacity
                                        style={[
                                            styles.favBtn,
                                            favorites.includes(item.id) && styles.favBtnActive
                                        ]}
                                        onPress={() => toggleFavorite(item.id)}
                                    >
                                        <FontAwesome
                                            name={favorites.includes(item.id) ? 'heart' : 'heart-o'}
                                            size={12}
                                            color={favorites.includes(item.id) ? '#FFFFFF' : '#8B3A1E'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
                                <View style={styles.foodMeta}>
                                    <View style={styles.foodMetaItem}>
                                        <Icon name="clock" size={10} color="#888888" />
                                        <Text style={styles.foodMetaTime}>{item.time}</Text>
                                    </View>
                                    <View style={styles.foodMetaItem}>
                                        <FontAwesome name="star" size={10} color="#8B3A1E" />
                                        <Text style={styles.foodMetaRating}>{item.rating}</Text>
                                    </View>
                                </View>
                                <Text style={styles.foodPrice}>₹{item.price}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Discounts Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Discounts for you</Text>
                        <TouchableOpacity style={styles.viewAllBtn}>
                            <Text style={styles.viewAllText}>View all</Text>
                            <View style={styles.arrowSquare}>
                                <Icon name="arrow-right" size={12} color="#FFFFFF" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Discount Cards - with burgundy tinted border */}
                    <ScrollView
                        ref={scrollRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        contentContainerStyle={styles.discountScroll}
                        snapToInterval={246}
                        decelerationRate="fast"
                    >
                        {featuredOffers.map((offer) => (
                            <TouchableOpacity
                                key={offer.id}
                                style={styles.discountCard}
                                onPress={() => handleItemClick(offer)}
                            >
                                <View style={styles.discountImageContainer}>
                                    <Image source={{ uri: offer.image }} style={styles.discountImage} />
                                    {/* Starburst Badge */}
                                    <View style={styles.discountBadge}>
                                        <Text style={styles.discountBadgeValue}>{offer.discount.split(' ')[0]}</Text>
                                        <Text style={styles.discountBadgeOff}>{offer.discount.split(' ')[1]}</Text>
                                    </View>
                                </View>
                                <View style={styles.discountInfo}>
                                    <Text style={styles.discountName}>{offer.name}</Text>
                                    <View style={styles.discountMeta}>
                                        <View style={styles.discountMetaItem}>
                                            <Icon name="clock" size={12} color="#666666" />
                                            <Text style={styles.discountMetaTime}>{offer.time}</Text>
                                        </View>
                                        <Text style={styles.discountMetaDot}>•</Text>
                                        <View style={styles.discountMetaItem}>
                                            <FontAwesome name="star" size={12} color="#8B3A1E" />
                                            <Text style={styles.discountMetaRating}>{offer.rating}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.discountPrice}>₹{offer.price}</Text>
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
                                    currentOfferIndex === index && styles.dotActive
                                ]}
                            />
                        ))}
                    </View>
                </View>

                {/* Recent Orders Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Orders</Text>
                        <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('Orders')}>
                            <Text style={styles.viewAllText}>View all</Text>
                            <View style={styles.arrowSquare}>
                                <Icon name="arrow-right" size={12} color="#FFFFFF" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Recent Items - with black border */}
                    <View style={styles.recentList}>
                        {recentOrders.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.recentItem}
                                onPress={() => handleItemClick(item)}
                            >
                                <Image source={{ uri: item.image }} style={styles.recentImage} />
                                <View style={styles.recentInfo}>
                                    <Text style={styles.recentName}>{item.name}</Text>
                                    <View style={styles.recentMeta}>
                                        <Text style={styles.recentTime}>{item.time}</Text>
                                        <View style={styles.recentRating}>
                                            <FontAwesome name="star" size={10} color="#8B3A1E" />
                                            <Text style={styles.recentRatingText}>{item.rating}</Text>
                                        </View>
                                    </View>
                                </View>
                                <Text style={styles.recentPrice}>₹{item.price}</Text>

                                {getItemQuantity(item.id) === 0 ? (
                                    <TouchableOpacity style={styles.reorderBtn} onPress={() => addToCart(item)}>
                                        <Icon name="plus" size={16} color="#FFFFFF" />
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.qtyStepper}>
                                        <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                                            <Icon name="minus" size={14} color="#8B3A1E" />
                                        </TouchableOpacity>
                                        <Text style={styles.qtyText}>{getItemQuantity(item.id)}</Text>
                                        <TouchableOpacity onPress={() => addToCart(item)}>
                                            <Icon name="plus" size={14} color="#8B3A1E" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Cart Indicator */}
            {totalCartItems > 0 && !showModal && (
                <TouchableOpacity style={styles.cartGlow} onPress={() => navigation.navigate('Cart')}>
                    <View style={styles.cartGlowContent}>
                        <View style={styles.cartGlowBadge}>
                            <Icon name="shopping-cart" size={16} color="#FFFFFF" />
                            <View style={styles.cartGlowCount}>
                                <Text style={styles.cartGlowCountText}>{totalCartItems}</Text>
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
                        <View style={styles.modalSheet}>
                            <View style={styles.modalDragBar} />
                            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowModal(false)}>
                                <Icon name="x" size={18} color="#8B3A1E" />
                            </TouchableOpacity>

                            <View style={styles.modalImageFrame}>
                                <Image source={{ uri: selectedItem.image }} style={styles.modalImage} />
                                <TouchableOpacity
                                    style={[styles.modalFavBtn, favorites.includes(selectedItem.id) && styles.modalFavBtnActive]}
                                    onPress={() => toggleFavorite(selectedItem.id)}
                                >
                                    <FontAwesome name={favorites.includes(selectedItem.id) ? 'heart' : 'heart-o'} size={20} color={favorites.includes(selectedItem.id) ? '#FFFFFF' : '#8B3A1E'} />
                                </TouchableOpacity>
                                <View style={styles.modalRatingPill}>
                                    <FontAwesome name="star" size={12} color="#8B3A1E" />
                                    <Text style={styles.modalRatingText}>{selectedItem.rating}</Text>
                                </View>
                            </View>

                            <View style={styles.modalInfo}>
                                <Text style={styles.modalTitle}>{selectedItem.name}</Text>
                                <View style={styles.modalMeta}>
                                    <View style={styles.modalTag}>
                                        <Icon name="clock" size={12} color="#8B3A1E" />
                                        <Text style={styles.modalTagText}>{selectedItem.time}</Text>
                                    </View>
                                </View>
                                <Text style={styles.modalDesc}>{selectedItem.description}</Text>

                                <View style={styles.modalFooter}>
                                    <Text style={styles.modalPrice}>₹{selectedItem.price}</Text>
                                    <TouchableOpacity
                                        style={styles.modalAddBtn}
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
    container: { flex: 1, backgroundColor: '#FFFFFF' },

    // Header - matching customer-web
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 16,
        paddingBottom: 16,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    hamburger: { gap: 4, padding: 8 },
    hamburgerLine: { width: 20, height: 2.5, borderRadius: 2 },
    brandName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#8B3A1E',
        letterSpacing: 5,
        textTransform: 'uppercase',
    },
    headerIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF0EC',
        borderWidth: 1,
        borderColor: '#FFD8CC',
    },
    headerBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#C41E3A',
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    headerBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },

    // Hero
    heroSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        minHeight: 160,
        position: 'relative',
    },
    heroText: { flex: 1, maxWidth: '55%', zIndex: 2 },
    heroTitle: { fontSize: 26, fontWeight: '800', color: '#1A1A1A', lineHeight: 30, letterSpacing: -0.5 },
    heroHighlight: { color: '#8B3A1E' },
    heroIllustration: {
        position: 'absolute',
        right: 0,
        top: 10,
        width: '45%',
        height: 150,
    },
    heroImage: { width: '100%', height: '100%' },

    // Deliver Bar
    deliverBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        borderRadius: 18,
        padding: 14,
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 20,
        elevation: 2,
    },
    deliverIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        backgroundColor: '#FFF0EC',
    },
    deliverInfo: { flex: 1 },
    deliverLabel: { fontSize: 11, color: '#B8ADA9', marginBottom: 2 },
    deliverText: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
    gpsBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        backgroundColor: '#FFF0EC',
    },

    // Search - matching customer-web
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        borderRadius: 18,
        padding: 14,
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 20,
        elevation: 2,
    },
    searchPlaceholder: { fontSize: 15, fontWeight: '500', color: '#B8ADA9' },

    // Section
    section: { paddingHorizontal: 20, paddingBottom: 28 },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
    viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    viewAllText: { fontSize: 13, fontWeight: '500', color: '#8B3A1E' },
    arrowSquare: {
        width: 20,
        height: 20,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#8B3A1E',
    },

    // Categories - EXACT customer-web styling
    categoryScroll: { gap: 8 },
    categoryPill: {
        backgroundColor: '#FDFDFD',
        borderWidth: 1,
        borderColor: '#EAEAEA',
        borderRadius: 14,
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    categoryPillActive: {
        backgroundColor: '#1A1A1A', // BLACK not burgundy
        borderColor: '#1A1A1A',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#888888', // Gray text
    },
    categoryTextActive: {
        color: '#FFFFFF',
    },

    // Food Grid - BLACK border like customer-web
    foodGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
    },
    foodCard: {
        width: (width - 54) / 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 14,
        borderWidth: 1.5,
        borderColor: '#1A1A1A', // BLACK border
        alignItems: 'center',
    },
    foodImageContainer: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 16,
        backgroundColor: '#FFF9F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        position: 'relative',
    },
    foodImage: {
        width: '80%',
        height: '80%',
        borderRadius: 100, // Circle image
    },
    favBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#8B3A1E',
    },
    favBtnActive: {
        backgroundColor: '#8B3A1E',
        borderColor: '#8B3A1E',
    },
    foodName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 4,
        textAlign: 'center',
    },
    foodMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 6,
    },
    foodMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    foodMetaTime: { fontSize: 11, fontWeight: '500', color: '#888888' },
    foodMetaRating: { fontSize: 11, fontWeight: '500', color: '#1A1A1A' },
    foodPrice: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1A1A1A', // BLACK price like customer-web
    },

    // Discounts - burgundy tinted border
    discountScroll: { paddingVertical: 20, paddingRight: 4, gap: 16 },
    discountCard: {
        width: 230,
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(139, 58, 30, 0.25)', // Burgundy tinted border
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 3,
    },
    discountImageContainer: {
        width: '100%',
        aspectRatio: 1.2,
        borderRadius: 22,
        marginBottom: 12,
        position: 'relative',
    },
    discountImage: { width: '100%', height: '100%', borderRadius: 22 },
    discountBadge: {
        position: 'absolute',
        top: -15,
        right: -15,
        width: 64,
        height: 64,
        backgroundColor: '#8B3A1E',
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#8B3A1E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    discountBadgeValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
    discountBadgeOff: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
    discountInfo: { paddingHorizontal: 8, paddingBottom: 8 },
    discountName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
    discountMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
    discountMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    discountMetaTime: { fontSize: 12, fontWeight: '500', color: '#666666' },
    discountMetaDot: { fontSize: 10, color: '#D1CEC9', marginHorizontal: 4 },
    discountMetaRating: { fontSize: 12, fontWeight: '600', color: '#1A1A1A' },
    discountPrice: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },

    // Dots
    dotsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: -5 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E8D5CA' },
    dotActive: { backgroundColor: '#8B3A1E', transform: [{ scale: 1.2 }] },

    // Recent Orders - BLACK border like customer-web
    recentList: { gap: 10 },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#1A1A1A', // BLACK border
    },
    recentImage: { width: 55, height: 55, borderRadius: 12, marginRight: 12, backgroundColor: '#FFF9F7' },
    recentInfo: { flex: 1 },
    recentName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 2 },
    recentMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    recentTime: { fontSize: 11, color: '#999999' },
    recentRating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    recentRatingText: { fontSize: 11, fontWeight: '500', color: '#1A1A1A' },
    recentPrice: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginRight: 10 },
    reorderBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#8B3A1E',
    },
    qtyStepper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#FFF0EC',
    },
    qtyText: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },

    // Cart Glow
    cartGlow: {
        position: 'absolute',
        bottom: 16,
        left: 20,
        right: 20,
        borderRadius: 20,
        backgroundColor: '#8B3A1E',
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
        backgroundColor: '#FFFFFF',
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
        backgroundColor: '#FFF0EC',
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
        backgroundColor: '#FFF0EC',
        borderWidth: 2,
        borderColor: '#8B3A1E',
    },
    modalFavBtnActive: {
        backgroundColor: '#8B3A1E',
        borderColor: '#8B3A1E',
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
        backgroundColor: '#FFFFFF',
    },
    modalRatingText: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
    modalInfo: { padding: 24 },
    modalTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginBottom: 12 },
    modalMeta: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    modalTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#FFF0EC',
    },
    modalTagText: { fontSize: 12, fontWeight: '600', color: '#8B3A1E' },
    modalDesc: { fontSize: 14, lineHeight: 22, color: '#666666', marginBottom: 24 },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalPrice: { fontSize: 28, fontWeight: '900', color: '#1A1A1A' },
    modalAddBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#8B3A1E',
    },
    modalAddText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

export default HomeScreen;
