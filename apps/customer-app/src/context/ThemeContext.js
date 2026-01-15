import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { shadows } from '../theme';

// Premium Light Theme (Burgundy + Cream - matching customer-web)
const lightTheme = {
    mode: 'light',
    colors: {
        // Primary brand colors
        primary: '#8B3A1E',
        primaryDark: '#6D2D17',
        primaryLight: '#FFF0EC',
        primaryBorder: '#FFD8CC',

        // Backgrounds
        background: '#FAFAFA',
        backgroundPure: '#FFFFFF',
        card: '#FFFFFF',
        cardHover: '#FFF7F3',

        // Text
        text: '#1A1A1A',
        textSecondary: '#555555',
        textMuted: '#888888',

        // Navigation
        navInactive: '#D4A59A',
        navActive: '#8B3A1E',

        // Status
        success: '#22C55E',
        successLight: '#E8F5E9',
        warning: '#F2B84B',
        error: '#E14B4B',
        errorLight: '#FFEBEE',

        // Borders
        border: '#F0F0F0',
        borderDark: '#E8E1DD',

        // Special
        star: '#F2B84B',
        overlay: 'rgba(0, 0, 0, 0.5)',
        inputBg: 'rgba(139, 58, 30, 0.05)',

        // Badges
        vegan: '#2E7D32',
        veganBg: '#E8F5E9',
        nonVeg: '#C62828',
        nonVegBg: '#FFEBEE',
    },
    shadows,
};

// Dark Theme (optional - keeping for future)
const darkTheme = {
    mode: 'dark',
    colors: {
        // Primary brand colors
        primary: '#D4A59A',
        primaryDark: '#8B3A1E',
        primaryLight: '#3D2A24',
        primaryBorder: '#5D3D35',

        // Backgrounds
        background: '#1A1A1A',
        backgroundPure: '#0D0D0D',
        card: '#2D2D2D',
        cardHover: '#333333',

        // Text
        text: '#FFFFFF',
        textSecondary: '#CCCCCC',
        textMuted: '#888888',

        // Navigation
        navInactive: '#6D5D58',
        navActive: '#D4A59A',

        // Status
        success: '#4CAF50',
        successLight: '#1B3D1B',
        warning: '#F2B84B',
        error: '#EF4444',
        errorLight: '#3D1B1B',

        // Borders
        border: '#333333',
        borderDark: '#444444',

        // Special
        star: '#F2B84B',
        overlay: 'rgba(0, 0, 0, 0.8)',
        inputBg: 'rgba(255, 255, 255, 0.08)',

        // Badges
        vegan: '#4CAF50',
        veganBg: '#1B3D1B',
        nonVeg: '#EF4444',
        nonVegBg: '#3D1B1B',
    },
    shadows,
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeMode] = useState('light'); // Default to light (matching customer-web)

    const toggleTheme = (mode) => {
        setThemeMode(mode);
    };

    const getActiveTheme = () => {
        if (themeMode === 'system') {
            return systemColorScheme === 'dark' ? darkTheme : lightTheme;
        }
        return themeMode === 'dark' ? darkTheme : lightTheme;
    };

    const theme = getActiveTheme();

    const value = {
        theme,
        themeMode,
        toggleTheme,
        isDark: theme.mode === 'dark',
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        return {
            theme: lightTheme,
            themeMode: 'light',
            toggleTheme: () => { },
            isDark: false,
        };
    }
    return context;
}

export { darkTheme, lightTheme };

