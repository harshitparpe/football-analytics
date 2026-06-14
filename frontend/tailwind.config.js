/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:      '#000814',
        surface: '#001D3D',
        surface2:'#012a52',
        border:  '#003566',
        accent:  '#FFC300',
        accent2: '#d00000',
        heading: '#e8f0fe',
        body:    '#94a3b8',
        muted:   '#64748b',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body:    ['"Inter"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0px',
        none: '0px',
        sm: '2px',
        md: '2px',
        lg: '2px',
        xl: '2px',
        '2xl': '2px',
        full: '9999px',
      }
    },
  },
  plugins: [],
}