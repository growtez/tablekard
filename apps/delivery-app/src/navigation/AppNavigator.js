import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';

// Screens
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import PickupScreen from '../screens/PickupScreen';
import DeliveryScreen from '../screens/DeliveryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NavigationMapScreen from '../screens/NavigationMapScreen';

const Stack = createNativeStackNavigator();

// Auth Navigator (Onboarding + Login)
function AuthNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
    );
}

// Main App Navigator (After Login)
function MainNavigator() {
    const { theme } = useTheme();

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.colors.background },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Pickup" component={PickupScreen} />
            <Stack.Screen name="Delivery" component={DeliveryScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="NavigationMap" component={NavigationMapScreen} />
        </Stack.Navigator>
    );
}

// Root App Navigator
export default function AppNavigator() {
    const { theme } = useTheme();

    // TODO: Add auth state check here
    // For now, always show auth flow first
    const isAuthenticated = false;
    const isFirstLaunch = true;

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                }}
            >
                {isAuthenticated ? (
                    <Stack.Screen name="Main" component={MainNavigator} />
                ) : (
                    <>
                        <Stack.Screen name="Auth" component={AuthNavigator} />
                        <Stack.Screen name="Main" component={MainNavigator} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
