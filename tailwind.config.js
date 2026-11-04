/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        santander: {
          50: '#FFF1F1',
          100: '#FFE0E0',
          200: '#FFC5C5',
          300: '#FF9D9D',
          400: '#FF6464',
          500: '#EC0000', // Rojo corporativo oficial Banco Santander
          600: '#D00000',
          700: '#B30000',
          800: '#940000',
          900: '#7A0000',
          dark: '#191919',
        },
      },
    },
  },
  plugins: [],
}
