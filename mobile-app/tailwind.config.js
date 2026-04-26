/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0f766e',
          dark: '#115e59',
          light: '#ccfbf1',
        },
        accent: '#f59e0b',
        ink: '#0f172a',
        muted: '#64748b',
        surface: '#f8fafc',
        line: '#e2e8f0',
        success: '#16a34a',
        danger: '#dc2626',
      },
    },
  },
  plugins: [],
};
