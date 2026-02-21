import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ style, className }) => {
    const { themeMode, toggleTheme, theme } = useTheme();
    const isDark = themeMode === 'dark';

    return (
        <button
            className={`theme-toggle-btn ${className || ''}`}
            onClick={() => toggleTheme(isDark ? 'light' : 'dark')}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                backgroundColor: theme.inputBg,
                ...style
            }}
            aria-label="Toggle Theme"
        >
            {isDark ? (
                <Sun size={20} color={theme.text} />
            ) : (
                <Moon size={20} color={theme.text} />
            )}
        </button>
    );
};

export default ThemeToggle;
