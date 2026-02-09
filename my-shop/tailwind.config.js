/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FDF7F7',
          100: '#FCECEC',
          200: '#F2D1D1',
          300: '#E6BFBF',
          400: '#D4A5A5',
          500: '#B88686',
          600: '#9C6B6B',
          700: '#7F5050',
          900: '#2C2A2A',
        },
        cream: {
          50: '#FDFBF9',
          100: '#F7F5F3',
        }
      },
      fontFamily: {
        sans: ['Helvetica Neue', 'Arial', 'PingFang TC', 'Heiti TC', 'Microsoft JhengHei', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
