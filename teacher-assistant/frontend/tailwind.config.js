/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary': {
          50: '#fef7f0',
          100: '#feeedb',
          200: '#fbd9b7',
          300: '#f8c088',
          400: '#f49e57',
          500: '#fb6542', // Main brand color
          600: '#ec4c30',
          700: '#c53727',
          800: '#9d2d25',
          900: '#802724',
        },
      },
    },
  },
  plugins: [],
};
