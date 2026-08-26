/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-primary)",
        card: "var(--bg-card)",
        surface: "var(--bg-surface)",
        accent: {
          green: "#10B981", // Mission Green
          emerald: "#059669",
          yellow: "#F59E0B", // Calibration Warning
          amber: "#D97706",
          red: "#EF4444", // Alarm / Offline Red
          rose: "#DC2626",
          blue: "#0284C7", // Telemetry Cyan/Blue
          cyan: "#00E5FF",
        },
        scientific: {
          green: "rgba(16, 185, 129, 0.12)",
          blue: "rgba(2, 132, 199, 0.1)",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "Courier New", "monospace"],
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "wave-flow": "wave 10s linear infinite",
      },
      keyframes: {
        wave: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        }
      }
    },
  },
  plugins: [],
}
