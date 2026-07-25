/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050814", // Deep Space Navy
        card: "#0B1020", // Telemetry Panel Blue
        accent: {
          green: "#2DFF6A", // Mission Green
          yellow: "#FFB800", // Calibration Warning
          red: "#FF5252", // Alarm / Offline Red
          blue: "#00E5FF", // Telemetry Cyan
        },
        scientific: {
          green: "rgba(45, 255, 106, 0.15)",
          blue: "rgba(0, 229, 255, 0.1)",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        mono: ["Courier New", "monospace"],
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
