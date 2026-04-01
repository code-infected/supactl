import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      sans: ["Geist Sans", "sans-serif"],
      mono: ["Geist Mono", "monospace"],
    },
    extend: {
      colors: {
        background: "#0e0e0e",
        surface: {
          DEFAULT: "#1a1919",
          low: "#131313",
          high: "#201f1f",
          highest: "#262626",
        },
        primary: {
          DEFAULT: "#3ECF8E",
          container: "#14b778",
          foreground: "#002917",
        },
        error: "#ff716c",
        muted: "#adaaaa",
        dimmer: "#5c5b5b",
      },
      borderColor: {
        DEFAULT: "rgba(255,255,255,0.05)",
        hover: "rgba(255,255,255,0.10)",
      },
      borderRadius: {
        DEFAULT: "2px",
        lg: "4px",
        xl: "8px",
      },
      boxShadow: {
        glow: "0 0 8px rgba(62, 207, 142, 0.4)",
      },
    },
  },
  plugins: [],
} satisfies Config;
