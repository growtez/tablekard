// Theme configuration for Rider/Delivery App

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
};

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
};

export const typography = {
    h1: {
        fontSize: 28,
        fontWeight: '700',
        lineHeight: 36,
    },
    h2: {
        fontSize: 24,
        fontWeight: '600',
        lineHeight: 32,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 28,
    },
    body: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
    },
    bodySmall: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
    },
    caption: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 16,
    },
};

// Brand Colors
export const brandColors = {
    primary: '#8B3A1E',           // Deep Sushi Brown
    primaryDark: '#6F2D17',       // Dark Cocoa (hover)
    secondary: '#FFD6C9',         // Warm Peach
    accent: '#F2B84B',            // Golden Mustard
};

// Light Theme (Default)
export const lightColors = {
    // Brand
    primary: brandColors.primary,
    primaryDark: brandColors.primaryDark,
    secondary: brandColors.secondary,
    accent: brandColors.accent,

    // Backgrounds
    background: '#FFFFFF',        // Pure White
    card: '#FFF7F3',              // Soft Cream
    cardElevated: '#FFEDE5',      // Light Peach Tint
    surface: '#FFFFFF',

    // Text
    text: '#1A1A1A',              // Near Black (headings)
    textBody: '#3A3A3A',          // Charcoal (body)
    textSecondary: '#7A6F6B',     // Muted Brown-Gray
    textMuted: '#B8ADA9',         // Placeholder/Disabled
    textOnPrimary: '#FFFFFF',

    // Borders & Dividers
    border: '#E8E1DD',            // Warm Gray
    divider: '#E8E1DD',

    // Interactive
    link: '#8B3A1E',
    linkHover: '#6F2D17',
    tabActive: '#8B3A1E',
    tabInactive: '#9C8F8A',
    focusRing: 'rgba(139, 58, 30, 0.25)',

    // Icons
    iconActive: '#8B3A1E',
    iconInactive: '#9C8F8A',

    // Status
    success: '#4CAF50',           // Leaf Green
    warning: '#F2B84B',           // Mustard
    error: '#E14B4B',             // Soft Red
    info: '#5C7A7A',              // Warm Blue-Gray

    // Button States
    buttonPrimaryBg: '#8B3A1E',
    buttonPrimaryText: '#FFFFFF',
    buttonPrimaryHover: '#6F2D17',
    buttonPrimaryDisabled: '#C9A99E',
    buttonSecondaryBg: '#FFFFFF',
    buttonSecondaryBorder: '#8B3A1E',
    buttonSecondaryText: '#8B3A1E',
    buttonSecondaryHover: '#FFF0EA',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.5)',
    modalBg: '#FFFFFF',
};

// Dark Theme (Optional - keeping minimal)
export const darkColors = {
    ...lightColors,
    background: '#1A1A1A',
    card: '#2D2520',
    cardElevated: '#3D3530',
    surface: '#2D2520',
    text: '#FFFFFF',
    textBody: '#E0E0E0',
    textSecondary: '#B8ADA9',
    textMuted: '#7A6F6B',
    border: '#4D4540',
    divider: '#4D4540',
    buttonSecondaryBg: '#2D2520',
    buttonSecondaryHover: '#3D3530',
    modalBg: '#2D2520',
};

// Default export (light theme)
export const colors = lightColors;
