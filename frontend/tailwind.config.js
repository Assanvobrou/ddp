/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#FDF2F8',
          100: '#FCE7F3',
          200: '#FBCFE8',
          400: '#E879A8',
          600: '#D4739D',
          700: '#BE5B86',
          900: '#831843',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
        },
        ink: {
          DEFAULT: '#0F172A',
          muted:   '#475569',
          faint:   '#94A3B8',
        },
        success: { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' },
        warning: { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
        danger:  { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        sidebar: '2px 0 12px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
