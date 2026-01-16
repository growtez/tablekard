import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Animated,
    Dimensions,
    Image,
    StatusBar,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(width * 0.85, 320);

const HamburgerMenu = ({ navigation, activeRoute = 'Home' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const slideAnim = useState(new Animated.Value(-SIDEBAR_WIDTH))[0];
    const fadeAnim = useState(new Animated.Value(0))[0];

    const openSidebar = () => {
        setIsOpen(true);
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const closeSidebar = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: -SIDEBAR_WIDTH,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => setIsOpen(false));
    };

    const navigateTo = (route) => {
        closeSidebar();
        setTimeout(() => {
            navigation.navigate(route);
        }, 200);
    };

    const menuItems = [
        { icon: 'home', label: 'Home', route: 'Home' },
        { icon: 'shopping-bag', label: 'My Orders', route: 'Cart' },
        { icon: 'star', label: 'Favourites', route: null },
        { icon: 'list', label: 'Live Queue', route: 'OrderTracking' },
        { icon: 'user', label: 'Profile', route: 'Profile' },
        { icon: 'info', label: 'About', route: 'About' },
    ];

    return (
        <>
            {/* Hamburger Button - Two lines with different widths */}
            <TouchableOpacity style={styles.hamburgerBtn} onPress={openSidebar} activeOpacity={0.7}>
                <View style={styles.hamburgerLine1} />
                <View style={styles.hamburgerLine2} />
            </TouchableOpacity>

            {/* Sidebar Modal */}
            <Modal visible={isOpen} transparent animationType="none" onRequestClose={closeSidebar}>
                <StatusBar backgroundColor="rgba(26, 26, 26, 0.2)" barStyle="dark-content" />

                {/* Overlay with blur effect */}
                <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                    <TouchableOpacity style={styles.overlayTouch} onPress={closeSidebar} activeOpacity={1} />
                </Animated.View>

                {/* Sidebar */}
                <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
                    {/* Header */}
                    <View style={styles.sidebarHeader}>
                        <View style={styles.companySection}>
                            <View style={styles.companyLogo}>
                                <Image
                                    source={{ uri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&h=100&fit=crop' }}
                                    style={styles.logoImage}
                                />
                            </View>
                            <View style={styles.companyInfo}>
                                <Text style={styles.companyName}>DELISH</Text>
                                <Text style={styles.companyTagline}>THE ART OF FINE DINING</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={closeSidebar}>
                            <Text style={styles.closeBtnText}>×</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Menu Items */}
                    <View style={styles.sidebarContent}>
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.sidebarItem,
                                    activeRoute === item.route && styles.sidebarItemActive
                                ]}
                                onPress={() => item.route && navigateTo(item.route)}
                                disabled={!item.route}
                            >
                                <Icon
                                    name={item.icon}
                                    size={20}
                                    color={activeRoute === item.route ? '#FFFFFF' : '#1A1A1A'}
                                />
                                <Text style={[
                                    styles.sidebarItemText,
                                    activeRoute === item.route && styles.sidebarItemTextActive
                                ]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        {/* Logout Button */}
                        <View style={styles.logoutContainer}>
                            <TouchableOpacity style={styles.logoutBtn}>
                                <Icon name="log-out" size={20} color="#D32F2F" />
                                <Text style={styles.logoutText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    // Hamburger Button - matching customer-web exactly
    hamburgerBtn: {
        flexDirection: 'column',
        gap: 6,
        padding: 10,
        paddingLeft: 0,
    },
    hamburgerLine1: {
        width: 26,
        height: 2.5,
        backgroundColor: '#8B3A1E',
        borderRadius: 4,
    },
    hamburgerLine2: {
        width: 16,
        height: 2.5,
        backgroundColor: '#8B3A1E',
        borderRadius: 4,
    },

    // Overlay
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(26, 26, 26, 0.2)',
    },
    overlayTouch: {
        flex: 1,
    },

    // Sidebar - matching customer-web exactly
    sidebar: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        backgroundColor: '#FFFFFF',
        borderTopRightRadius: 40,
        borderBottomRightRadius: 40,
        shadowColor: '#000',
        shadowOffset: { width: 25, height: 0 },
        shadowOpacity: 0.08,
        shadowRadius: 60,
        elevation: 20,
    },

    // Header
    sidebarHeader: {
        paddingTop: Platform.OS === 'ios' ? 80 : 50,
        paddingHorizontal: 30,
        paddingBottom: 32,
        position: 'relative',
    },
    companySection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    companyLogo: {
        width: 70,
        height: 70,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#8B3A1E',
        backgroundColor: '#FFFFFF',
        padding: 2,
        shadowColor: '#8B3A1E',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 25,
        elevation: 5,
    },
    logoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    companyInfo: {},
    companyName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#8B3A1E',
        letterSpacing: 4,
        textTransform: 'uppercase',
    },
    companyTagline: {
        fontSize: 10,
        fontWeight: '600',
        color: '#8B3A1E',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        opacity: 0.8,
        marginTop: 4,
    },
    closeBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        right: 25,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#FFD8CC',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#8B3A1E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
        elevation: 3,
    },
    closeBtnText: {
        fontSize: 24,
        color: '#8B3A1E',
        marginTop: -2,
    },

    // Content
    sidebarContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    sidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginBottom: 8,
    },
    sidebarItemActive: {
        backgroundColor: '#1A1A1A',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
    },
    sidebarItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4A4A4A',
    },
    sidebarItemTextActive: {
        color: '#FFFFFF',
    },

    // Logout
    logoutContainer: {
        marginTop: 'auto',
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
        paddingTop: 24,
        marginBottom: 24,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#D32F2F',
    },
});

export default HamburgerMenu;
