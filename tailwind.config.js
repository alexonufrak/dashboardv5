import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './layouts/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/react/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // xFoundry brand colors - for direct Tailwind use
        "xf-blue": "#24a9e0",      // Curious Blue - Primary
        "xf-dark-blue": "#0e445a", // Eden - Secondary
        "xf-gold": "#ffd200",      // Gold - Accent
      },
      fontFamily: {
        sans: [
          "Hanken Grotesk", 
          "Inter", 
          "var(--font-sans)",
          "-apple-system", 
          "BlinkMacSystemFont", 
          "Segoe UI", 
          "Roboto", 
          "sans-serif"
        ],
        mono: ["var(--font-mono)"],
      },
      animation: {
        "spinner": "spinner 1.5s linear infinite",
        "fade-in": "fade-in 0.3s ease-in-out",
        "fade-out": "fade-out 0.3s ease-in-out",
      },
      keyframes: {
        "spinner": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        "fade-out": {
          "0%": { opacity: 1 },
          "100%": { opacity: 0 },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
}
