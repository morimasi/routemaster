/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'], // Başlıklar için Premium Font
      },
      colors: {
        // HSL Tabanlı Premium Tema Renkleri
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        premium: {
          dark: '#0f172a', /* Gece Mavisi Derinliği */
          surface: 'rgba(30, 41, 59, 0.65)', /* Cam Zemin Rengi */
          border: 'rgba(255, 255, 255, 0.08)', /* İnce Cam Kenarlığı */
          accent: '#3b82f6', /* Elektrik Mavisi (Turuncu ile de değiştirebiliriz) */
          alert: '#f97316', /* V.4.1 Otonom Uyarı Rozeti Turuncusu */
        }
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        'app-background': 'radial-gradient(circle at top right, #1e293b, #0f172a)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-alert': '0 0 20px rgba(249, 115, 22, 0.4)',
      },
      backdropBlur: {
        'glass': '16px',
      }
    },
  },
  plugins: [],
}
