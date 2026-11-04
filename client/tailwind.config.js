/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: '#080808',
        surface: '#121212',
        container: '#1A1A1A',
        bronze: {
          DEFAULT: '#262118',
          border: '#262118',
          subtle: '#332B20',
          divider: '#262118',
        },
        gold: {
          DEFAULT: '#D4AF37',
          primary: '#D4AF37',
          hover: '#AA7C11',
          champagne: '#F5E6C4',
          light: '#FBF4E4',
          dark: '#8C6708',
        },
        champagne: '#F5E6C4',
        status: {
          online: '#10B981',
          busy: '#EF4444',
          offline: '#EF4444',
        },
        muted: {
          bronze: '#A39E93',
        },
        brand: {
          50: '#FBF4E4',
          100: '#F5E6C4',
          200: '#EBD292',
          300: '#E0BC5C',
          400: '#DAAD3C',
          500: '#D4AF37',
          600: '#AA7C11',
          700: '#8C6708',
          800: '#644A06',
          900: '#3D2D03',
          950: '#1A1300',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
