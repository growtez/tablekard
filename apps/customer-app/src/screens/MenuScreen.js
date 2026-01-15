import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Modal, StatusBar, Platform, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { spacing, shadows } from '../theme';
import BottomNavBar from '../components/BottomNavBar';

const MenuScreen = ({ navigation }) => {
    const { theme, isDark } = useTheme();
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
            { id: 1, name: 'Caesar Salad', description: 'Fresh romaine lettuce', fullDescription: 'Fresh romaine lettuce tossed with creamy Caesar dressing.', price: 340, time: '15min', rating: 4.6, servings: 1, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop', isVegan: true },
            { id: 2, name: 'Chicken Wings', description: 'Spicy buffalo wings', fullDescription: 'Crispy fried chicken wings with signature buffalo sauce.', price: 480, time: '20min', rating: 4.8, servings: 2, image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=200&h=200&fit=crop', isVegan: false },
            { id: 3, name: 'Avocado Toast', description: 'Smashed avocado on sourdough', fullDescription: 'Perfectly ripe avocado on toasted artisan bread.', price: 380, time: '10min', rating: 4.4, servings: 1, image: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=200&h=200&fit=crop', isVegan: true },
        ],
        'Main Course': [
            { id: 4, name: 'Grilled Salmon', description: 'Fresh salmon with herbs', fullDescription: 'Premium Atlantic salmon grilled to perfection.', price: 740, time: '25min', rating: 4.7, servings: 1, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=200&fit=crop', isVegan: false },
            { id: 5, name: 'Pasta Carbonara', description: 'Creamy pasta with bacon', fullDescription: 'Traditional Italian pasta with crispy bacon.', price: 560, time: '20min', rating: 4.5, servings: 2, image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=200&h=200&fit=crop', isVegan: false },
            { id: 6, name: 'Veggie Burger', description: 'Plant-based patty', fullDescription: 'Delicious plant-based burger with veggies.', price: 540, time: '18min', rating: 4.3, servings: 1, image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=200&h=200&fit=crop', isVegan: true },
        ],
        'Drinks': [
            { id: 7, name: 'Fresh Orange Juice', description: 'Freshly squeezed', fullDescription: 'Pure, freshly squeezed orange juice.', price: 180, time: '5min', rating: 4.8, servings: 1, image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&h=200&fit=crop', isVegan: true },
            { id: 8, name: 'Iced Coffee', description: 'Cold brew coffee', fullDescription: 'Smooth cold brew steeped for 12 hours.', price: 140, time: '3min', rating: 4.6, servings: 1, image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&h=200&fit=crop', isVegan: true },
        ],
        'Desserts': [
            { id: 10, name: 'Chocolate Cake', description: 'Rich chocolate cake', fullDescription: 'Decadent triple-layer chocolate cake.', price: 300, time: '5min', rating: 4.9, servings: 1, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop', isVegan: false },
            { id: 11, name: 'Tiramisu', description: 'Classic Italian dessert', fullDescription: 'Authentic tiramisu with mascarpone cream.', price: 320, time: '5min', rating: 4.8, servings: 1, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=200&h=200&fit=crop', isVegan: false },
        ],
    };

    const toggleFavorite = (id) => setFavorites(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    const addToCart = (item) => setCart(prev => {
        const existing = prev.find(c => c.id === item.id);
        if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
        return [...prev, { ...item, quantity: 1 }];
    });
    const handleItemClick = (item) => { setSelectedItem(item); setShowModal(true); };

    const filteredItems = menuItems[selectedCategory]?.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())) || [];
    const totalCartItems = cart.reduce((t, i) => t + i.quantity, 0);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

            <ScrollView showsVerticalScrollIndicator={false}>
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
                                {totalCartItems > 0 && <View style={[styles.likedCount, { backgroundColor: colors.primary }]}><Text style={styles.likedCountText}>{totalCartItems}</Text></View>}
                            </TouchableOpacity>
                            <View style={styles.profileAvatar}><Image source={{ uri: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=80' }} style={styles.avatarImage} /></View>
                        </View>
                    </View>

                    <View style={styles.mainTitle}>
                        <Text style={[styles.titleText, { color: colors.text }]}>Our <Text style={styles.highlight}>Delicious</Text></Text>
                        <Text style={[styles.titleText, { color: colors.text }]}><Text style={styles.highlight}>Menu</Text></Text>
                    </View>

                    <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                        <Icon name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
                        <TextInput placeholder="Search your favourite food" placeholderTextColor={colors.textMuted} style={[styles.searchInput, { color: colors.text }]} value={searchTerm} onChangeText={setSearchTerm} />
                        <Icon name="sliders" size={20} color={colors.textMuted} />
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
                    {categories.map(cat => (
                        <TouchableOpacity key={cat} style={[styles.categoryBtn, { backgroundColor: selectedCategory === cat ? colors.primary : colors.card }]} onPress={() => setSelectedCategory(cat)}>
                            <Text style={[styles.categoryText, { color: selectedCategory === cat ? '#1a1a1a' : colors.textMuted }]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.foodItems}>
                    {filteredItems.map(item => (
                        <TouchableOpacity key={item.id} style={[styles.foodItem, { backgroundColor: colors.card }]} onPress={() => handleItemClick(item)}>
                            <View style={styles.foodImage}>
                                <Image source={{ uri: item.image }} style={styles.foodImageContent} />
                                <TouchableOpacity style={styles.favoriteBtn} onPress={() => toggleFavorite(item.id)}>
                                    <Icon name="heart" size={18} color={favorites.includes(item.id) ? colors.primary : '#FFFFFF'} />
                                </TouchableOpacity>
                                {item.isVegan && <View style={[styles.veganBadge, { backgroundColor: colors.vegan }]}><Text style={styles.veganText}>Veg</Text></View>}
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

            {totalCartItems > 0 && (
                <TouchableOpacity style={[styles.cartIndicator, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('Cart')}>
                    <Text style={styles.cartIndicatorText}>{totalCartItems} items in cart</Text>
                </TouchableOpacity>
            )}

            <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
                {selectedItem && (
                    <View style={styles.modalOverlay}>
                        <TouchableOpacity style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]} onPress={() => setShowModal(false)} />
                        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedItem.name}</Text>
                                <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: colors.inputBg }]} onPress={() => setShowModal(false)}><Icon name="x" size={20} color={colors.text} /></TouchableOpacity>
                            </View>
                            <View style={styles.modalMainImage}><Image source={{ uri: selectedItem.image }} style={styles.modalImage} /></View>
                            <View style={styles.modalContentSection}>
                                <View style={[styles.modalServesInfo, { backgroundColor: colors.primary + '15' }]}><Text style={[styles.modalServesText, { color: colors.primary }]}>Serves {selectedItem.servings}</Text></View>
                                <View style={styles.modalTimeRatingRow}>
                                    <View style={styles.modalTimeRatingLeft}>
                                        <View style={[styles.modalItemTime, { backgroundColor: colors.inputBg }]}><Text style={[styles.modalTimeText, { color: colors.text }]}>{selectedItem.time}</Text></View>
                                        <View style={styles.modalRatingSection}><Icon name="star" size={16} color={colors.primary} /><Text style={[styles.modalRatingText, { color: colors.text }]}>{selectedItem.rating}</Text></View>
                                    </View>
                                    <TouchableOpacity style={[styles.modalAddBtn, { backgroundColor: colors.primary }]} onPress={() => { addToCart(selectedItem); setShowModal(false); }}><Text style={styles.modalAddBtnText}>ADD</Text></TouchableOpacity>
                                </View>
                                <Text style={[styles.modalPrice, { color: colors.primary }]}>₹{selectedItem.price}</Text>
                                <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>{selectedItem.fullDescription}</Text>
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
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    menuIcon: { gap: 4 },
    hamburger: { width: 24, height: 3, borderRadius: 2 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    likedItemsBtn: { padding: 8, borderRadius: 50, position: 'relative' },
    likedCount: { position: 'absolute', top: -2, right: -2, borderRadius: 9, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
    likedCountText: { color: '#1a1a1a', fontSize: 10, fontWeight: 'bold' },
    profileAvatar: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    mainTitle: { marginBottom: 32 },
    titleText: { fontSize: 32, fontWeight: '600', lineHeight: 40 },
    highlight: { fontWeight: '700' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16 },
    searchIcon: { marginRight: 12 },
    searchInput: { flex: 1, fontSize: 16 },
    categoriesContainer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: 12 },
    categoryBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, marginRight: 12 },
    categoryText: { fontSize: 14, fontWeight: '500' },
    foodItems: { paddingHorizontal: spacing.lg, gap: 16 },
    foodItem: { position: 'relative', flexDirection: 'row', borderRadius: 16, padding: 16, overflow: 'hidden' },
    foodImage: { position: 'relative', width: 80, height: 80, borderRadius: 12, overflow: 'hidden', marginRight: 16 },
    foodImageContent: { width: '100%', height: '100%' },
    favoriteBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
    veganBadge: { position: 'absolute', bottom: 4, left: 4, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
    veganText: { color: '#FFFFFF', fontSize: 8, fontWeight: '700' },
    foodInfo: { flex: 1, justifyContent: 'space-between', minHeight: 80 },
    foodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    foodName: { fontSize: 16, fontWeight: '600', lineHeight: 20, maxWidth: '70%' },
    addBtn: { borderRadius: 8, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    foodMeta: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    timeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    timeText: { fontSize: 12 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingText: { fontSize: 12, fontWeight: '500' },
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

export default MenuScreen;
