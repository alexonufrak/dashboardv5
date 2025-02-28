module.exports = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
  	extend: {
      colors: {
        // xFoundry brand colors
        primary: {
          DEFAULT: "#24A9E0", // Curious Blue
          dark: "#0E445A",    // Eden
          light: "#55C4F1"    // Lighter shade of Curious Blue
        },
        secondary: "#0E445A",  // Eden
        accent: "#FFD200",     // Gold
        eden: "#0E445A",
        curious: "#24A9E0",
        gold: "#FFD200"
      },
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [],
}