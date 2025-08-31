/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-main': 'var(--bg-main)',
        'bg-secondary': 'var(--bg-secondary)',
        'text-main': 'var(--text-main)',
        'text-muted': 'var(--text-muted)',
        accent: 'var(--accent)',
      },
      fontFamily: {
        'sans-brand': ['Noto Sans', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
        'serif-brand': ['Source Serif Pro', 'ui-serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        'glow-gold': '0 0 30px rgba(255,215,0,0.08)',
        'glow-gold-strong': '0 0 40px rgba(255,215,0,0.18)',
      },
      borderRadius: {
        'xl-brand': '12px',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 rgba(255,215,0,0.0)' },
          '50%': { boxShadow: '0 0 24px rgba(255,215,0,0.35)' },
        },
        fadein: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 1.8s ease-in-out infinite',
        fadein: 'fadein 200ms ease-out',
      },
    },
  },
  plugins: [],
};


