import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { shadows } from '../theme';

const BottomNavBar = ({ navigation, activeRoute }) => {
    const { theme } = useTheme();
    const colors = theme.colors;

    const navItems = [
        { name: 'Home', icon: 'home', route: 'Home' },
        { name: 'Menu', icon: 'grid', route: 'Menu' },
        { name: 'Orders', icon: 'shopping-bag', route: 'Orders' },
        { name: 'Profile', icon: 'user', route: 'Profile' },
    ];

    const handlePress = (route) => {
        if (route !== activeRoute) {
            navigation.navigate(route);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            {navItems.map((item) => {
                const isActive = activeRoute === item.route;
                return (
                    <TouchableOpacity
                        key={item.name}
                        style={[
                            styles.navBtn,
                            isActive && [styles.navBtnActive, { backgroundColor: colors.primary }, shadows.burgundy]
                        ]}
                        onPress={() => handlePress(item.route)}
                        activeOpacity={0.7}
                    >
                        <Icon
                            name={item.icon}
                            size={22}
                            color={isActive ? '#FFFFFF' : colors.navInactive}
                        />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        paddingBottom: 24,
        borderTopWidth: 1,
    },
    navBtn: {
        padding: 12,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navBtnActive: {
        padding: 12,
        borderRadius: 14,
    },
});

export default BottomNavBar;
