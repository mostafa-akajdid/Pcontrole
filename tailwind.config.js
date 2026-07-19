/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable dark mode with class strategy
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './contexts/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
      },
    },
  },
  plugins: [],
}
