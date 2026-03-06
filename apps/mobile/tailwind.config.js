/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ring: {
          red: '#DC2626',
          'red-light': '#EF4444',
          dark: '#111827',
          darker: '#0A0A0A',
          surface: '#1F2937',
          'surface-light': '#F3F4F6',
          muted: '#6B7280',
        },
      },
      fontFamily: {
        mono: ['SpaceMono'],
      },
    },
  },
  plugins: [],
};
