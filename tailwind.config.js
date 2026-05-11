/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        primary: 'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
        text: 'var(--color-text)',
        'text-secondary': 'var(--color-text-secondary)',
        border: 'var(--color-border)',
        hover: 'var(--color-hover)',
        input: 'var(--color-input)',
        'input-border': 'var(--color-input-border)',
      },
    },
  },
  plugins: [],
}