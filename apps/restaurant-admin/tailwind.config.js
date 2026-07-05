/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tk: {
          burgundy: {
            DEFAULT: 'var(--tk-burgundy)',
            dark: 'var(--tk-burgundy-dark)',
            light: 'var(--tk-burgundy-light)',
            bg: 'var(--tk-burgundy-bg)',
            glow: 'var(--tk-burgundy-glow)',
          },
          bg: {
            DEFAULT: 'var(--tk-bg)',
            card: 'var(--tk-bg-card)',
            elevated: 'var(--tk-bg-elevated)',
            hover: 'var(--tk-bg-hover)',
            sidebar: 'var(--tk-bg-sidebar)',
            surface: 'var(--tk-bg-surface)',
          },
          text: {
            DEFAULT: 'var(--tk-text)',
            body: 'var(--tk-text-body)',
            secondary: 'var(--tk-text-secondary)',
            muted: 'var(--tk-text-muted)',
            'on-primary': 'var(--tk-text-on-primary)',
          },
          accent: 'var(--tk-accent)',
          success: 'var(--tk-success)',
          warning: 'var(--tk-warning)',
          error: 'var(--tk-error)',
          info: 'var(--tk-info)',
          border: {
            DEFAULT: 'var(--tk-border)',
            strong: 'var(--tk-border-strong)',
          }
        }
      },
      fontFamily: {
        sans: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'tk-sm': 'var(--tk-shadow-sm)',
        'tk-md': 'var(--tk-shadow-md)',
        'tk-lg': 'var(--tk-shadow-lg)',
      },
      borderRadius: {
        'tk-sm': 'var(--tk-radius-sm)',
        'tk-md': 'var(--tk-radius-md)',
        'tk-lg': 'var(--tk-radius-lg)',
        'tk-xl': 'var(--tk-radius-xl)',
        'tk-pill': 'var(--tk-radius-pill)',
      }
    },
  },
  plugins: [],
}
