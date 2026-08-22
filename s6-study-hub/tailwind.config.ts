import type { Config } from "tailwindcss";

// S6 Study Hub design tokens.
// Signature concept: the red-pen / green-pen marking language every Ugandan
// student already reads instantly, used functionally (not decoratively) —
// green = mastered, red = weak, amber = pending/streak — against an
// ink-navy + chalk-white base instead of the generic cream+terracotta look.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#14213D", // primary dark — header band, nav, headings
          soft: "#1F2E52",
        },
        chalk: {
          DEFAULT: "#FAFAF7", // primary background
          dim: "#F0EFE9",
        },
        marker: {
          green: "#1F9D55", // mastered / correct / verified
          "green-soft": "#E6F6EC",
          red: "#D62828", // weak / incorrect / reported
          "red-soft": "#FBE7E7",
          amber: "#F4A300", // pending / streak / countdown
          "amber-soft": "#FDF1DA",
        },
        slate: {
          DEFAULT: "#6B7280", // secondary text
          light: "#9CA3AF",
        },
      },
      fontFamily: {
        // Display: Lexend — chosen because it's research-backed to improve
        // reading proficiency, which is directly on-brief for an academically
        // responsible revision platform, not just a look.
        display: ["var(--font-lexend)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        chip: "999px",
        card: "14px",
      },
      keyframes: {
        "tick-in": {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "tick-in": "tick-in 180ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
