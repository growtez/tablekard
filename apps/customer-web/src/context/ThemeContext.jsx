import React, { createContext, useContext, useEffect } from 'react';

// Light theme only
const lightTheme = {
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
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const theme = lightTheme;

    // Apply CSS variables to document root
    useEffect(() => {
        const root = document.documentElement;

        // Primary Colors
        root.style.setProperty('--color-primary', theme.primary);
        root.style.setProperty('--color-primary-dark', theme.primaryDark);
        root.style.setProperty('--color-secondary', theme.secondary);
        root.style.setProperty('--color-accent', theme.accent);

        // Background & Cards
        root.style.setProperty('--color-background', theme.background);
        root.style.setProperty('--color-card', theme.card);
        root.style.setProperty('--color-card-elevated', theme.cardElevated);
        root.style.setProperty('--color-card-hover', theme.cardHover);

        // Text Colors
        root.style.setProperty('--color-text', theme.text);
        root.style.setProperty('--color-text-body', theme.textBody);
        root.style.setProperty('--color-text-secondary', theme.textSecondary);
        root.style.setProperty('--color-text-muted', theme.textMuted);
        root.style.setProperty('--color-text-on-dark', theme.textOnDark);

        // Status Colors
        root.style.setProperty('--color-success', theme.success);
        root.style.setProperty('--color-warning', theme.warning);
        root.style.setProperty('--color-error', theme.error);
        root.style.setProperty('--color-info', theme.info);

        // Borders & Other
        root.style.setProperty('--color-border', theme.border);
        root.style.setProperty('--color-star', theme.star);
        root.style.setProperty('--color-vegan', theme.vegan);
        root.style.setProperty('--color-non-veg', theme.nonVeg);
        root.style.setProperty('--color-overlay', theme.overlay);
        root.style.setProperty('--color-input-bg', theme.inputBg);

        // Interactive States
        root.style.setProperty('--color-link', theme.linkDefault);
        root.style.setProperty('--color-link-hover', theme.linkHover);
        root.style.setProperty('--color-active-tab', theme.activeTab);
        root.style.setProperty('--color-inactive-tab', theme.inactiveTab);
        root.style.setProperty('--color-focus-ring', theme.focusRing);

        // Icons
        root.style.setProperty('--color-icon-active', theme.iconActive);
        root.style.setProperty('--color-icon-inactive', theme.iconInactive);

        // Button States
        root.style.setProperty('--color-button-disabled', theme.buttonDisabled);

        // Set body background
        document.body.style.backgroundColor = theme.background;
        document.body.style.color = theme.text;

        // Clear any saved theme preference
        localStorage.removeItem('themeMode');
    }, []);

    const value = {
        theme,
        themeMode: 'light',
        toggleTheme: () => { },  // no-op, light mode only
        isDark: false,
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

export { lightTheme as themes };
