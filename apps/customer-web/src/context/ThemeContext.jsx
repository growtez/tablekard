import React, { createContext, useContext, useState, useEffect } from 'react';

// Theme color definitions
const themes = {
    dark: {
        mode: 'dark',
        primary: '#d9b550',
        primaryDark: '#b8973f',
        background: '#212121',
        card: '#2D2D2D',
        cardHover: '#333333',
        text: '#FFFFFF',
        textSecondary: '#CCCCCC',
        textMuted: '#888888',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#FF4444',
        border: '#333333',
        star: '#FFD700',
        vegan: '#22c55e',
        nonVeg: '#ef4444',
        overlay: 'rgba(0, 0, 0, 0.8)',
        inputBg: 'rgba(255, 255, 255, 0.1)',
    },
    light: {
        mode: 'light',
        // Primary Brand Colors
        primary: '#8B3A1E',           // Deep Sushi Brown
        primaryDark: '#6F2D17',       // Dark Cocoa (hover)
        secondary: '#FFD6C9',         // Warm Peach
        accent: '#F2B84B',            // Golden Mustard

        // Light Theme Base
        background: '#FFFFFF',        // Pure White
        card: '#FFF7F3',              // Soft Cream
        cardElevated: '#FFEDE5',      // Light Peach Tint
        cardHover: '#FFF0EA',         // Button hover background

        // Typography Colors
        text: '#1A1A1A',              // Near Black (headings)
        textBody: '#3A3A3A',          // Charcoal (body text)
        textSecondary: '#7A6F6B',     // Muted Brown-Gray
        textMuted: '#B8ADA9',         // Soft Gray (placeholder/disabled)
        textOnDark: '#FFFFFF',        // White (text on dark backgrounds)

        // Borders & Dividers
        border: '#E8E1DD',            // Warm Gray

        // Status Colors
        success: '#4CAF50',           // Leaf Green
        warning: '#F2B84B',           // Mustard
        error: '#E14B4B',             // Soft Red
        info: '#5C7A7A',              // Warm Blue-Gray

        // Other
        star: '#F2B84B',              // Golden Mustard for ratings
        vegan: '#4CAF50',             // Leaf Green
        nonVeg: '#E14B4B',            // Soft Red
        overlay: 'rgba(0, 0, 0, 0.5)',
        inputBg: 'rgba(139, 58, 30, 0.05)',  // Subtle primary tint

        // Interactive states
        linkDefault: '#8B3A1E',
        linkHover: '#6F2D17',
        activeTab: '#8B3A1E',
        inactiveTab: '#9C8F8A',
        focusRing: 'rgba(139, 58, 30, 0.25)',

        // Icons
        iconActive: '#8B3A1E',
        iconInactive: '#9C8F8A',

        // Button states
        buttonDisabled: '#C9A99E',
    },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [themeMode, setThemeMode] = useState(() => {
        // Get saved theme from localStorage, default to 'dark'
        const saved = localStorage.getItem('themeMode');
        return saved || 'dark';
    });

    const theme = themes[themeMode] || themes.dark;
    const isDark = themeMode === 'dark';

    // Apply CSS variables to document root
    useEffect(() => {
        const root = document.documentElement;

        // Primary Colors
        root.style.setProperty('--color-primary', theme.primary);
        root.style.setProperty('--color-primary-dark', theme.primaryDark);
        root.style.setProperty('--color-secondary', theme.secondary || theme.primary);
        root.style.setProperty('--color-accent', theme.accent || theme.primary);

        // Background & Cards
        root.style.setProperty('--color-background', theme.background);
        root.style.setProperty('--color-card', theme.card);
        root.style.setProperty('--color-card-elevated', theme.cardElevated || theme.card);
        root.style.setProperty('--color-card-hover', theme.cardHover);

        // Text Colors
        root.style.setProperty('--color-text', theme.text);
        root.style.setProperty('--color-text-body', theme.textBody || theme.text);
        root.style.setProperty('--color-text-secondary', theme.textSecondary);
        root.style.setProperty('--color-text-muted', theme.textMuted);
        root.style.setProperty('--color-text-on-dark', theme.textOnDark || '#FFFFFF');

        // Status Colors
        root.style.setProperty('--color-success', theme.success);
        root.style.setProperty('--color-warning', theme.warning);
        root.style.setProperty('--color-error', theme.error);
        root.style.setProperty('--color-info', theme.info || theme.textSecondary);

        // Borders & Other
        root.style.setProperty('--color-border', theme.border);
        root.style.setProperty('--color-star', theme.star);
        root.style.setProperty('--color-vegan', theme.vegan);
        root.style.setProperty('--color-non-veg', theme.nonVeg);
        root.style.setProperty('--color-overlay', theme.overlay);
        root.style.setProperty('--color-input-bg', theme.inputBg);

        // Interactive States
        root.style.setProperty('--color-link', theme.linkDefault || theme.primary);
        root.style.setProperty('--color-link-hover', theme.linkHover || theme.primaryDark);
        root.style.setProperty('--color-active-tab', theme.activeTab || theme.primary);
        root.style.setProperty('--color-inactive-tab', theme.inactiveTab || theme.textMuted);
        root.style.setProperty('--color-focus-ring', theme.focusRing || 'rgba(0, 0, 0, 0.1)');

        // Icons
        root.style.setProperty('--color-icon-active', theme.iconActive || theme.primary);
        root.style.setProperty('--color-icon-inactive', theme.iconInactive || theme.textMuted);

        // Button States
        root.style.setProperty('--color-button-disabled', theme.buttonDisabled || theme.textMuted);

        // Set body background
        document.body.style.backgroundColor = theme.background;
        document.body.style.color = theme.text;

        // Save to localStorage
        localStorage.setItem('themeMode', themeMode);
    }, [themeMode, theme]);

    const toggleTheme = (mode) => {
        setThemeMode(mode);
    };

    const value = {
        theme,
        themeMode,
        toggleTheme,
        isDark,
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
            theme: themes.dark,
            themeMode: 'dark',
            toggleTheme: () => { },
            isDark: true,
        };
    }
    return context;
}

export { themes };
