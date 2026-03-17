import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      screens: {
        mobile: "680px",
        desktop: "900px",
        compact: "1100px",
      },
      colors: {
        app: {
          body: "var(--color-bg-body)",
          card: "var(--color-bg-card)",
          glass: "var(--color-glass-panel)",
          "border-light": "var(--color-border-light)",
          "border-hover": "var(--color-border-hover)",
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          spotlight: "var(--color-spotlight)",
          white: "var(--color-accent-white)",
          hover: "var(--color-card-hover)",
          success: "var(--color-success)",
          info: "var(--color-info)",
          warning: "var(--color-warning)",
          error: "var(--color-error)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Playfair Display", "Georgia", "serif"],
        body: ["var(--font-body)", "Inter", "Segoe UI", "sans-serif"],
      },
      spacing: {
        xs: "var(--spacing-xs)",
        s: "var(--spacing-s)",
        m: "var(--spacing-m)",
        l: "var(--spacing-l)",
        xl: "var(--spacing-xl)",
        xxl: "var(--spacing-xxl)",
      },
      borderRadius: {
        sharp: "var(--radius-sharp)",
        soft: "var(--radius-soft)",
        pill: "var(--radius-pill)",
      },
      transitionDuration: {
        fast: "var(--animation-fast)",
        normal: "var(--animation-normal)",
        smooth: "var(--animation-smooth)",
        slow: "var(--animation-slow)",
      },
      boxShadow: {
        glass: "0 20px 60px rgba(0, 0, 0, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
