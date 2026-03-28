// frontend/tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#f4f7fb",
        text: "#10253f",
        panel: "rgba(255, 255, 255, 0.55)",
        borderGlass: "rgba(255, 255, 255, 0.3)",
        accent: "#2e84ff",
      },
      boxShadow: {
        glass: "0 12px 40px rgba(10, 40, 80, 0.14)",
      },
      backdropBlur: {
        glass: "14px",
      },
      fontFamily: {
        sans: ["Manrope", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
