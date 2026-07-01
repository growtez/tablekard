/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#f7f8fa',
        surface: {
          DEFAULT: '#FFFFFF',
          hover: '#F7FAFC',
        },
        accent: {
          primary: '#059669',
          'primary-glow': 'rgba(5, 150, 105, 0.15)',
          secondary: '#10B981',
          'secondary-glow': 'rgba(16, 185, 129, 0.15)',
        },
        text: {
          main: '#1A202C',
          muted: '#718096',
        },
        border: {
          DEFAULT: '#E2E8F0',
        },
        sidebar: {
          bg: '#343A40',
          text: '#FFFFFF',
          'text-muted': '#A0AEC0',
          hover: 'rgba(255, 255, 255, 0.05)',
          border: 'transparent',
          accent: '#A0D9B4',
        },
        glass: {
          bg: 'rgba(255, 255, 255, 0.7)',
          border: 'rgba(226, 232, 240, 0.8)',
        }
      },
      fontFamily: {
        poppins: ['Poppins', 'system-ui', 'sans-serif'],
        inter: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        sm: '0 2px 8px rgba(0, 0, 0, 0.04)',
        md: '0 4px 16px rgba(0, 0, 0, 0.06)',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }
    },
  },
  plugins: [],
}
