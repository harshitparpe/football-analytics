/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary:  '#1a56db',
          dark:     '#1e3a5f',
          accent:   '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}