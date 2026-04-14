import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./utils/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        accent: "#14532d",
        mist: "#f8fafc",
        panel: "#ffffff",
        border: "#dbe4ef"
      },
      boxShadow: {
        soft: "0 20px 60px -35px rgba(15, 23, 42, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
