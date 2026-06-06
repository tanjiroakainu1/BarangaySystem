/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        primary: {
          50: '#f6f7f6',
          100: '#e8ebe9',
          200: '#d1d7d3',
          300: '#b2beb5',
          400: '#94a399',
          500: '#77867c',
          600: '#5f6d64',
          700: '#4d5851',
          800: '#3d4641',
          900: '#2d3430',
        },
        secondary: {
          50: '#f4f5f5',
          100: '#e3e5e4',
          200: '#c8ccc9',
          300: '#a8aea9',
          400: '#8a918b',
          500: '#6e756f',
          600: '#565c57',
          700: '#454a46',
          800: '#363a37',
          900: '#282b29',
        },
        ash: {
          50: '#f6f7f6',
          100: '#e8ebe9',
          200: '#d1d7d3',
          300: '#b2beb5',
          400: '#94a399',
          500: '#77867c',
          600: '#5f6d64',
          700: '#4d5851',
          800: '#3d4641',
          900: '#2d3430',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        danger: {
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'btn': '0 4px 14px 0 rgba(95, 109, 100, 0.35)',
        'btn-lg': '0 8px 24px 0 rgba(95, 109, 100, 0.4)',
        'btn-glow': '0 0 20px rgba(255, 255, 255, 0.25)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { backgroundPosition: '200% center' },
          '50%': { backgroundPosition: '-200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
      }
    },
  },
  plugins: [],
}
