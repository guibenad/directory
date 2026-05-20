import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        syne: ["var(--font-syne)", "Syne", "sans-serif"],
        sans: ["var(--font-dm-sans)", "DM Sans", "system-ui", "sans-serif"],
      },
      colors: {
        bg: "var(--bg)",
        bg2: "var(--bg2)",
        bg3: "var(--bg3)",
        card: "var(--card)",
        border: "var(--border)",
        border2: "var(--border2)",
        text: "var(--text)",
        text2: "var(--text2)",
        text3: "var(--text3)",
        amber: "var(--amber)",
        amber2: "var(--amber2)",
        "amber-bg": "var(--amber-bg)",
        blue: "var(--blue)",
        "blue-bg": "var(--blue-bg)",
        green: "var(--green)",
        "green-bg": "var(--green-bg)",
        red: "var(--red)",
        "red-bg": "var(--red-bg)",
        purple: "var(--purple)",
        "purple-bg": "var(--purple-bg)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        mute: "var(--mute)",
        "mute-2": "var(--mute-2)",
        cream: "var(--cream)",
        "cream-2": "var(--cream-2)",
        mist: "var(--mist)",
        "mist-2": "var(--mist-2)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
      },
      borderRadius: {
        r: "10px",
        r2: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
