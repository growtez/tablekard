import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius } from '../theme';
import Button from '../components/Button';

// Input Field Component - defined OUTSIDE to prevent re-renders
function InputField({
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    error,
    secureTextEntry,
    showPassword,
    onTogglePassword,
    colors,
    styles,
}) {
    const [focused, setFocused] = useState(false);

    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={[
                styles.inputContainer,
                error && styles.inputContainerError,
                focused && styles.inputContainerFocused,
            ]}>
                <Icon
                    name={icon}
                    size={20}
                    color={focused ? colors.primary : colors.iconInactive}
                    style={styles.inputIcon}
                />
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={secureTextEntry && !showPassword}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    autoCapitalize="none"
                />
                {onTogglePassword && (
                    <TouchableOpacity onPress={onTogglePassword}>
                        <Icon
                            name={showPassword ? 'eye-off' : 'eye'}
                            size={20}
                            color={colors.iconInactive}
                        />
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

export default function LoginScreen({ navigation }) {
    const { theme } = useTheme();
    const colors = theme.colors;

    const [restaurantId, setRestaurantId] = useState('');
    const [riderId, setRiderId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        if (!restaurantId.trim()) newErrors.restaurantId = 'Restaurant ID is required';
        if (!riderId.trim()) newErrors.riderId = 'Rider ID is required';
        if (!password.trim()) newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        setLoading(true);
        // TODO: Implement Firebase authentication
        setTimeout(() => {
            setLoading(false);
            navigation.replace('Main');
        }, 1500);
    };

    const togglePassword = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        scrollContent: {
            flexGrow: 1,
            paddingHorizontal: spacing.xl,
        },
        header: {
            paddingTop: spacing.xxl,
            paddingBottom: spacing.xl,
            alignItems: 'center',
        },
        logoContainer: {
            width: 80,
            height: 80,
            borderRadius: 20,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.lg,
        },
        title: {
            fontSize: 28,
            fontWeight: '700',
            color: colors.text,
            marginBottom: spacing.xs,
        },
        subtitle: {
            fontSize: 16,
            color: colors.textSecondary,
            textAlign: 'center',
        },
        form: {
            flex: 1,
            paddingTop: spacing.xl,
        },
        inputGroup: {
            marginBottom: spacing.lg,
        },
        label: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
            marginBottom: spacing.sm,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: spacing.md,
        },
        inputContainerError: {
            borderColor: colors.error,
        },
        inputContainerFocused: {
            borderColor: colors.primary,
            borderWidth: 2,
        },
        inputIcon: {
            marginRight: spacing.sm,
        },
        input: {
            flex: 1,
            fontSize: 16,
            color: colors.text,
            paddingVertical: spacing.md,
        },
        errorText: {
            fontSize: 12,
            color: colors.error,
            marginTop: spacing.xs,
        },
        forgotPassword: {
            alignSelf: 'flex-end',
            marginBottom: spacing.xl,
        },
        forgotPasswordText: {
            fontSize: 14,
            color: colors.primary,
            fontWeight: '600',
        },
        footer: {
            paddingBottom: spacing.xxl,
        },
        footerText: {
            textAlign: 'center',
            fontSize: 14,
            color: colors.textSecondary,
            marginTop: spacing.lg,
        },
        helpLink: {
            color: colors.primary,
            fontWeight: '600',
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Icon name="truck" size={36} color={colors.textOnPrimary} />
                        </View>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Sign in to start delivering</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <InputField
                            label="Restaurant ID"
                            value={restaurantId}
                            onChangeText={setRestaurantId}
                            placeholder="Enter restaurant ID"
                            icon="home"
                            error={errors.restaurantId}
                            colors={colors}
                            styles={styles}
                        />

                        <InputField
                            label="Rider ID"
                            value={riderId}
                            onChangeText={setRiderId}
                            placeholder="Enter your rider ID"
                            icon="user"
                            error={errors.riderId}
                            colors={colors}
                            styles={styles}
                        />

                        <InputField
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter password"
                            icon="lock"
                            error={errors.password}
                            secureTextEntry
                            showPassword={showPassword}
                            onTogglePassword={togglePassword}
                            colors={colors}
                            styles={styles}
                        />

                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Button
                            title="Sign In"
                            onPress={handleLogin}
                            loading={loading}
                        />
                        <Text style={styles.footerText}>
                            Need help? <Text style={styles.helpLink}>Contact Support</Text>
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
