import type { Config } from "tailwindcss";

/**
 * Versona design system — canonical token reset (v3).
 * Single accent (#5B3FA8). White surfaces. No shadows — borders do all the
 * structural work. Schibsted Grotesk for the wordmark + titles only; Hanken
 * Grotesk for everything else. Tokens are CSS variables (globals.css) so this
 * file just maps semantic names onto them.
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "960px" },
    },
    extend: {
      colors: {
        // ── Spec tokens ──────────────────────────────────────────────
        canvas: "var(--color-canvas)", // page background (tint) — lifts white cards
        bg: "var(--color-bg)", // surfaces (white)
        "bg-subtle": "var(--color-bg-subtle)",
        "bg-muted": "var(--color-bg-muted)",
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          light: "var(--color-accent-light)",
        },
        // Energy = engagement (reactions, trending, active, streaks, badges)
        energy: {
          DEFAULT: "var(--color-energy)",
          light: "var(--color-energy-light)",
          ink: "var(--color-energy-ink)",
        },
        live: "var(--color-live)", // presence (active now)
        ink: {
          1: "var(--color-text-1)",
          2: "var(--color-text-2)",
          3: "var(--color-text-3)",
        },
        line: "var(--color-border)",
        success: { DEFAULT: "var(--color-success)", bg: "var(--color-success-bg)" },
        error: { DEFAULT: "var(--color-error)", bg: "var(--color-error-bg)" },
        warning: { DEFAULT: "var(--color-warning)", bg: "var(--color-warning-bg)" },

        // ── Semantic aliases mapped onto the spec, so existing class names
        //    (bg-primary, text-muted-foreground, border-border, …) adopt the
        //    new system without per-file churn. ───────────────────────────
        background: "var(--color-bg)",
        foreground: "var(--color-text-1)",
        card: { DEFAULT: "var(--color-bg)", foreground: "var(--color-text-1)" },
        muted: { DEFAULT: "var(--color-bg-muted)", foreground: "var(--color-text-2)" },
        border: "var(--color-border)",
        input: "var(--color-border)",
        ring: "var(--color-accent)",
        primary: { DEFAULT: "var(--color-accent)", foreground: "#FFFFFF" },
        destructive: { DEFAULT: "var(--color-error)", foreground: "#FFFFFF" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      fontSize: {
        // Spec type scale
        xs: ["11px", { lineHeight: "1.4", letterSpacing: "0.1em" }],
        sm: ["13px", { lineHeight: "1.6" }],
        base: ["15px", { lineHeight: "1.55" }],
        lg: ["18px", { lineHeight: "1.25", letterSpacing: "-0.015em" }],
        xl: ["24px", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "2xl": ["30px", { lineHeight: "1.1", letterSpacing: "-0.025em" }],
        "3xl": ["38px", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
      },
      borderRadius: {
        none: "0",
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
        "2xl": "20px",
        full: "999px",
      },
      borderWidth: {
        DEFAULT: "1px",
        1.5: "1.5px",
        2: "2px",
      },
      maxWidth: {
        app: "1200px",
        content: "960px",
        feed: "680px",
        narrow: "480px",
      },
      transitionDuration: {
        DEFAULT: "140ms",
      },
      boxShadow: {
        // No drop shadows — depth comes from contrast + layering.
        none: "none",
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.28)" },
          "100%": { transform: "scale(1)" },
        },
        "live-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.45", transform: "scale(0.82)" },
        },
        "count-pop": {
          "0%": { transform: "translateY(2px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "rise-in": {
          from: { transform: "translateY(6px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        pop: "pop 280ms ease-out",
        live: "live-pulse 2.2s ease-in-out infinite",
        "count-pop": "count-pop 180ms ease-out",
        "rise-in": "rise-in 240ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
