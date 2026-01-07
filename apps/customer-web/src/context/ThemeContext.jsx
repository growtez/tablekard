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
        primary: '#d9b550',
        primaryDark: '#b8973f',
        background: '#F5F5F5',
        card: '#FFFFFF',
        cardHover: '#EEEEEE',
        text: '#212121',
        textSecondary: '#666666',
        textMuted: '#999999',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#FF4444',
        border: '#E0E0E0',
        star: '#FFD700',
        vegan: '#22c55e',
        nonVeg: '#ef4444',
        overlay: 'rgba(0, 0, 0, 0.5)',
        inputBg: 'rgba(0, 0, 0, 0.05)',
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

        root.style.setProperty('--color-primary', theme.primary);
        root.style.setProperty('--color-primary-dark', theme.primaryDark);
        root.style.setProperty('--color-background', theme.background);
        root.style.setProperty('--color-card', theme.card);
        root.style.setProperty('--color-card-hover', theme.cardHover);
        root.style.setProperty('--color-text', theme.text);
        root.style.setProperty('--color-text-secondary', theme.textSecondary);
        root.style.setProperty('--color-text-muted', theme.textMuted);
        root.style.setProperty('--color-success', theme.success);
        root.style.setProperty('--color-warning', theme.warning);
        root.style.setProperty('--color-error', theme.error);
        root.style.setProperty('--color-border', theme.border);
        root.style.setProperty('--color-star', theme.star);
        root.style.setProperty('--color-vegan', theme.vegan);
        root.style.setProperty('--color-non-veg', theme.nonVeg);
        root.style.setProperty('--color-overlay', theme.overlay);
        root.style.setProperty('--color-input-bg', theme.inputBg);

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
