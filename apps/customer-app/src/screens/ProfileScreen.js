import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Platform,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { spacing, shadows } from '../theme';
import BottomNavBar from '../components/BottomNavBar';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
    const { theme, isDark } = useTheme();
    const colors = theme.colors;

    const user = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+91 98765 43210',
        memberSince: 'Jan 2024',
    };

    // Stats for the hero section
    const stats = [
        { label: 'Orders', value: '24' },
        { label: 'Points', value: '1.2k' },
        { label: 'Saved', value: '₹856' },
    ];

    // Action cards grid
    const actionCards = [
        { id: 1, icon: 'shopping-bag', label: 'My Orders', screen: 'Orders', color: colors.primary },
        { id: 2, icon: 'star', label: 'Feedback', screen: 'Feedback', color: '#F2B84B' },
        { id: 3, icon: 'clock', label: 'Live Queue', screen: 'LiveQueue', color: '#22C55E' },
        { id: 4, icon: 'info', label: 'About Us', screen: 'About', color: colors.primary },
    ];

    // Menu items
    const menuItems = [
        { id: 1, icon: 'map-pin', label: 'Saved Addresses', screen: 'Address' },
        { id: 2, icon: 'credit-card', label: 'Payment Methods', screen: null },
        { id: 3, icon: 'heart', label: 'Favorites', screen: null },
        { id: 4, icon: 'bell', label: 'Notifications', screen: null },
        { id: 5, icon: 'settings', label: 'Settings', screen: 'Settings' },
        { id: 6, icon: 'help-circle', label: 'Help & Support', screen: null },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.primaryLight} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Hero Section with Gradient Background */}
                <View style={[styles.heroSection, { backgroundColor: colors.primaryLight }]}>
                    {/* Header Row */}
                    <View style={styles.heroHeader}>
                        <TouchableOpacity style={styles.menuBtn}>
                            <View style={[styles.hamburger, { backgroundColor: colors.primary }]} />
                            <View style={[styles.hamburger, { backgroundColor: colors.primary }]} />
                            <View style={[styles.hamburger, { backgroundColor: colors.primary }]} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.editBtn, { backgroundColor: colors.card }]}
                            onPress={() => navigation.navigate('EditProfile')}
                        >
                            <Icon name="edit-2" size={18} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Avatar */}
                    <View style={styles.avatarWrapper}>
                        <View style={[styles.avatarRing, { borderColor: colors.primary + '40' }]}>
                            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                                <Text style={styles.avatarText}>JD</Text>
                            </View>
                        </View>
                    </View>

                    {/* User Info */}
                    <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
                    <Text style={[styles.userSubtitle, { color: colors.textMuted }]}>
                        Member since {user.memberSince}
                    </Text>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        {stats.map((stat, index) => (
                            <View
                                key={stat.label}
                                style={[
                                    styles.statItem,
                                    index !== stats.length - 1 && { borderRightWidth: 1, borderRightColor: colors.border }
                                ]}
                            >
                                <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Content Section */}
                <View style={styles.contentSection}>
                    {/* Action Cards Grid */}
                    <View style={styles.actionGrid}>
                        {actionCards.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                style={[styles.actionCard, { backgroundColor: colors.card }, shadows.md]}
                                onPress={() => action.screen && navigation.navigate(action.screen)}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                                    <Icon name={action.icon} size={22} color={action.color} />
                                </View>
                                <Text style={[styles.actionLabel, { color: colors.text }]}>{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Menu Section */}
                    <View style={[styles.menuSection, { backgroundColor: colors.card }, shadows.sm]}>
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.menuItem,
                                    index !== menuItems.length - 1 && {
                                        borderBottomWidth: 1,
                                        borderBottomColor: colors.border
                                    }
                                ]}
                                onPress={() => item.screen && navigation.navigate(item.screen)}
                            >
                                <View style={[styles.menuIconWrap, { backgroundColor: colors.primaryLight }]}>
                                    <Icon name={item.icon} size={18} color={colors.primary} />
                                </View>
                                <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                                <Icon name="chevron-right" size={18} color={colors.navInactive} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.error }]}>
                        <Icon name="log-out" size={18} color={colors.error} />
                        <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom Padding for NavBar */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Navigation */}
            <BottomNavBar navigation={navigation} activeRoute="Profile" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    scrollContent: {
        paddingBottom: 20,
    },

    // Hero Section
    heroSection: {
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingHorizontal: 20,
        paddingBottom: 32,
        alignItems: 'center',
    },
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 24,
    },
    menuBtn: {
        gap: 4,
        padding: 8,
    },
    hamburger: {
        width: 22,
        height: 2.5,
        borderRadius: 2,
    },
    editBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarWrapper: {
        marginBottom: 16,
    },
    avatarRing: {
        padding: 4,
        borderRadius: 50,
        borderWidth: 3,
        borderStyle: 'dashed',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
    },
    userSubtitle: {
        fontSize: 13,
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-around',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
    },

    // Content Section
    contentSection: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },

    // Action Grid
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    actionCard: {
        width: (width - 52) / 2,
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
    },
    actionIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '600',
    },

    // Menu Section
    menuSection: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 24,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    menuIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    menuLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },

    // Logout
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        gap: 8,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '700',
    },
});

export default ProfileScreen;
