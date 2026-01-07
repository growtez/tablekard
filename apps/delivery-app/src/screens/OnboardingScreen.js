import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    Image,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius } from '../theme';
import Button from '../components/Button';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }) {
    const { theme } = useTheme();
    const colors = theme.colors;

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        illustrationContainer: {
            flex: 0.55,
            backgroundColor: colors.secondary,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
        },
        illustrationPlaceholder: {
            alignItems: 'center',
            justifyContent: 'center',
        },
        scooterIcon: {
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: colors.cardElevated,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.lg,
        },
        contentContainer: {
            flex: 0.45,
            backgroundColor: colors.primary,
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
            marginTop: -40,
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.xxl + spacing.lg,
            alignItems: 'center',
        },
        title: {
            fontSize: 36,
            fontWeight: '700',
            color: colors.textOnPrimary,
            textAlign: 'center',
            marginBottom: spacing.sm,
        },
        subtitle: {
            fontSize: 16,
            color: colors.textOnPrimary,
            opacity: 0.9,
            textAlign: 'center',
            marginBottom: spacing.xxl,
            lineHeight: 24,
        },
        buttonContainer: {
            width: '100%',
        },
        button: {
            backgroundColor: colors.background,
            borderRadius: borderRadius.lg,
        },
        buttonText: {
            color: colors.primary,
        },
        deliveryBadge: {
            position: 'absolute',
            bottom: 60,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.cardElevated,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.full,
        },
        badgeText: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.primary,
            marginLeft: spacing.sm,
        },
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.secondary} />

            {/* Illustration Area */}
            <View style={styles.illustrationContainer}>
                <View style={styles.illustrationPlaceholder}>
                    <View style={styles.scooterIcon}>
                        <Icon name="truck" size={60} color={colors.primary} />
                    </View>
                    <View style={styles.deliveryBadge}>
                        <Icon name="zap" size={16} color={colors.accent} />
                        <Text style={styles.badgeText}>Fast & Reliable</Text>
                    </View>
                </View>
            </View>

            {/* Content Area */}
            <View style={styles.contentContainer}>
                <Text style={styles.title}>Rider App</Text>
                <Text style={styles.subtitle}>
                    Deliver orders with ease.{'\n'}
                    Fast pickups, smooth deliveries.
                </Text>

                <View style={styles.buttonContainer}>
                    <Button
                        title="Get Started"
                        onPress={() => navigation.replace('Login')}
                        variant="secondary"
                        style={styles.button}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}
