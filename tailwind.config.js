/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        primaryDark: "#3c364c",
        secondaryDark: "#6d54b5",
        thirdDark: "#2c2638",
        hoverDark: "#524184",
        primaryLight: "#fafafa",
        secondaryLight: "#6774b4",
        thirdLight: "#a2abda",
        hoverLight: "#505a8f",
      },
    },
  },
  plugins: [],
  darkMode: "class",
};
