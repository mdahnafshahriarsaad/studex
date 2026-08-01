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
        amoled: '#000000',
        electric: {
          400: '#38BDF8',
          500: '#00F0FF',
          600: '#0A84FF',
          700: '#0066FF',
          glow: 'rgba(0, 240, 255, 0.25)',
        },
        neo: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          glow: 'rgba(34, 197, 94, 0.25)',
        },
        sage: {
          400: '#86b386',
          500: '#5a9e5a',
          600: '#3d8b3d',
          glow: 'rgba(90, 158, 90, 0.20)',
        },
        glass: {
          surface: 'rgba(255, 255, 255, 0.03)',
          hover: 'rgba(255, 255, 255, 0.07)',
          border: 'rgba(255, 255, 255, 0.10)',
          borderGlow: 'rgba(0, 240, 255, 0.40)',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
        bengali: ['Noto Sans Bengali', 'Hind Siliguri', 'sans-serif'],
      },
      boxShadow: {
        'glow-sm': '0 0 15px rgba(0, 240, 255, 0.15)',
        'glow-md': '0 0 30px rgba(0, 240, 255, 0.25)',
        'glow-lg': '0 0 50px rgba(0, 240, 255, 0.35)',
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.6)',
        'neo-glow-sm': '0 0 15px rgba(34, 197, 94, 0.15)',
        'sage-glow-sm': '0 0 15px rgba(90, 158, 90, 0.15)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 3s infinite ease-in-out',
        'shimmer': 'shimmer 2.5s infinite linear',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', filter: 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.3))' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 25px rgba(0, 240, 255, 0.8))' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [],
}
