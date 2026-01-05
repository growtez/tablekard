import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors } from '../theme';

const lightTheme = {
    mode: 'light',
    colors: lightColors,
};

const darkTheme = {
    mode: 'dark',
    colors: darkColors,
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const systemColorScheme = useColorScheme();
    // Default to light theme for the warm design
    const [themeMode, setThemeMode] = useState('light');

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
