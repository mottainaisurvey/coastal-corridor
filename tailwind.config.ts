import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0a0e12',
          2: '#11161c',
          3: '#1a2029',
          4: '#252c36'
        },
        paper: {
          DEFAULT: '#f5f1ea',
          2: '#ebe5d9',
          3: '#ddd3c1'
        },
        ocean: { DEFAULT: '#2d7d7d', 2: '#4db3b3', 3: '#6fd4d4' },
        laterite: { DEFAULT: '#c96a3f', 2: '#e08660', 3: '#f0a37f' },
        ochre: { DEFAULT: '#d4a24c', 2: '#e8b865' },
        sage: { DEFAULT: '#8aa876', 2: '#a4c48e' },
        alert: '#e85a4f',
        success: '#6fae7a'
      },
      fontFamily: {
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Inter Tight"', 'ui-sans-serif', 'system-ui'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      letterSpacing: {
        tightest: '-0.025em',
        display: '-0.015em',
        micro: '0.18em'
      },
      boxShadow: {
        card: '0 2px 8px rgba(10,14,18,0.06), 0 8px 24px rgba(10,14,18,0.04)',
        'card-hover': '0 4px 16px rgba(10,14,18,0.08), 0 20px 40px rgba(10,14,18,0.08)',
        panel: '0 20px 60px rgba(0,0,0,0.5)'
      }
    }
  },
  plugins: []
};

export default config;
