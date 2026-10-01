/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme only - Liaotao color palette
        liaotao: {
          bg: {
            primary: '#1A1A1A',
            secondary: '#242424',
            tertiary: '#2D2D2D',
          },
          text: {
            primary: '#F5F5F5',
            secondary: '#A0A0A0',
            muted: '#6A6A6A',
          },
          border: '#3A3A3A',
          accent: {
            DEFAULT: '#E9E3D5',  // Beige - primary accent
            hover: '#D4CED0',
            active: '#C0B8A8',
          },
          success: '#4ADE80',
          warning: '#FBBF24',
          error: '#F87171',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Inter', 'sans-serif'],
        mono: ['SF Mono', 'Consolas', 'JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'base': ['13px', { lineHeight: '1.5' }],
        'sm': ['11px', { lineHeight: '1.5' }],
        'lg': ['15px', { lineHeight: '1.5' }],
      },
    },
  },
  plugins: [],
}