/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        primary: "#7c3aed",
        secondary: "#ec4899",
        dark: "#0f0f14",
        card: "#17171d",
      },

      backgroundImage: {
        gradient:
          "linear-gradient(to right, #7c3aed, #ec4899)",
      },
    },
  },

  plugins: [],
};