/** Campus Coin design tokens. Theme-aware colours read CSS variables set in src/index.css. */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] },
      colors: {
        ink: '#172033',
        cream: '#F7F4EC',
        mint: { DEFAULT: '#72E6B0', soft: '#DDF8EA' },
        lavender: { DEFAULT: '#A99BFF', soft: '#ECE8FF' },
        coral: { DEFAULT: '#FF8B73', soft: '#FFE5DE' },
        canvas: v('canvas'),
        surface: v('surface'),
        raised: v('raised'),
        fg: v('fg'),
        muted: v('muted'),
        line: v('line'),
        nav: v('nav'),
        pos: v('pos'),
        neg: v('neg'),
        ai: v('ai'),
        warn: v('warn'),
      },
      borderRadius: { card: '1.25rem' },
      boxShadow: {
        soft: '0 1px 2px rgb(23 32 51 / 0.04), 0 8px 24px -12px rgb(23 32 51 / 0.10)',
        lift: '0 2px 4px rgb(23 32 51 / 0.05), 0 18px 40px -18px rgb(23 32 51 / 0.22)',
      },
    },
  },
  plugins: [],
};
