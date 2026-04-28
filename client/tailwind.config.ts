import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'neon-cyan':   '#00d4ff',
        'neon-purple': '#a855f7',
        'neon-green':  '#22c55e',
        'neon-amber':  '#f59e0b',
        'neon-red':    '#ef4444',
        'text-base':   '#eef2f7',
        'text-secondary': '#8b9ab0',
        'text-muted':  '#4a5568',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '10px',
        lg: '16px',
        xl: '24px',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        bounceDot: {
          '0%, 80%, 100%': { transform: 'translateY(0)',    opacity: '0.4' },
          '40%':           { transform: 'translateY(-5px)', opacity: '1'   },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center'  },
        },
        toastIn: {
          from: { transform: 'translateX(-50%) translateY(-12px)', opacity: '0' },
          to:   { transform: 'translateX(-50%) translateY(0)',      opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0,212,255,0.2)' },
          '50%':      { boxShadow: '0 0 24px rgba(0,212,255,0.5)' },
        },
      },
      animation: {
        'fade-up':    'fadeUp 0.4s ease both',
        'fade-in':    'fadeIn 0.15s ease',
        'bounce-dot': 'bounceDot 1.2s ease infinite',
        'shimmer':    'shimmer 2.5s linear infinite',
        'toast-in':   'toastIn 0.3s ease',
        'pulse-glow': 'pulseGlow 2s ease infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
