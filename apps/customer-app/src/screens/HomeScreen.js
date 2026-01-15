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
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import { spacing, shadows } from '../theme';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const { theme, isDark } = useTheme();
    const { selectedAddress, getCurrentLocation, isLoading } = useLocation();
    const colors = theme.colors;

    const [searchTerm, setSearchTerm] = useState('');
    const [favorites, setFavorites] = useState([]);
    const [cart, setCart] = useState([]);
    const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showModal, setShowModal] = useState(false);
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

    const handleLocationPress = async () => {
        navigation.navigate('Address');
    };

    const handleUseCurrentLocation = async () => {
        await getCurrentLocation();
    };

    // Featured Offers
    const featuredOffers = [
        { id: 'featured1', name: 'Special Pizza', price: 1231, time: '20min', rating: 4.5, discount: '20% Discount', subtitle: 'in 2 orders in 6 items', serves: 'Serves 2-3', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&h=200&fit=crop', description: 'Delicious special pizza with authentic Italian flavors.' },
        { id: 'featured2', name: 'Burger Combo', price: 154, time: '25min', rating: 4.8, discount: '30% Off', subtitle: 'on combo meals', serves: 'Serves 1', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop', description: 'Juicy beef burger with crispy fries.' },
        { id: 'featured3', name: 'Pasta Special', price: 183, time: '30min', rating: 4.6, discount: 'Buy 1 Get 1', subtitle: 'on selected pasta', serves: 'Serves 1-2', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200&h=200&fit=crop', description: 'Creamy pasta with rich sauce.' },
    ];

    // Popular Items
    const popularItems = [
        { id: 'popular1', name: 'Classic Margherita Pizza', price: 168, time: '25min', rating: 4.9, serves: 'Serves 2', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&h=200&fit=crop', description: 'Traditional Italian pizza.' },
        { id: 'popular2', name: 'Chicken Tikka Masala', price: 198, time: '30min', rating: 4.8, serves: 'Serves 1', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&h=200&fit=crop', description: 'Tender chicken in creamy curry.' },
        { id: 'popular3', name: 'Chocolate Lava Cake', price: 568, time: '15min', rating: 4.9, serves: 'Serves 1', image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=200&h=200&fit=crop', description: 'Decadent chocolate cake.' },
    ];

    // Recent Orders
    const recentOrders = [
        { id: 'recent1', name: 'Pepperoni Pizza', price: 148, time: '20min', rating: 4.6, orderDate: '2 days ago', serves: 'Serves 2', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&h=200&fit=crop', description: 'Classic pepperoni pizza.' },
        { id: 'recent2', name: 'Grilled Salmon', price: 228, time: '25min', rating: 4.8, orderDate: '1 week ago', serves: 'Serves 1', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=200&fit=crop', description: 'Fresh Atlantic salmon.' },
    ];

    const handleScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / (width - 48));
        setCurrentOfferIndex(index);
    };

    const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity style={styles.menuIcon}>
                            <View style={[styles.hamburger, { backgroundColor: colors.text }]} />
                            <View style={[styles.hamburger, { backgroundColor: colors.text }]} />
                            <View style={[styles.hamburger, { backgroundColor: colors.text }]} />
                        </TouchableOpacity>

                        <View style={styles.headerRight}>
                            <TouchableOpacity style={[styles.likedItemsBtn, { backgroundColor: colors.primary + '15' }]} onPress={() => navigation.navigate('Cart')}>
                                <Icon name="shopping-cart" size={24} color={colors.primary} />
                                {totalCartItems > 0 && (
                                    <View style={[styles.likedCount, { backgroundColor: colors.primary }]}>
                                        <Text style={styles.likedCountText}>{totalCartItems}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            <View style={styles.profileAvatar}>
                                <Image source={{ uri: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=80&h=80&fit=crop' }} style={styles.avatarImage} />
                            </View>
                        </View>
                    </View>

                    {/* Delivery Location Bar */}
                    <TouchableOpacity style={[styles.locationBar, { backgroundColor: colors.card }]} onPress={handleLocationPress}>
                        <View style={[styles.locationIcon, { backgroundColor: colors.primary + '15' }]}>
                            <Icon name="map-pin" size={18} color={colors.primary} />
                        </View>
                        <View style={styles.locationInfo}>
                            <Text style={[styles.locationLabel, { color: colors.textMuted }]}>Deliver to</Text>
                            <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
                                {selectedAddress?.label || 'Select Address'} - {selectedAddress?.address?.substring(0, 25) || 'Tap to choose'}...
                            </Text>
                        </View>
                        <TouchableOpacity style={[styles.gpsBtn, { backgroundColor: colors.primary + '15' }]} onPress={handleUseCurrentLocation}>
                            <Icon name="navigation" size={16} color={colors.primary} />
                        </TouchableOpacity>
                        <Icon name="chevron-down" size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    {/* Main Title */}
                    <View style={styles.mainTitle}>
                        <Text style={[styles.titleText, { color: colors.text }]}>
                            Find Your <Text style={styles.highlight}>Best</Text>
                        </Text>
                        <Text style={[styles.titleText, { color: colors.text }]}>
                            <Text style={styles.highlight}>Food</Text> Around You
                        </Text>
                    </View>

                    {/* Search Bar */}
                    <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                        <Icon name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
                        <TextInput placeholder="Search your favourite food" placeholderTextColor={colors.textMuted} style={[styles.searchInput, { color: colors.text }]} value={searchTerm} onChangeText={setSearchTerm} />
                        <View style={styles.filterIcon}>
                            <View style={[styles.filterLine, { backgroundColor: colors.textMuted, width: 16 }]} />
                            <View style={[styles.filterLine, { backgroundColor: colors.textMuted, width: 12 }]} />
                            <View style={[styles.filterLine, { backgroundColor: colors.textMuted, width: 8 }]} />
                        </View>
                    </View>
                </View>

                {/* Discount Section Header */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Discounts for you</Text>
                    <TouchableOpacity><Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text></TouchableOpacity>
                </View>

                {/* Featured Offers Carousel */}
                <View style={styles.featuredWrapper}>
                    <ScrollView ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={handleScroll} scrollEventThrottle={16} contentContainerStyle={styles.featuredScroll}>
                        {featuredOffers.map((offer) => (
                            <TouchableOpacity key={offer.id} style={[styles.featuredOffer, { backgroundColor: colors.card }]} onPress={() => handleItemClick(offer)}>
                                <View style={styles.offerContent}>
                                    <View style={styles.offerText}>
                                        <Text style={[styles.offerName, { color: colors.text }]}>{offer.name}</Text>
                                        <View style={styles.discountBadge}><Text style={[styles.discountText, { color: colors.primary }]}>{offer.discount}</Text></View>
                                        <Text style={[styles.offerSubtitle, { color: colors.textSecondary }]}>{offer.subtitle}</Text>
                                        <View style={styles.offerMeta}>
                                            <View style={[styles.timeBadge, { backgroundColor: colors.inputBg }]}><Text style={[styles.timeText, { color: colors.text }]}>{offer.time}</Text></View>
                                            <View style={styles.ratingRow}><Icon name="star" size={14} color={colors.primary} /><Text style={[styles.ratingText, { color: colors.text }]}>{offer.rating}</Text></View>
                                        </View>
                                    </View>
                                    <View style={styles.offerImage}><Image source={{ uri: offer.image }} style={styles.offerImageContent} /></View>
                                </View>
                                <View style={[styles.priceTag, { backgroundColor: colors.primary }]}><Text style={styles.priceText}>₹{offer.price}</Text></View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <View style={styles.sliderDots}>
                        {featuredOffers.map((_, index) => (
                            <View key={index} style={[styles.dot, { backgroundColor: currentOfferIndex === index ? colors.primary : colors.border }, currentOfferIndex === index && styles.dotActive]} />
                        ))}
                    </View>
                </View>

                {/* Most Popular Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Most Popular</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Menu')}><Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text></TouchableOpacity>
                </View>

                {/* Popular Food Items */}
                <View style={styles.foodItems}>
                    {popularItems.map(item => (
                        <TouchableOpacity key={item.id} style={[styles.foodItem, { backgroundColor: colors.card }]} onPress={() => handleItemClick(item)}>
                            <View style={styles.foodImage}>
                                <Image source={{ uri: item.image }} style={styles.foodImageContent} />
                                <TouchableOpacity style={styles.favoriteBtn} onPress={() => toggleFavorite(item.id)}>
                                    <Icon name="heart" size={18} color={favorites.includes(item.id) ? colors.primary : '#FFFFFF'} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.foodInfo}>
                                <View style={styles.foodHeader}>
                                    <Text style={[styles.foodName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
                                    <TouchableOpacity style={[styles.addBtn, { backgroundColor: isDark ? '#FFFFFF' : colors.primary }]} onPress={() => addToCart(item)}>
                                        <Icon name="plus" size={16} color={isDark ? colors.background : '#FFFFFF'} />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.foodMeta}>
                                    <View style={[styles.timeBadge, { backgroundColor: colors.inputBg }]}><Text style={[styles.timeText, { color: colors.text }]}>{item.time}</Text></View>
                                    <View style={styles.ratingRow}><Icon name="star" size={12} color={colors.star} /><Text style={[styles.ratingText, { color: colors.text }]}>{item.rating}</Text></View>
                                </View>
                            </View>
                            <View style={[styles.foodPrice, { backgroundColor: colors.primary }]}><Text style={styles.foodPriceText}>₹{item.price}</Text></View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Recent Orders Section */}
                <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Orders</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Orders')}><Text style={[styles.seeAll, { color: colors.primary }]}>View All</Text></TouchableOpacity>
                </View>

                {/* Recent Order Items */}
                <View style={styles.foodItems}>
                    {recentOrders.map(item => (
                        <TouchableOpacity key={item.id} style={[styles.foodItem, { backgroundColor: colors.card }]} onPress={() => handleItemClick(item)}>
                            <View style={styles.foodImage}>
                                <Image source={{ uri: item.image }} style={styles.foodImageContent} />
                                <View style={styles.orderBadge}><Text style={styles.orderBadgeText}>{item.orderDate}</Text></View>
                            </View>
                            <View style={styles.foodInfo}>
                                <View style={styles.foodHeader}>
                                    <Text style={[styles.foodName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
                                    <TouchableOpacity style={[styles.addBtn, { backgroundColor: isDark ? '#FFFFFF' : colors.primary }]} onPress={() => addToCart(item)}>
                                        <Icon name="plus" size={16} color={isDark ? colors.background : '#FFFFFF'} />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.foodMeta}>
                                    <View style={[styles.timeBadge, { backgroundColor: colors.inputBg }]}><Text style={[styles.timeText, { color: colors.text }]}>{item.time}</Text></View>
                                    <View style={styles.ratingRow}><Icon name="star" size={12} color={colors.star} /><Text style={[styles.ratingText, { color: colors.text }]}>{item.rating}</Text></View>
                                </View>
                            </View>
                            <View style={[styles.foodPrice, { backgroundColor: colors.primary }]}><Text style={styles.foodPriceText}>₹{item.price}</Text></View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 140 }} />
            </ScrollView>

            {/* Cart Indicator */}
            {totalCartItems > 0 && (
                <TouchableOpacity style={[styles.cartIndicator, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('Cart')}>
                    <Text style={styles.cartIndicatorText}>{totalCartItems} items in cart</Text>
                </TouchableOpacity>
            )}

            {/* Item Modal */}
            <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
                {selectedItem && (
                    <View style={styles.modalOverlay}>
                        <TouchableOpacity style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]} onPress={() => setShowModal(false)} />
                        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedItem.name}</Text>
                                <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: colors.inputBg }]} onPress={() => setShowModal(false)}>
                                    <Icon name="x" size={20} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.modalMainImage}><Image source={{ uri: selectedItem.image }} style={styles.modalImage} />{selectedItem.discount && (<View style={[styles.modalDiscountBadge, { backgroundColor: colors.primary }]}><Text style={styles.modalDiscountText}>{selectedItem.discount}</Text></View>)}</View>
                            <View style={styles.modalContentSection}>
                                <View style={[styles.modalServesInfo, { backgroundColor: colors.primary + '15' }]}><Text style={[styles.modalServesText, { color: colors.primary }]}>{selectedItem.serves}</Text></View>
                                <View style={styles.modalTimeRatingRow}>
                                    <View style={styles.modalTimeRatingLeft}>
                                        <View style={[styles.modalItemTime, { backgroundColor: colors.inputBg }]}><Text style={[styles.modalTimeText, { color: colors.text }]}>{selectedItem.time}</Text></View>
                                        <View style={styles.modalRatingSection}><Icon name="star" size={16} color={colors.primary} /><Text style={[styles.modalRatingText, { color: colors.text }]}>{selectedItem.rating}</Text></View>
                                    </View>
                                    <TouchableOpacity style={[styles.modalAddBtn, { backgroundColor: colors.primary }]} onPress={() => { addToCart(selectedItem); setShowModal(false); }}><Text style={styles.modalAddBtnText}>ADD</Text></TouchableOpacity>
                                </View>
                                <Text style={[styles.modalPrice, { color: colors.primary }]}>₹{selectedItem.price}</Text>
                                <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>{selectedItem.description}</Text>
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

    header: { padding: spacing.lg, paddingTop: spacing.xl },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    menuIcon: { gap: 4 },
    hamburger: { width: 24, height: 3, borderRadius: 2 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    likedItemsBtn: { padding: 8, borderRadius: 50, position: 'relative' },
    likedCount: { position: 'absolute', top: -2, right: -2, borderRadius: 9, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
    likedCountText: { color: '#1a1a1a', fontSize: 10, fontWeight: 'bold' },
    profileAvatar: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },

    // Location Bar
    locationBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, marginBottom: 20 },
    locationIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    locationInfo: { flex: 1 },
    locationLabel: { fontSize: 11, marginBottom: 2 },
    locationText: { fontSize: 14, fontWeight: '500' },
    gpsBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 8 },

    mainTitle: { marginBottom: 24 },
    titleText: { fontSize: 32, fontWeight: '600', lineHeight: 40 },
    highlight: { fontWeight: '700' },

    searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16 },
    searchIcon: { marginRight: 12 },
    searchInput: { flex: 1, fontSize: 16 },
    filterIcon: { gap: 2 },
    filterLine: { height: 2, borderRadius: 1 },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: 16 },
    sectionTitle: { fontSize: 20, fontWeight: '600' },
    seeAll: { fontSize: 14 },

    featuredWrapper: { marginBottom: 32 },
    featuredScroll: { paddingHorizontal: spacing.lg, gap: 16 },
    featuredOffer: { width: width - 48, borderRadius: 16, padding: 27, position: 'relative' },
    offerContent: { flexDirection: 'row', justifyContent: 'space-between', gap: 20 },
    offerText: { flex: 1, justifyContent: 'space-between', minHeight: 110 },
    offerName: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
    discountBadge: { marginBottom: 8 },
    discountText: { fontWeight: '700', fontSize: 18 },
    offerSubtitle: { fontSize: 13, marginBottom: 16, fontWeight: '400' },
    offerMeta: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    timeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    timeText: { fontSize: 13 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingText: { fontSize: 14, fontWeight: '600' },
    offerImage: { width: 100, height: 100, borderRadius: 16, overflow: 'hidden' },
    offerImageContent: { width: '100%', height: '100%' },
    priceTag: { position: 'absolute', bottom: 0, right: 0, paddingHorizontal: 10, paddingVertical: 5, borderTopLeftRadius: 14, borderBottomRightRadius: 14, minWidth: 65 },
    priceText: { color: '#1a1a1a', fontSize: 13, fontWeight: '600', textAlign: 'center' },

    sliderDots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 16, paddingHorizontal: spacing.lg },
    dot: { width: 8, height: 8, borderRadius: 4 },
    dotActive: { width: 24, borderRadius: 4 },

    foodItems: { paddingHorizontal: spacing.lg, gap: 16 },
    foodItem: { position: 'relative', flexDirection: 'row', borderRadius: 16, padding: 16, overflow: 'hidden' },
    foodImage: { position: 'relative', width: 80, height: 80, borderRadius: 12, overflow: 'hidden', marginRight: 16 },
    foodImageContent: { width: '100%', height: '100%' },
    favoriteBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
    orderBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0, 0, 0, 0.7)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
    orderBadgeText: { color: 'white', fontSize: 10 },
    foodInfo: { flex: 1, justifyContent: 'space-between', minHeight: 80 },
    foodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    foodName: { fontSize: 16, fontWeight: '600', lineHeight: 20, maxWidth: '70%' },
    addBtn: { borderRadius: 8, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    foodMeta: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    foodPrice: { position: 'absolute', bottom: 0, right: 0, paddingHorizontal: 10, paddingVertical: 5, borderTopLeftRadius: 14, minWidth: 65 },
    foodPriceText: { color: '#1a1a1a', fontSize: 13, fontWeight: '600', textAlign: 'center' },

    cartIndicator: { position: 'absolute', bottom: 80, left: 24, right: 24, padding: 12, borderRadius: 12, alignItems: 'center' },
    cartIndicatorText: { color: '#212121', fontSize: 14, fontWeight: '600' },

    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '75%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    modalTitle: { fontSize: 20, fontWeight: '600', flex: 1 },
    modalCloseBtn: { padding: 8, borderRadius: 50 },
    modalMainImage: { paddingHorizontal: 20, marginBottom: 20 },
    modalImage: { width: '100%', height: 250, borderRadius: 16 },
    modalDiscountBadge: { position: 'absolute', top: 20, left: 30, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    modalDiscountText: { color: '#1a1a1a', fontWeight: '700', fontSize: 14 },
    modalContentSection: { paddingHorizontal: 20, paddingBottom: 20 },
    modalServesInfo: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12 },
    modalServesText: { fontSize: 11, fontWeight: '500' },
    modalTimeRatingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTimeRatingLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    modalItemTime: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
    modalTimeText: { fontSize: 12, fontWeight: '500' },
    modalRatingSection: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    modalRatingText: { fontSize: 14, fontWeight: '500' },
    modalAddBtn: { paddingHorizontal: 24, paddingVertical: 8, borderRadius: 12 },
    modalAddBtnText: { color: '#1a1a1a', fontWeight: '700', fontSize: 14 },
    modalPrice: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
    modalDescription: { fontSize: 14, lineHeight: 22 },
});

export default HomeScreen;
