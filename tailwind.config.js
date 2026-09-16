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
          50:  '#f4f8f5', // Pristine soft cream-tinted surface
          100: '#e5eee8', // Light muted surface
          200: '#c7dbcd', // Subtle container background
          300: '#9fbeab', // Refined muted green border
          400: '#6e987c', // Muted sage accent
          500: '#487859', // Secondary brand green
          600: '#325d43', // Deep sage green
          700: '#254934', // Deep pine green
          800: '#1a3727', // Rich forest green text/card
          900: '#153227', // Signature Bible Talk Forest Green
          950: '#0c1c16', // Darkest obsidian forest
        },
        scripture: {
          gold: '#f5b025',   // Warm Logo Gold
          amber: '#eba724',  // Deep Golden Yellow
          bronze: '#d49419', // Warm Bronze Accent
          sand: '#f6e5c5',   // Warm scripture sand
          linen: '#f9f7f2',  // Pristine linen background
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
