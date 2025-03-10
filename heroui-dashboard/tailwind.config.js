import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './layouts/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/react/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/button/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/input/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/link/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/navbar/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // xFoundry brand colors - for direct Tailwind use
        "xf-blue": "#24a9e0",      // Curious Blue - Primary
        "xf-dark-blue": "#0e445a", // Eden - Secondary
        "xf-gold": "#ffd200",      // Gold - Accent
        
        // Brand-specific variants for Tailwind classes outside the HeroUI components
        "primary-light": "#55c4f1",
        "primary-dark": "#0e445a",
        
        // Additional utility colors
        "success": "#28a745",
        "warning": "#ffd200",
        "danger": "#dc3545",
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
        "slide-in-right": "slide-in-right 0.3s ease-in-out",
        "slide-in-left": "slide-in-left 0.3s ease-in-out",
        "slide-in-bottom": "slide-in-bottom 0.3s ease-in-out",
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
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: 0 },
          "100%": { transform: "translateX(0)", opacity: 1 },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)", opacity: 0 },
          "100%": { transform: "translateX(0)", opacity: 1 },
        },
        "slide-in-bottom": {
          "0%": { transform: "translateY(20px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
}
