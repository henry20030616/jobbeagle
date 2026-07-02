import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        jb: {
          bg: "var(--jb-bg)",
          elevated: "var(--jb-bg-elevated)",
          surface: "var(--jb-bg-muted)",
          ink: "var(--jb-text)",
          "ink-muted": "var(--jb-text-muted)",
          "ink-subtle": "var(--jb-text-subtle)",
          accent: "var(--jb-accent)",
          "accent-soft": "var(--jb-accent-soft)",
          border: "var(--jb-border)",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        jb: "var(--jb-shadow-md)",
        "jb-hover": "var(--jb-shadow-hover)",
      },
      borderRadius: {
        jb: "var(--jb-radius)",
        "jb-lg": "var(--jb-radius-lg)",
      },
    },
  },
  plugins: [],
};
export default config;
