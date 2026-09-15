/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdfdfc', // Pure Alabaster / Pristine White
          100: '#f8f8f6', // Light Warm White surface
          200: '#f0f0ea', // Card hover / subtle container
          300: '#e4e4dc', // Subtle refined border
          400: '#b8b4aa', // Soft stone
          500: '#8c857b', // Muted text
          600: '#635d54', // Secondary text
          700: '#48433c', // Subheadings
          800: '#2b2723', // Dark charcoal text
          900: '#1a1715', // Pure deep obsidian
          950: '#0e0d0c',
        },
        scripture: {
          gold: '#a78243',
          bronze: '#8c6b32',
          sand: '#e8dec8',
          linen: '#f4f0e6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
        display: ['Cinzel', 'serif'],
        mono: ['Space Grotesk', 'monospace'],
      },
      letterSpacing: {
        scripture: '0.18em',
        epic: '0.28em',
      }
    },
  },
  plugins: [],
}
