/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "rgb(var(--navy-900-rgb) / <alpha-value>)",
          800: "rgb(var(--navy-800-rgb) / <alpha-value>)",
          700: "rgb(var(--navy-700-rgb) / <alpha-value>)",
          100: "rgb(var(--navy-100-rgb) / <alpha-value>)",
        },
        burgundy: {
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
