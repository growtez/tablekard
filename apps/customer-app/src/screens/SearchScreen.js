import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    Dimensions,
    StatusBar,
    Modal,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../context/ThemeContext';

// Import local assets matching customer-web
const searchIllustration = require('../assets/search-illustration.png');
const noResultsIllustration = require('../assets/no-results-illustration.png');

const { width, height } = Dimensions.get('window');

const SearchScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const colors = theme.colors;
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);

    // Dish Modal States
    const [selectedItem, setSelectedItem] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [favorites, setFavorites] = useState([]);
    const [cart, setCart] = useState([]);

    // Mock data for search (Matching customer-web search.jsx exactly)
    const allItems = [
        {
            id: 'popular1',
            name: 'Margherita Pizza',
            price: 168,
            time: '25min',
            rating: 4.9,
            serves: 'Serves 2',
            dietType: 'veg',
            description: 'A timeless Italian masterpiece. Hand-stretched sourdough base topped with rich San Marzano tomato sauce, fresh buffalo mozzarella, and aromatic basil leaves.',
            image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop'
        },
        {
            id: 'popular2',
            name: 'Chicken Tikka Masala',
            price: 198,
            time: '30min',
            rating: 4.8,
            serves: 'Serves 1',
            dietType: 'non-veg',
            description: 'Experience a burst of authentic Indian spices. Succulent chicken pieces marinated in yogurt and spices, simmered in a creamy, mildly spicy tomato-based gravy.',
            image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop'
        },
        {
            id: 'popular3',
            name: 'Chocolate Lava Cake',
            price: 568,
            time: '15min',
            rating: 4.9,
            serves: 'Serves 1',
            dietType: 'veg',
            description: 'The ultimate dessert indulgence. A warm dark chocolate cake with a soft, gooey molten chocolate center that flows out with every bite.',
            image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=400&fit=crop'
        },
        {
            id: 'popular4',
            name: 'Classic Caesar Salad',
            price: 120,
            time: '10min',
            rating: 4.7,
            serves: 'Serves 1',
            dietType: 'veg',
            description: 'Fresh, crisp heads of romaine lettuce tossed in our signature creamy Caesar dressing. Loaded with herb-infused croutons and generous shavings of aged Parmesan cheese.',
            image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop'
        },
        {
            id: 'featured1',
            name: 'Special Sushi Platter',
            price: 249,
            time: '20 min',
            rating: 4.9,
            serves: 'Serves 1-2',
            dietType: 'non-veg',
            description: 'A curated selection of premium seafood, including fresh Atlantic salmon nigiri, spicy tuna rolls, and delicate cucumber maki.',
            image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=400&fit=crop'
        },
        {
            id: 'featured2',
            name: 'Grilled Salmon Fillet',
            price: 399,
            time: '15 min',
            rating: 4.8,
            serves: 'Serves 1',
            dietType: 'non-veg',
            description: 'Heart-healthy Atlantic salmon fillet, seasoned with a blend of Mediterranean herbs and lemon zest.',
            image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=400&fit=crop'
        }
    ];

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setResults([]);
        } else {
            const filtered = allItems.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setResults(filtered);
        }
    }, [searchTerm]);

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

    const toggleFavorite = (itemId) => {
        setFavorites(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleItemClick = (item) => {
        setSelectedItem(item);
        setShowModal(true);
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Search Header - Exact parity with search.jsx */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <View style={styles.searchBarWrapper}>
                    <Icon name="search" size={20} color="#B8ADA9" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search your favourite food"
                        placeholderTextColor="#B8ADA9"
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        autoFocus
                    />
                    {searchTerm !== '' && (
                        <TouchableOpacity onPress={() => setSearchTerm('')}>
                            <Icon name="x" size={18} color="#B8ADA9" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {searchTerm === '' ? (
                    <View style={styles.placeholderContainer}>
                        <Image
                            source={searchIllustration}
                            style={styles.illustration}
                            resizeMode="contain"
                        />
                        <Text style={styles.placeholderTitle}>Search for your cravings</Text>
                        <Text style={styles.placeholderText}>Try searching for "Pizza", "Sushi" or "Cake"</Text>
                    </View>
                ) : results.length > 0 ? (
                    <View style={styles.resultsContainer}>
                        <Text style={styles.resultsCount}>{results.length} results found for "{searchTerm}"</Text>
                        {results.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.resultCard}
                                onPress={() => handleItemClick(item)}
                            >
                                <View style={styles.resultImageContainer}>
                                    <Image source={{ uri: item.image }} style={styles.resultImage} />
                                    <View style={styles.resultRatingTag}>
                                        <FontAwesome name="star" size={10} color="#FFF" fill="#FFD700" />
                                        <Text style={styles.ratingText}>{item.rating}</Text>
                                    </View>
                                </View>
                                <View style={styles.resultInfo}>
                                    <View style={styles.resultHeader}>
                                        <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                                        <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                                            <FontAwesome
                                                name={favorites.includes(item.id) ? "heart" : "heart-o"}
                                                size={18}
                                                color="#8B3A1E"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.resultDesc} numberOfLines={2}>{item.description}</Text>
                                    <View style={styles.resultFooter}>
                                        <Text style={styles.resultPrice}>₹{item.price}</Text>
                                        <View style={styles.resultTime}>
                                            <Icon name="clock" size={12} color="#666666" />
                                            <Text style={styles.timeText}>{item.time}</Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View style={styles.placeholderContainer}>
                        <Image
                            source={noResultsIllustration}
                            style={styles.illustration}
                            resizeMode="contain"
                        />
                        <Text style={styles.placeholderTitle}>No results found</Text>
                        <Text style={styles.placeholderText}>We couldn't find anything matching "{searchTerm}"</Text>
                    </View>
                )}
            </ScrollView>

            {/* Item Modal - Matching HomeScreen/MenuScreen design exactly */}
            <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
                {selectedItem && (
                    <View style={styles.modalOverlay}>
                        <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowModal(false)} />
                        <View style={styles.modalSheet}>
                            <View style={styles.modalDragBar} />
                            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowModal(false)}>
                                <Icon name="x" size={18} color="#666666" />
                            </TouchableOpacity>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                                <View style={styles.modalDishShowcase}>
                                    <View style={styles.modalImageWrapper}>
                                        <View style={styles.dishImageFrame}>
                                            <Image source={{ uri: selectedItem.image }} style={styles.dishImage} />
                                        </View>
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
                                        <View style={styles.dishRatingPill}>
                                            <FontAwesome name="star" size={12} color="#8B3A1E" />
                                            <Text style={styles.dishRatingText}>{selectedItem.rating}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.modalDishInfo}>
                                    <Text style={styles.dishTitle}>{selectedItem.name}</Text>
                                    <View style={styles.metaChips}>
                                        <View style={styles.metaChip}>
                                            <Icon name="clock" size={13} color="#1A1A1A" />
                                            <Text style={styles.metaChipText}>{selectedItem.time}</Text>
                                        </View>
                                        <View style={styles.metaChip}>
                                            <Icon name="users" size={13} color="#1A1A1A" />
                                            <Text style={styles.metaChipText}>{selectedItem.serves || 'Serves 1'}</Text>
                                        </View>
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

                            <View style={styles.modalBottomBar}>
                                <View style={styles.priceDisplay}>
                                    <Text style={styles.priceRupee}>₹{selectedItem.price}</Text>
                                </View>
                                {getItemQuantity(selectedItem.id) === 0 ? (
                                    <TouchableOpacity style={styles.addToOrderBtn} onPress={() => addToCart(selectedItem)}>
                                        <Text style={styles.addToOrderText}>Add to Order</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.qtyStepper}>
                                        <TouchableOpacity style={styles.stepperBtn} onPress={() => removeFromCart(selectedItem.id)}>
                                            <Icon name="minus" size={18} color="#FFFFFF" />
                                        </TouchableOpacity>
                                        <Text style={styles.stepperCount}>{getItemQuantity(selectedItem.id)}</Text>
                                        <TouchableOpacity style={styles.stepperBtn} onPress={() => addToCart(selectedItem)}>
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
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        gap: 12,
    },
    backBtn: { padding: 4, marginLeft: -4 },
    searchBarWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        borderRadius: 14,
        paddingHorizontal: 14,
        gap: 10,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        height: 48,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1A1A1A',
        fontWeight: '500',
        padding: 0,
    },
    scrollContent: { flexGrow: 1, padding: 20 },
    placeholderContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    illustration: { width: 220, height: 220, marginBottom: 24 },
    placeholderTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
    placeholderText: { fontSize: 14, color: '#888888', textAlign: 'center' },
    resultsContainer: { gap: 16 },
    resultsCount: { fontSize: 13, color: '#888888', marginBottom: 4 },
    resultCard: {
        flexDirection: 'row',
        gap: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#F5F5F5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    resultImageContainer: {
        width: 100,
        height: 100,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    resultImage: { width: '100%', height: '100%' },
    resultRatingTag: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    ratingText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
    resultInfo: { flex: 1, gap: 6, justifyContent: 'center' },
    resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    resultName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', flex: 1, marginRight: 8 },
    resultDesc: { fontSize: 12, color: '#888888', lineHeight: 16 },
    resultFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    resultPrice: { fontSize: 15, fontWeight: '700', color: '#8B3A1E' },
    resultTime: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    timeText: { fontSize: 11, color: '#666666', fontWeight: '500' },

    // Modal Styles (Copied from HomeScreen for consistency)
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalSheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        maxHeight: '85%',
        paddingBottom: 20,
    },
    modalDragBar: {
        width: 40,
        height: 5,
        backgroundColor: '#EAEAEA',
        borderRadius: 3,
        alignSelf: 'center',
        marginTop: 12,
    },
    modalCloseBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    modalDishShowcase: { alignItems: 'center', paddingTop: 64, paddingBottom: 20 },
    modalImageWrapper: { width: 280, height: 200, position: 'relative' },
    dishImageFrame: {
        width: 280,
        height: 200,
        borderRadius: 25,
        overflow: 'hidden',
        backgroundColor: '#FFF9F7',
    },
    dishImage: { width: '100%', height: '100%' },
    modalFavFloating: {
        position: 'absolute',
        top: -12,
        right: -12,
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
        bottom: -12,
        right: -12,
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
    modalDishInfo: { paddingHorizontal: 24, paddingBottom: 30, alignItems: 'center' },
    dishTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginBottom: 12, textAlign: 'center' },
    metaChips: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
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
    metaChipRed: { backgroundColor: '#FFEBEE', borderColor: '#C62828' },
    metaChipTextRed: { fontSize: 12, fontWeight: '600', color: '#C62828' },
    dishFullDesc: { fontSize: 14, lineHeight: 24, color: '#666666', textAlign: 'center' },
    modalBottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        backgroundColor: '#FFFFFF',
    },
    priceRupee: { fontSize: 28, fontWeight: '900', color: '#1A1A1A' },
    addToOrderBtn: {
        backgroundColor: '#8B3A1E',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 14,
    },
    addToOrderText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    qtyStepper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#8B3A1E',
        borderRadius: 14,
        overflow: 'hidden',
    },
    stepperBtn: { width: 48, height: 52, alignItems: 'center', justifyContent: 'center' },
    stepperCount: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', minWidth: 36, textAlign: 'center' },
});

export default SearchScreen;
