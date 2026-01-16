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
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../context/ThemeContext';
import { spacing, shadows } from '../theme';
import HamburgerMenu from '../components/HamburgerMenu';

const { width } = Dimensions.get('window');

const MenuScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const colors = theme.colors;

    const [selectedCategory, setSelectedCategory] = useState('Starters');
    const [favorites, setFavorites] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const categories = ['Starters', 'Main Course', 'Drinks', 'Desserts'];

    const menuItems = {
        'Starters': [
            {
                id: 1,
                name: 'Caesar Salad',
                shortDesc: 'Crisp romaine lettuce with creamy Caesar dressing',
                price: 340,
                time: '15min',
                rating: 4.6,
                serves: 'Serves 1',
                image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop',
                description: 'Crisp romaine lettuce tossed with house-made Caesar dressing, shaved Parmesan, and garlic croutons. A classic that never disappoints.',
                dietType: 'veg'
            },
            {
                id: 2,
                name: 'Chicken Wings',
                shortDesc: 'Crispy fried wings tossed in spicy buffalo sauce',
                price: 480,
                time: '20min',
                rating: 4.8,
                serves: 'Serves 2',
                image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=400&fit=crop',
                description: 'Crispy fried chicken wings tossed in our signature spicy buffalo sauce. Served with cooling blue cheese dip and fresh celery sticks.',
                dietType: 'non-veg'
            },
            {
                id: 3,
                name: 'Avocado Toast',
                shortDesc: 'Fresh smashed avocado on artisan sourdough',
                price: 380,
                time: '10min',
                rating: 4.4,
                serves: 'Serves 1',
                image: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=400&h=400&fit=crop',
                description: 'Perfectly ripe Haas avocado smashed on toasted artisan sourdough, topped with cherry tomatoes, microgreens, and a drizzle of extra virgin olive oil.',
                dietType: 'vegan'
            },
        ],
        'Main Course': [
            {
                id: 4,
                name: 'Grilled Salmon',
                shortDesc: 'Premium Atlantic salmon with lemon herb butter',
                price: 740,
                time: '25min',
                rating: 4.7,
                serves: 'Serves 1',
                image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop',
                description: 'Heart-healthy Atlantic salmon fillet, seasoned with a blend of Mediterranean herbs and lemon zest. Grilled over an open flame for a smoky finish and served atop a bed of sautéed garden vegetables.',
                dietType: 'non-veg'
            },
            {
                id: 5,
                name: 'Pasta Carbonara',
                shortDesc: 'Classic creamy Italian pasta with bacon',
                price: 560,
                time: '20min',
                rating: 4.5,
                serves: 'Serves 2',
                image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=400&fit=crop',
                description: 'Traditional Italian carbonara featuring al dente spaghetti tossed in a silky sauce of egg yolks, Pecorino Romano, and crispy guanciale. Finished with freshly cracked black pepper.',
                dietType: 'non-veg'
            },
            {
                id: 6,
                name: 'Veggie Burger',
                shortDesc: 'Plant-based patty with fresh veggies',
                price: 540,
                time: '18min',
                rating: 4.3,
                serves: 'Serves 1',
                image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&h=400&fit=crop',
                description: 'Plant-based patty made with black beans and quinoa, topped with fresh lettuce, ripe tomato, pickles, caramelized onions, and our special vegan mayo on a brioche bun.',
                dietType: 'vegan'
            },
        ],
        'Drinks': [
            {
                id: 7,
                name: 'Fresh Orange Juice',
                shortDesc: 'Pure freshly squeezed juice from premium oranges',
                price: 180,
                time: '5min',
                rating: 4.8,
                serves: 'Serves 1',
                image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop',
                description: 'Pure, freshly squeezed orange juice from premium Valencia oranges. No added sugar, no preservatives - just natural goodness in every sip.',
                dietType: 'vegan'
            },
            {
                id: 8,
                name: 'Iced Coffee',
                shortDesc: 'Smooth cold brew from premium arabica beans',
                price: 140,
                time: '3min',
                rating: 4.6,
                serves: 'Serves 1',
                image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop',
                description: 'Smooth cold brew coffee made from premium single-origin Arabica beans, slow-steeped for 12 hours. Served over ice with your choice of milk.',
                dietType: 'veg'
            },
        ],
        'Desserts': [
            {
                id: 10,
                name: 'Chocolate Cake',
                shortDesc: 'Triple-layer chocolate cake with ganache',
                price: 300,
                time: '5min',
                rating: 4.9,
                serves: 'Serves 1',
                image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
                description: 'Decadent triple-layer chocolate cake with rich Belgian chocolate ganache between each layer. Topped with chocolate shavings and served with vanilla ice cream.',
                dietType: 'veg'
            },
            {
                id: 11,
                name: 'Tiramisu',
                shortDesc: 'Authentic Italian tiramisu with mascarpone',
                price: 320,
                time: '5min',
                rating: 4.8,
                serves: 'Serves 1',
                image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=400&fit=crop',
                description: 'Authentic Italian tiramisu with layers of espresso-soaked ladyfingers and creamy mascarpone cheese. Dusted with premium Dutch cocoa powder.',
                dietType: 'veg'
            },
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

    const cartTotal = cart.reduce((total, item) => total + item.quantity, 0);

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

                {/* Search Bar Redirect - Matching customer-web */}
                <TouchableOpacity
                    style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => navigation.navigate('Search')}
                    activeOpacity={0.9}
                >
                    <Icon name="search" size={18} color={colors.textMuted} />
                    <Text style={[styles.searchPlaceholderText, { color: colors.textMuted }]}>
                        Search your favourite food...
                    </Text>
                </TouchableOpacity>

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
                    {menuItems[selectedCategory].map(item => (
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
                                            style={[styles.addBtn, { backgroundColor: '#8B3A1E' }]}
                                            onPress={() => addToCart(item)}
                                        >
                                            <Icon name="plus" size={20} color="#FFFFFF" />
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.recentQtyStepper}>
                                            <TouchableOpacity
                                                style={styles.recentStepperBtn}
                                                onPress={() => removeFromCart(item.id)}
                                            >
                                                <Icon name="minus" size={12} color="#FFFFFF" />
                                            </TouchableOpacity>
                                            <Text style={styles.recentStepperValue}>{getItemQuantity(item.id)}</Text>
                                            <TouchableOpacity
                                                style={styles.recentStepperBtn}
                                                onPress={() => addToCart(item)}
                                            >
                                                <Icon name="plus" size={12} color="#FFFFFF" />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Modern Frosted Glow Cart Indicator - Matching customer-web */}
            {cartTotal > 0 && !showModal && (
                <TouchableOpacity style={styles.cartModernGlow} onPress={() => navigation.navigate('Cart')}>
                    <View style={styles.glowContent}>
                        {/* Badge with cart icon and count */}
                        <View style={styles.glowBadge}>
                            <Icon name="shopping-cart" size={16} color="#FFFFFF" />
                            <Text style={styles.glowCount}>{cartTotal > 9 ? '9+' : cartTotal}</Text>
                        </View>

                        {/* Details - Your Order + Total */}
                        <View style={styles.glowDetails}>
                            <Text style={styles.glowLabel}>YOUR ORDER</Text>
                            <Text style={styles.glowTotal}>₹{cartValue}</Text>
                        </View>

                        {/* Black CTA Button */}
                        <View style={styles.glowCta}>
                            <Text style={styles.glowCtaText}>View Cart</Text>
                            <View style={styles.ctaIcon}>
                                <Icon name="arrow-right" size={18} color="#FFFFFF" />
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            )}

            {/* Item Modal - Matching customer-web */}
            <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
                {selectedItem && (
                    <View style={styles.modalOverlay}>
                        <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowModal(false)} />
                        <View style={styles.modalSheet}>
                            {/* Drag Handle */}
                            <View style={styles.modalDragBar} />

                            {/* Close Button */}
                            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowModal(false)}>
                                <Icon name="x" size={18} color="#666666" />
                            </TouchableOpacity>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                                {/* Dish Showcase - Centered Image */}
                                <View style={styles.modalDishShowcase}>
                                    <View style={styles.modalImageWrapper}>
                                        <View style={styles.dishImageFrame}>
                                            <Image source={{ uri: selectedItem.image }} style={styles.dishImage} />
                                        </View>

                                        {/* Favorite Button - Fixed to top right of image */}
                                        <TouchableOpacity
                                            style={styles.modalFavFloating}
                                            onPress={() => toggleFavorite(selectedItem.id)}
                                        >
                                            <FontAwesome
                                                name={favorites.includes(selectedItem.id) ? 'heart' : 'heart-o'}
                                                size={20}
                                                color="#8B3A1E"
                                            />
                                        </TouchableOpacity>

                                        {/* Rating Pill - Fixed to bottom right of image */}
                                        <View style={styles.dishRatingPill}>
                                            <FontAwesome name="star" size={12} color="#8B3A1E" />
                                            <Text style={styles.dishRatingText}>{selectedItem.rating}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Dish Info - Centered */}
                                <View style={styles.modalDishInfo}>
                                    <Text style={styles.dishTitle}>{selectedItem.name}</Text>

                                    {/* Meta Chips */}
                                    <View style={styles.metaChips}>
                                        <View style={styles.metaChip}>
                                            <Icon name="clock" size={13} color="#1A1A1A" />
                                            <Text style={styles.metaChipText}>{selectedItem.time}</Text>
                                        </View>
                                        <View style={styles.metaChip}>
                                            <Icon name="users" size={13} color="#1A1A1A" />
                                            <Text style={styles.metaChipText}>{selectedItem.serves}</Text>
                                        </View>
                                        {selectedItem.dietType === 'vegan' && (
                                            <View style={[styles.metaChip, styles.metaChipVegan]}>
                                                <Text style={styles.metaChipTextVegan}>Vegan</Text>
                                            </View>
                                        )}
                                        {selectedItem.dietType === 'veg' && (
                                            <View style={[styles.metaChip, styles.metaChipGreen]}>
                                                <Text style={styles.metaChipTextGreen}>Veg</Text>
                                            </View>
                                        )}
                                        {selectedItem.dietType === 'non-veg' && (
                                            <View style={[styles.metaChip, styles.metaChipRed]}>
                                                <Text style={styles.metaChipTextRed}>Non-Veg</Text>
                                            </View>
                                        )}
                                    </View>

                                    <Text style={styles.dishFullDesc}>{selectedItem.description}</Text>
                                </View>
                            </ScrollView>

                            {/* Bottom Action Bar - Fixed */}
                            <View style={styles.modalBottomBar}>
                                <View style={styles.priceDisplay}>
                                    <Text style={styles.priceRupee}>₹{selectedItem.price}</Text>
                                </View>

                                {getItemQuantity(selectedItem.id) === 0 ? (
                                    <TouchableOpacity
                                        style={styles.addToOrderBtn}
                                        onPress={() => addToCart(selectedItem)}
                                    >
                                        <Text style={styles.addToOrderText}>Add to Order</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.qtyStepper}>
                                        <TouchableOpacity
                                            style={styles.stepperBtn}
                                            onPress={() => removeFromCart(selectedItem.id)}
                                        >
                                            <Icon name="minus" size={18} color="#FFFFFF" />
                                        </TouchableOpacity>
                                        <Text style={styles.stepperCount}>{getItemQuantity(selectedItem.id)}</Text>
                                        <TouchableOpacity
                                            style={styles.stepperBtn}
                                            onPress={() => addToCart(selectedItem)}
                                        >
                                            <Icon name="plus" size={18} color="#FFFFFF" />
                                        </TouchableOpacity>
                                    </View>
                                )}
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
    searchPlaceholderText: { flex: 1, fontSize: 14, fontWeight: '500' },

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
    recentQtyStepper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#8B3A1E',
        borderRadius: 10,
        padding: 3,
        gap: 6,
    },
    recentStepperBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        width: 26,
        height: 26,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recentStepperValue: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
        minWidth: 16,
        textAlign: 'center',
    },

    // Modern Frosted Glow Cart - Matching customer-web exactly
    cartModernGlow: {
        position: 'absolute',
        bottom: 16,
        left: 32,
        right: 32,
        zIndex: 1500,
    },
    glowContent: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 8,
        paddingLeft: 14,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: 'rgba(139, 58, 30, 0.15)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.12,
        shadowRadius: 35,
        elevation: 15,
    },
    glowBadge: {
        backgroundColor: '#8B3A1E',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        shadowColor: 'rgba(139, 58, 30, 0.3)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 4,
    },
    glowCount: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    glowDetails: {
        flex: 1,
        paddingLeft: 16,
    },
    glowLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#8B3A1E',
        letterSpacing: 0.5,
        opacity: 0.8,
    },
    glowTotal: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1A1A1A',
        letterSpacing: -0.5,
    },
    glowCta: {
        backgroundColor: '#1A1A1A',
        paddingVertical: 6,
        paddingLeft: 16,
        paddingRight: 6,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    glowCtaText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    ctaIcon: {
        width: 32,
        height: 32,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Modal - Matching customer-web
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalSheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '85%',
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
        backgroundColor: '#F5F5F5',
        zIndex: 10,
    },

    // Dish Showcase
    modalDishShowcase: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 64, // Pushed image down
        paddingBottom: 28,
        position: 'relative',
    },
    modalImageWrapper: {
        width: 280,
        height: 200,
        position: 'relative',
    },
    dishImageFrame: {
        width: 280,
        height: 200,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        borderWidth: 5,
        borderColor: '#FFFFFF',
        shadowColor: 'rgba(139, 58, 30, 0.18)',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 1,
        shadowRadius: 50,
        elevation: 10,
    },
    dishImage: {
        width: '100%',
        height: '100%',
    },
    modalFavFloating: {
        position: 'absolute',
        top: -12, // Offset above the image frame
        right: -12, // Offset to the right of the image frame
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 15,
        elevation: 5,
        zIndex: 5,
    },
    dishRatingPill: {
        position: 'absolute',
        bottom: -12, // Offset below the image frame
        right: -12, // Offset to the right of the image frame
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#1A1A1A',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        zIndex: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 15,
        elevation: 5,
    },
    dishRatingText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

    // Dish Info
    modalDishInfo: {
        paddingHorizontal: 24,
        paddingBottom: 30, // Reduced gap between description and bottom bar
        alignItems: 'center',
    },
    dishTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 12,
        textAlign: 'center',
    },
    metaChips: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1A1A1A',
    },
    metaChipText: { fontSize: 12, fontWeight: '600', color: '#1A1A1A' },
    metaChipGreen: { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' },
    metaChipTextGreen: { fontSize: 12, fontWeight: '600', color: '#2E7D32' },
    metaChipVegan: { backgroundColor: '#E0F2F1', borderColor: '#00695C' },
    metaChipTextVegan: { fontSize: 12, fontWeight: '600', color: '#00695C' },
    metaChipRed: { backgroundColor: '#FFEBEE', borderColor: '#C62828' },
    metaChipTextRed: { fontSize: 12, fontWeight: '600', color: '#C62828' },
    dishFullDesc: {
        fontSize: 14,
        lineHeight: 24,
        color: '#666666',
        textAlign: 'center',
    },

    // Bottom Action Bar
    modalBottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24,
        paddingVertical: 16,
        paddingBottom: 28,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    priceDisplay: {},
    priceRupee: { fontSize: 28, fontWeight: '900', color: '#1A1A1A' },
    addToOrderBtn: {
        backgroundColor: '#8B3A1E',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 14,
    },
    addToOrderText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

    // Quantity Stepper - Matching customer-web
    qtyStepper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#8B3A1E',
        borderRadius: 14,
        overflow: 'hidden',
    },
    stepperBtn: {
        width: 48,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperCount: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        minWidth: 36,
        textAlign: 'center',
    },
});

export default MenuScreen;
