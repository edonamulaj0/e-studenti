/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "rgb(var(--ink-rgb) / <alpha-value>)",
          soft: "rgb(var(--ink-soft-rgb) / <alpha-value>)",
        },
        surface: "rgb(var(--surface-rgb) / <alpha-value>)",
        gray: {
          50: "rgb(var(--g50-rgb) / <alpha-value>)",
          100: "rgb(var(--g100-rgb) / <alpha-value>)",
          200: "rgb(var(--g200-rgb) / <alpha-value>)",
          300: "rgb(var(--g300-rgb) / <alpha-value>)",
          400: "rgb(var(--g400-rgb) / <alpha-value>)",
          500: "rgb(var(--g500-rgb) / <alpha-value>)",
          600: "rgb(var(--g600-rgb) / <alpha-value>)",
          700: "rgb(var(--g700-rgb) / <alpha-value>)",
        },
        navy: {
          900: "rgb(var(--navy-900-rgb) / <alpha-value>)",
          800: "rgb(var(--navy-800-rgb) / <alpha-value>)",
          700: "rgb(var(--navy-700-rgb) / <alpha-value>)",
          100: "rgb(var(--navy-100-rgb) / <alpha-value>)",
        },
        burgundy: {
          700: "#5e1621",
          600: "rgb(var(--burgundy-600-rgb) / <alpha-value>)",
          500: "rgb(var(--burgundy-500-rgb) / <alpha-value>)",
          50: "rgb(var(--burgundy-50-rgb) / <alpha-value>)",
        },
        cream: {
          50: "rgb(var(--cream-50-rgb) / <alpha-value>)",
        },
        beige: {
          100: "rgb(var(--beige-100-rgb) / <alpha-value>)",
        },
        "success-green": "rgb(var(--success-green-rgb) / <alpha-value>)",
        "warning-amber": "rgb(var(--warning-amber-rgb) / <alpha-value>)",
        "info-blue": "rgb(var(--info-blue-rgb) / <alpha-value>)",
        // Darker siblings of the three status colours, for TEXT. The base
        // colours are 2.0-3.6:1 on light backgrounds (AA needs 4.5:1); these
        // are 5.3-6.9:1. Keep the base colours for fills, borders and tints.
        "success-text": "rgb(var(--success-text-rgb) / <alpha-value>)",
        "warning-text": "rgb(var(--warning-text-rgb) / <alpha-value>)",
        "info-text": "rgb(var(--info-text-rgb) / <alpha-value>)",
        srh: {
          crimson: "rgb(var(--burgundy-600-rgb) / <alpha-value>)",
          navy: "rgb(var(--navy-900-rgb) / <alpha-value>)",
          sage: "rgb(var(--success-green-rgb) / <alpha-value>)",
          cream: "rgb(var(--gray-200-rgb) / <alpha-value>)",
          blush: "rgb(var(--burgundy-50-rgb) / <alpha-value>)",
          paper: "rgb(var(--cream-50-rgb) / <alpha-value>)",
          white: "#FFFFFF",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        playfair: ["var(--font-display)", "Georgia", "serif"],
        montserrat: ["var(--font-sans)", "sans-serif"],
        inter: ["var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-base)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        burgundy: "var(--shadow-burgundy)",
      },
    },
  },
  plugins: [],
};
