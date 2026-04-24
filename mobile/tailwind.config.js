/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: '#0a0e12',
        ochre: '#d4a24c',
        laterite: '#c96a3f',
        sage: '#8aa876',
      },
    },
  },
  plugins: [],
};
