/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        premium: {
          dark: '#0f172a',
          surface: 'rgba(30, 41, 59, 0.65)',
          border: 'rgba(255, 255, 255, 0.08)',
          accent: '#3b82f6',
          'accent-hover': '#2563eb',
          alert: '#f97316',
          success: '#10b981',
          danger: '#ef4444',
        }
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        'app-background': 'radial-gradient(ellipse at top right, #1e293b 0%, #0f172a 60%, #020617 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-hover': '0 12px 40px 0 rgba(0, 0, 0, 0.45)',
        'glow': '0 0 15px rgba(59, 130, 246, 0.3)',
        'glow-alert': '0 0 20px rgba(249, 115, 22, 0.4)',
        'glow-success': '0 0 15px rgba(16, 185, 129, 0.3)',
      },
      backdropBlur: {
        'glass': '16px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      transitionDuration: {
        '400': '400ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      screens: {
        'xs': '375px',
        'watch': '280px',
        'mobile': '640px',
        'tablet': '768px',
        'laptop': '1024px',
        'desktop': '1280px',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-top': 'env(safe-area-inset-top, 0px)',
      },
    },
  },
  plugins: [],
}
