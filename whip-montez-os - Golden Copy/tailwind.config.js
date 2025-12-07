/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // This restores the specific hacker green color
        neon: "#00ff41" 
      },
      fontFamily: {
        // This restores the retro computer font
        mono: ['Share Tech Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        // This restores the slow spinning animations
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
}