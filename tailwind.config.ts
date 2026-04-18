import type { Config } from 'tailwindcss'

const config: Config = {
  // Class strategy lets us flip dark mode based on a user preference (System/Light/Dark)
  // independent of the OS — applied to <html> by ThemeProvider + the SSR no-flicker script.
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'eaa-blue': '#003366',
        'eaa-yellow': '#FFD700',
        'eaa-light-blue': '#0066CC',
        // Dark-mode brand surfaces. Hand-tuned for WCAG 1.4.3 contrast against
        // both eaa-yellow accents (>= 4.5:1) and white text (>= 7:1).
        'eaa-blue-dark': '#0a4f8f',
        'eaa-bg-dark': '#0b1220',
        'eaa-surface-dark': '#111827',
        'eaa-border-dark': '#1f2937',
      },
      fontFamily: {
        // Display serif for hero overlays (loaded in app/layout.tsx).
        display: ['var(--font-cormorant)', 'Cormorant', 'Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config

