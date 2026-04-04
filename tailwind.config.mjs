/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:      ['"DM Sans"', 'sans-serif'],
        display:   ['"Syne"', 'sans-serif'],
        serif:     ['"DM Serif Display"', 'serif'],
        garamond:  ['"Cormorant Garamond"', 'serif'],
      },
      colors: {
        bg:        '#1f2a2c',
        'bg-alt':  '#1a2426',
        accent:    '#A27B5B',
        'accent-lt':'#c09a78',
        'accent-warm':'#d4a574',
        text:      '#e8e2d6',
        'text-2':  '#b8b0a2',
        'text-3':  '#7a7068',
      },
      borderRadius: {
        card: '18px',
        xl2: '26px',
      },
    },
  },
  plugins: [],
};
