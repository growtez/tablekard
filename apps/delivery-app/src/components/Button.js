import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { borderRadius, spacing } from '../theme';

export default function Button({
    title,
    onPress,
    variant = 'primary', // 'primary' | 'secondary' | 'outline'
    size = 'large', // 'small' | 'medium' | 'large'
    disabled = false,
    loading = false,
    icon,
    style,
}) {
    const { theme } = useTheme();
    const colors = theme.colors;

    const getButtonStyles = () => {
        const base = {
            borderRadius: borderRadius.lg,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
        };

        const sizes = {
            small: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
            medium: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
            large: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl, minHeight: 56 },
        };

        const variants = {
            primary: {
                backgroundColor: disabled ? colors.buttonPrimaryDisabled : colors.buttonPrimaryBg,
            },
            secondary: {
                backgroundColor: colors.buttonSecondaryBg,
                borderWidth: 2,
                borderColor: colors.buttonSecondaryBorder,
            },
            outline: {
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: colors.border,
            },
        };

        return { ...base, ...sizes[size], ...variants[variant] };
    };

    const getTextStyles = () => {
        const base = {
            fontWeight: '600',
        };

        const sizes = {
            small: { fontSize: 14 },
            medium: { fontSize: 16 },
            large: { fontSize: 18 },
        };

        const variants = {
            primary: { color: colors.buttonPrimaryText },
            secondary: { color: colors.buttonSecondaryText },
            outline: { color: colors.text },
        };

        return { ...base, ...sizes[size], ...variants[variant] };
    };

    return (
        <TouchableOpacity
            style={[getButtonStyles(), style]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' ? colors.buttonPrimaryText : colors.primary}
                />
            ) : (
                <>
                    {icon}
                    <Text style={[getTextStyles(), icon && { marginLeft: spacing.sm }]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}
