import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';

// Screens
import HomeScreen from '../screens/HomeScreen';
import MenuScreen from '../screens/MenuScreen';
import CartScreen from '../screens/CartScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import AddressScreen from '../screens/AddressScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen from '../screens/AboutScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator (Main App)
function MainTabs() {
    const { theme, isDark } = useTheme();
    const colors = theme.colors;

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.card,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    height: 65,
                    paddingBottom: 10,
                    paddingTop: 10,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.navInactive,
                tabBarShowLabel: false,
                tabBarIcon: ({ color, focused }) => {
                    let iconName;

                    if (route.name === 'Home') iconName = 'home';
                    else if (route.name === 'Menu') iconName = 'shopping-bag';
                    else if (route.name === 'Cart') iconName = 'shopping-cart';
                    else if (route.name === 'Profile') iconName = 'user';

                    return (
                        <View
                            style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                backgroundColor: focused
                                    ? colors.primary
                                    : 'transparent',
                            }}>
                            <Icon name={iconName} size={22} color={focused ? '#FFFFFF' : colors.navInactive} />
                        </View>
                    );
                },
            })}>
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Menu" component={MenuScreen} />
            <Tab.Screen name="Cart" component={CartScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

// Main App Navigator
export default function AppNavigator() {
    const { theme } = useTheme();

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: theme.colors.background },
                    animation: 'slide_from_right',
                }}>
                {/* Main App */}
                <Stack.Screen name="MainApp" component={MainTabs} />

                {/* Stacked Screens */}
                <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
                <Stack.Screen name="Orders" component={OrdersScreen} />
                <Stack.Screen name="Checkout" component={CheckoutScreen} />
                <Stack.Screen name="Address" component={AddressScreen} />
                <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="About" component={AboutScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
