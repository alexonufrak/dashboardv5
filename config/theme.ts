// Custom theme configuration for HeroUI

// xFoundry brand colors
const xFoundryColors = {
  primary: {
    50: "#e8f7fc",
    100: "#d1ebf7",
    200: "#a3d8ef",
    300: "#75c5e7",
    400: "#47b2df",
    500: "#24a9e0", // Primary brand color - Curious Blue
    600: "#1d87b3",
    700: "#166586",
    800: "#0e445a", // Secondary brand color - Eden
    900: "#07222d",
  },
  secondary: {
    // A variation of the Eden blue 
    50: "#e6eef2",
    100: "#cddde6",
    200: "#9abccc",
    300: "#689ab2",
    400: "#357999",
    500: "#0e445a", // Secondary brand color - Eden
    600: "#0b3648",
    700: "#082936",
    800: "#061c24",
    900: "#030e12",
  },
  accent: {
    // Gold accent color
    50: "#fff9e0",
    100: "#fff3c0",
    200: "#ffe780",
    300: "#ffdb40",
    400: "#ffd200", // Accent brand color - Gold
    500: "#cca800",
    600: "#997e00",
    700: "#665400",
    800: "#332a00",
    900: "#191500",
  },
  success: {
    50: "#e8fbf0",
    100: "#d1f7e1",
    200: "#a3f0c4",
    300: "#75e8a6",
    400: "#47e088",
    500: "#28a745", // Success color
    600: "#208537",
    700: "#186429",
    800: "#10421c",
    900: "#08210e",
  },
  warning: {
    // Using the Gold accent color for warnings
    50: "#fff9e0",
    100: "#fff3c0",
    200: "#ffe780",
    300: "#ffdb40",
    400: "#ffd200", // Warning color
    500: "#cca800",
    600: "#997e00",
    700: "#665400",
    800: "#332a00",
    900: "#191500",
  },
  danger: {
    50: "#fceaec",
    100: "#f9d5d9",
    200: "#f3abb3",
    300: "#ed818d",
    400: "#e75767",
    500: "#dc3545", // Danger color
    600: "#b02a37",
    700: "#842029",
    800: "#58151c",
    900: "#2c0a0e",
  },
};

// Create the theme
export const xFoundryTheme = {
  colors: {
    // Apply brand colors to theme
    primary: xFoundryColors.primary,
    secondary: xFoundryColors.secondary,
    success: xFoundryColors.success,
    warning: xFoundryColors.warning,
    danger: xFoundryColors.danger,
    
    // Set accent color from our brand
    accent: xFoundryColors.accent,
    
    // Ensure content and background colors work with our brand palette
    content1: "#ffffff",
    content2: "#f8f9fa",
    content3: "#f1f3f5",
    content4: "#e9ecef",
    
    // Default colors used extensively for text and borders
    default: {
      50: "#f8f9fa",
      100: "#e9ecef",
      200: "#dee2e6",
      300: "#ced4da",
      400: "#adb5bd",
      500: "#6c757d", // Muted text
      600: "#495057",
      700: "#343a40",
      800: "#212529",
      900: "#121416",
    },
  },
  layout: {
    // Layout values for consistent spacing
    spacingUnit: 4,
    disabledOpacity: 0.5,
    dividerWeight: 1,
    fontSize: {
      tiny: "0.75rem",
      small: "0.875rem",
      medium: "1rem",
      large: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
    },
    lineHeight: {
      tiny: 1.25,
      small: 1.375,
      medium: 1.5,
      large: 1.625,
      xl: 1.75,
      "2xl": 1.75,
      "3xl": 1.75,
      "4xl": 1.75,
    },
    radius: {
      small: "0.125rem",
      medium: "0.25rem",
      large: "0.5rem",
      xl: "0.75rem",
      "2xl": "1rem",
      "3xl": "1.5rem",
      full: "9999px",
    },
    borderWidth: {
      small: "1px",
      medium: "2px",
      large: "3px",
    },
  },
  themes: {
    light: {
      // Light theme specific colors
      layout: {
        boxShadow: {
          small:
            "0px 0px 5px 0px rgb(0 0 0 / 0.02), 0px 2px 10px 0px rgb(0 0 0 / 0.06)",
          medium:
            "0px 0px 15px 0px rgb(0 0 0 / 0.03), 0px 2px 30px 0px rgb(0 0 0 / 0.08)",
          large:
            "0px 0px 30px 0px rgb(0 0 0 / 0.04), 0px 30px 60px 0px rgb(0 0 0 / 0.12)",
        },
      },
    },
    dark: {
      // Dark theme specific colors
      colors: {
        background: "#0e445a", // Use our Eden color for dark mode background
        
        content1: "#151718",
        content2: "#1a1d1e",
        content3: "#202425",
        content4: "#26292b",
        
        default: {
          50: "#26292b",
          100: "#2e3133",
          200: "#3c4043",
          300: "#515457",
          400: "#777b7e",
          500: "#9da1a4",
          600: "#bdbfc1",
          700: "#dbdcdd",
          800: "#ededee",
          900: "#f8f8f8",
        },
      },
      layout: {
        boxShadow: {
          small:
            "0px 0px 5px 0px rgb(0 0 0 / 0.05), 0px 2px 10px 0px rgb(0 0 0 / 0.2)",
          medium:
            "0px 0px 15px 0px rgb(0 0 0 / 0.06), 0px 2px 30px 0px rgb(0 0 0 / 0.25)",
          large:
            "0px 0px 30px 0px rgb(0 0 0 / 0.07), 0px 30px 60px 0px rgb(0 0 0 / 0.3)",
        },
      },
    },
  },
};

export default xFoundryTheme;