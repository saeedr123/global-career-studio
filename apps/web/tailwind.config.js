/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#16294d",
        navyDark: "#0f1e3a",
        gold: "#d9a441",
        goldSoft: "#f5e9c8",
        ink: "#1f2937",
        muted: "#64748b",
        paper: "#ffffff",
        background: "#f8fafc",
        border: "#e2e8f0"
      },
      borderRadius: {
        card: "0.75rem",
        button: "0.5rem"
      }
    }
  },
  plugins: []
};
