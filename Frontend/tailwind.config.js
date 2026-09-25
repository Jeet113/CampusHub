/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--background)', panel: 'var(--background-alt)', card: 'var(--card-solid)',
        accent: 'var(--accent)', subtle: 'var(--muted)', muted: 'var(--muted-foreground)'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], display: ['Space Grotesk', 'sans-serif'], mono: ['JetBrains Mono', 'monospace']
      },
      boxShadow: { glow: '0 0 35px rgba(245,158,11,.12)' }
    }
  },
  plugins: []
}
