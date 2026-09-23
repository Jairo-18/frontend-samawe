/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,scss}'],
  theme: {
    extend: {
      screens: {
        // Portátil real, 14" en adelante. El iPad Pro 13" mide 1366px en
        // horizontal — por debajo del `xl` (1280px) de fábrica ya lo cruzaba,
        // así que estas secciones necesitaban un corte propio, más alto que
        // cualquier iPad en cualquier orientación.
        laptop: '1440px',
        '3xl': '1920px',
      },
      keyframes: {
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'slide-in-left': 'slide-in-left 0.25s ease-out',
      },
    }
  },
  plugins: []
};
