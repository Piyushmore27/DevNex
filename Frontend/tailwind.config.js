/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        canvas:  '#0d1117',
        default: '#161b22',
        subtle:  '#21262d',
        overlay: '#1c2128',
        border:  '#30363d',
        green: {
          DEFAULT: '#3fb950',
          dark:    '#238636',
          glow:    'rgba(63,185,80,0.35)',
          subtle:  'rgba(63,185,80,0.12)',
        },
        fg: {
          default: '#e6edf3',
          muted:   '#8b949e',
          subtle:  '#6e7681',
        },
      },
      boxShadow: {
        green:  '0 0 16px rgba(63,185,80,0.4), 0 0 40px rgba(63,185,80,0.15)',
        'green-sm': '0 0 8px rgba(63,185,80,0.3)',
        glow:   '0 0 0 3px rgba(63,185,80,0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease forwards',
        'pulse-green': 'pulseGreen 2s ease infinite',
        spin: 'spin 0.7s linear infinite',
      },
      keyframes: {
        fadeIn: { from:{ opacity:0, transform:'translateY(4px)' }, to:{ opacity:1, transform:'translateY(0)' } },
        pulseGreen: { '0%,100%':{ boxShadow:'0 0 0 0 rgba(63,185,80,0.4)' }, '50%':{ boxShadow:'0 0 0 6px transparent' } },
      },
    },
  },
  plugins: [],
}
