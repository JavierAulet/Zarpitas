import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          50:  '#FFF4EF',
          100: '#FFE8DC',
          light: '#FF8C5A',
          DEFAULT: '#FF6B35',
          dark: '#E55A26',
        },
        green: {
          50: '#E8F5EE',
          light: '#40916C',
          DEFAULT: '#2D6A4F',
          dark: '#1B4332',
        },
        cream: {
          DEFAULT: '#FAFAF8',
          warm: '#F5F0E8',
          card: '#FFFFFF',
          deep: '#EDE8E0',
        },
        sand: '#D4C9B8',
        text: {
          primary: '#1A1A1A',
          secondary: '#4A4A4A',
          muted: '#888888',
        },
        success: '#2D6A4F',
        error: '#E53E3E',
      },
      fontFamily: {
        display: ['var(--font-nunito)', 'Nunito', 'system-ui', 'sans-serif'],
        sans: ['var(--font-jakarta)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        hero: ['clamp(2.5rem, 6vw, 5rem)', { lineHeight: '1.1', fontWeight: '900' }],
        h1: ['clamp(2rem, 4vw, 3.5rem)', { lineHeight: '1.15' }],
        h2: ['clamp(1.6rem, 3vw, 2.5rem)', { lineHeight: '1.2' }],
        h3: ['1.25rem', { lineHeight: '1.3' }],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
      },
      boxShadow: {
        card: '0 2px 16px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 12px 40px rgba(0, 0, 0, 0.12)',
        orange: '0 8px 32px rgba(255, 107, 53, 0.25)',
        'orange-lg': '0 16px 48px rgba(255, 107, 53, 0.3)',
        green: '0 8px 32px rgba(45, 106, 79, 0.2)',
        warm: '0 4px 24px rgba(0, 0, 0, 0.08)',
        float: '0 20px 60px rgba(0, 0, 0, 0.15)',
      },
      backgroundImage: {
        'gradient-orange': 'linear-gradient(135deg, #FF8C5A 0%, #FF6B35 100%)',
        'gradient-green': 'linear-gradient(135deg, #40916C 0%, #2D6A4F 100%)',
        'gradient-cream': 'linear-gradient(180deg, #FAFAF8 0%, #F5F0E8 100%)',
        'gradient-warm': 'linear-gradient(135deg, #FFF8F0 0%, #FFF0E8 100%)',
      },
      animation: {
        'float-slow': 'float 8s ease-in-out infinite',
        'float-fast': 'float 5s ease-in-out infinite',
        wiggle: 'wiggle 1s ease-in-out infinite',
        'fade-up': 'fadeUp 0.5s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
