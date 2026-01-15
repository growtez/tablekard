import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    StatusBar,
    Platform,
    Dimensions,
    Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { spacing, shadows } from '../theme';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const colors = theme.colors;

    const [userProfile, setUserProfile] = useState({
        name: 'S & S',
        email: 's&s123@email.com',
        phone: '+91 98765 43210',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face',
        tableNumber: 'T-12',
        stats: {
            todaysOrders: 3,
            totalSpent: 2450,
            favoriteItems: 8
        }
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ ...userProfile });

    const handleEditToggle = () => {
        if (isEditing) {
            setUserProfile({ ...editForm });
        } else {
            setEditForm({ ...userProfile });
        }
        setIsEditing(!isEditing);
    };

    const handleInputChange = (field, value) => {
        setEditForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const menuItems = [
        { icon: 'clock', title: 'Order History', description: 'View all your orders', route: 'Orders' },
        { icon: 'heart', title: 'Favorites', description: 'Your favorite dishes', route: null },
        { icon: 'message-square', title: 'Feedback & Ratings', description: 'Rate your dining experience', route: null },
        { icon: 'info', title: 'About Restaurant', description: 'Story, timings & more', route: 'About' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.primaryLight} />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Header with Gradient */}
                <View style={[styles.heroSection, { backgroundColor: colors.primaryLight }]}>
                    {/* Pattern overlay could be added as an image */}
                    <View style={styles.heroHeader}>
                        <TouchableOpacity style={styles.hamburger}>
                            <View style={[styles.hamburgerLine, { backgroundColor: colors.primary }]} />
                            <View style={[styles.hamburgerLine, { backgroundColor: colors.primary, width: 16 }]} />
                            <View style={[styles.hamburgerLine, { backgroundColor: colors.primary }]} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.editBtn, { backgroundColor: colors.card }]}
                            onPress={handleEditToggle}
                        >
                            <Icon name="edit-2" size={18} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Floating Avatar */}
                    <View style={styles.avatarSection}>
                        <View style={[styles.avatarWrapper, { borderColor: colors.primary }]}>
                            <Image source={{ uri: userProfile.avatar }} style={styles.avatar} />
                            <TouchableOpacity
                                style={[styles.cameraBtn, { backgroundColor: colors.primary }]}
                            >
                                <Icon name="camera" size={14} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.heroInfo}>
                        <Text style={[styles.userName, { color: colors.text }]}>{userProfile.name}</Text>
                        <Text style={[styles.userEmail, { color: colors.textMuted }]}>{userProfile.email}</Text>
                        <View style={[styles.tableIndicator, { backgroundColor: colors.card }]}>
                            <Icon name="map-pin" size={14} color={colors.primary} />
                            <Text style={[styles.tableText, { color: colors.text }]}>Table {userProfile.tableNumber}</Text>
                        </View>
                    </View>
                </View>

                {/* Profile Content */}
                <View style={styles.content}>
                    {/* Edit Form */}
                    {isEditing && (
                        <View style={[styles.editForm, { backgroundColor: colors.card }]}>
                            <Text style={[styles.editTitle, { color: colors.text }]}>Edit Profile</Text>

                            <View style={styles.formGroup}>
                                <Text style={[styles.formLabel, { color: colors.textMuted }]}>Full Name</Text>
                                <TextInput
                                    style={[styles.formInput, { backgroundColor: colors.background, color: colors.text }]}
                                    value={editForm.name}
                                    onChangeText={(value) => handleInputChange('name', value)}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={[styles.formLabel, { color: colors.textMuted }]}>Email</Text>
                                <TextInput
                                    style={[styles.formInput, { backgroundColor: colors.background, color: colors.text }]}
                                    value={editForm.email}
                                    onChangeText={(value) => handleInputChange('email', value)}
                                    keyboardType="email-address"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={[styles.formLabel, { color: colors.textMuted }]}>Phone</Text>
                                <TextInput
                                    style={[styles.formInput, { backgroundColor: colors.background, color: colors.text }]}
                                    value={editForm.phone}
                                    onChangeText={(value) => handleInputChange('phone', value)}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <View style={styles.formActions}>
                                <TouchableOpacity
                                    style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                                    onPress={handleEditToggle}
                                >
                                    <Text style={styles.saveBtnText}>Save Changes</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.cancelBtn, { borderColor: colors.border }]}
                                    onPress={() => setIsEditing(false)}
                                >
                                    <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Stats Row */}
                    <View style={[styles.statsRow, { backgroundColor: colors.card }]}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.text }]}>{userProfile.stats.todaysOrders}</Text>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Orders Today</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                        <View style={[styles.statItem, styles.featuredStat]}>
                            <Text style={[styles.statValue, { color: colors.primary }]}>₹{userProfile.stats.totalSpent}</Text>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Spent</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.text }]}>{userProfile.stats.favoriteItems}</Text>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Favorites</Text>
                        </View>
                    </View>

                    {/* Quick Actions */}
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: colors.card }]}
                            onPress={() => navigation.navigate('Menu')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
                                <Icon name="shopping-bag" size={22} color={colors.primary} />
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>Menu</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: colors.card }]}
                            onPress={() => navigation.navigate('Orders')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
                                <Icon name="clock" size={22} color={colors.primary} />
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>Orders</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: colors.card }]}
                            onPress={() => navigation.navigate('OrderTracking')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
                                <Icon name="list" size={22} color={colors.primary} />
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>Live Queue</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Menu Section */}
                    <View style={[styles.menuSection, { backgroundColor: colors.card }]}>
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.menuItem,
                                    index !== menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                                ]}
                                onPress={() => item.route && navigation.navigate(item.route)}
                            >
                                <View style={[styles.menuIcon, { backgroundColor: colors.primaryLight }]}>
                                    <Icon name={item.icon} size={20} color={colors.primary} />
                                </View>
                                <View style={styles.menuInfo}>
                                    <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
                                    <Text style={[styles.menuDesc, { color: colors.textMuted }]}>{item.description}</Text>
                                </View>
                                <Icon name="chevron-right" size={18} color={colors.textMuted} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Restaurant Info Card */}
                    <View style={[styles.restaurantCard, { backgroundColor: colors.card }]}>
                        <View style={styles.restaurantHeader}>
                            <Icon name="star" size={16} color={colors.primary} />
                            <Text style={[styles.restaurantName, { color: colors.text }]}>Delish Restaurant</Text>
                        </View>
                        <View style={styles.restaurantContact}>
                            <TouchableOpacity
                                style={styles.contactLink}
                                onPress={() => Linking.openURL('tel:+911234567890')}
                            >
                                <Icon name="phone" size={16} color={colors.primary} />
                                <Text style={[styles.contactText, { color: colors.text }]}>+91 123 456 7890</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.contactLink}
                                onPress={() => Linking.openURL('mailto:support@delish.com')}
                            >
                                <Icon name="mail" size={16} color={colors.primary} />
                                <Text style={[styles.contactText, { color: colors.text }]}>support@delish.com</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.error }]}>
                        <Icon name="log-out" size={18} color={colors.error} />
                        <Text style={[styles.logoutText, { color: colors.error }]}>Sign Out</Text>
                    </TouchableOpacity>

                    <View style={{ height: 30 }} />
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Hero Section
    heroSection: {
        paddingTop: Platform.OS === 'ios' ? 50 : 16,
        paddingBottom: 30,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    hamburger: { gap: 4, padding: 8 },
    hamburgerLine: { width: 20, height: 2.5, borderRadius: 2 },
    editBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Avatar
    avatarSection: {
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
    },
    cameraBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Hero Info
    heroInfo: {
        alignItems: 'center',
    },
    userName: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        marginBottom: 12,
    },
    tableIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    tableText: {
        fontSize: 13,
        fontWeight: '600',
    },

    // Content
    content: {
        padding: 20,
    },

    // Edit Form
    editForm: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    editTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    formGroup: {
        marginBottom: 16,
    },
    formLabel: {
        fontSize: 12,
        marginBottom: 8,
    },
    formInput: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
    },
    formActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    saveBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    cancelBtnText: {
        fontSize: 15,
        fontWeight: '600',
    },

    // Stats Row
    statsRow: {
        flexDirection: 'row',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    featuredStat: {},
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        height: 40,
        marginHorizontal: 16,
    },

    // Quick Actions
    quickActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    actionCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 20,
        borderRadius: 16,
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
    },

    // Menu Section
    menuSection: {
        borderRadius: 20,
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    menuIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    menuInfo: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    menuDesc: {
        fontSize: 12,
    },

    // Restaurant Card
    restaurantCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    restaurantHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    restaurantName: {
        fontSize: 16,
        fontWeight: '700',
    },
    restaurantContact: {
        gap: 12,
    },
    contactLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    contactText: {
        fontSize: 14,
    },

    // Logout
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1.5,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '600',
    },
});

export default ProfileScreen;
