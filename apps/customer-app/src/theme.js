// Restaurant SaaS - Customer App Theme
// Matching customer-web Premium Burgundy Design

export const colors = {
    // Primary brand colors
    primary: '#8B3A1E',        // Burgundy - main brand color
    primaryDark: '#6D2D17',    // Darker burgundy for pressed states
    primaryLight: '#FFF0EC',   // Light cream/peach for backgrounds
    primaryBorder: '#FFD8CC',  // Peach border accent

    // Background colors - Light premium theme
    background: '#FAFAFA',     // Main background (off-white)
    backgroundPure: '#FFFFFF', // Pure white for cards
    card: '#FFFFFF',           // Card background
    cardHover: '#FFF7F3',      // Card hover state

    // Text colors
    text: '#1A1A1A',           // Primary text (dark)
    textSecondary: '#555555',  // Secondary text
    textMuted: '#888888',      // Muted/placeholder text

    // Navigation
    navInactive: '#D4A59A',    // Light maroon for inactive nav icons
    navActive: '#8B3A1E',      // Burgundy for active nav

    // Status colors
    success: '#22C55E',
    successLight: '#E8F5E9',
    warning: '#F2B84B',
    error: '#E14B4B',
    errorLight: '#FFEBEE',

    // Border
    border: '#F0F0F0',
    borderDark: '#E8E1DD',

    // Special
    star: '#F2B84B',
    overlay: 'rgba(0, 0, 0, 0.5)',

    // Input
    inputBg: 'rgba(139, 58, 30, 0.05)',

    // Badges
    vegan: '#2E7D32',
    veganBg: '#E8F5E9',
    nonVeg: '#C62828',
    nonVegBg: '#FFEBEE',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
};

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 8,
    },
    burgundy: {
        shadowColor: '#8B3A1E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
};

export const fonts = {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
    // TODO: Add custom fonts
    // outfit: 'Outfit',
    // playfair: 'Playfair Display',
    // syncopate: 'Syncopate',
};

export default {
    colors,
    spacing,
    borderRadius,
    shadows,
    fonts,
};
