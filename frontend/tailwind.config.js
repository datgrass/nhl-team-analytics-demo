/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        avs: {
          burgundy: "#6F263D",
          blue: "#236192",
          silver: "#A2AAAD",
          dark: "#1a1a2e",
          darker: "#0f0f1e",
        },
      },
    },
  },
  plugins: [],
};
