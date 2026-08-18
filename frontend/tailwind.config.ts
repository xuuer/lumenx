import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-bg-base)",
        foreground: "var(--color-text-primary)",
        surface: "var(--color-bg-surface)",
        elevated: "var(--color-bg-elevated)",
        "input-bg": "var(--color-bg-input)",
        "hover-bg": "var(--color-bg-hover)",
        glass: "var(--color-glass)",
        "glass-border": "var(--color-border-default)",
        "border-subtle": "var(--color-border-subtle)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",
        overlay: "var(--color-overlay)",
        "surface-inset": "var(--color-bg-inset)",
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        secondary: "var(--color-primary-hover)",
        accent: "var(--color-accent)",
        "accent-hover": "var(--color-accent-hover)",
        "on-accent": "var(--color-on-accent)",
        // Storyboard R2V workbench status semantic tokens. Replaces
        // 30+ scattered amber/emerald/red/blue arbitrary tints. Each
        // status carries -fg / -border / -bg variants; starred also
        // has -solid for chip backgrounds. Defined in globals.css per
        // theme.
        "status-pending-fg": "var(--color-status-pending-fg)",
        "status-pending-border": "var(--color-status-pending-border)",
        "status-pending-bg": "var(--color-status-pending-bg)",
        "status-processing-fg": "var(--color-status-processing-fg)",
        "status-processing-border": "var(--color-status-processing-border)",
        "status-processing-bg": "var(--color-status-processing-bg)",
        "status-completed-fg": "var(--color-status-completed-fg)",
        "status-completed-border": "var(--color-status-completed-border)",
        "status-completed-bg": "var(--color-status-completed-bg)",
        "status-failed-fg": "var(--color-status-failed-fg)",
        "status-failed-border": "var(--color-status-failed-border)",
        "status-failed-bg": "var(--color-status-failed-bg)",
        "status-starred-fg": "var(--color-status-starred-fg)",
        "status-starred-border": "var(--color-status-starred-border)",
        "status-starred-bg": "var(--color-status-starred-bg)",
        "status-starred-solid": "var(--color-status-starred-solid)",
        "on-warm": "var(--color-on-warm)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
        display: ["var(--font-display)", "var(--font-space-grotesk)", "sans-serif"],
      },
      fontSize: {
        // 3-tier type scale for the Storyboard R2V workbench (and
        // anything else that needs a coherent product hierarchy).
        // - chrome: terminal-aesthetic JetBrains Mono uppercase
        //   tracking, used by section headers, status badges, metadata.
        //   Two sizes (sm/base) so dense rows can compress without
        //   inventing more arbitrary [9px]/[9.5px] values.
        // - body: Inter regular for input values, current selections,
        //   inline meta. The "you can read this" tier.
        // - display: Space Grotesk semibold for primary CTAs and
        //   focal headings. Reserved.
        "chrome-sm":  ["0.625rem", { lineHeight: "1.4", letterSpacing: "0.18em" }],
        "chrome":     ["0.6875rem", { lineHeight: "1.4", letterSpacing: "0.18em" }],
        "body-sm":    ["0.75rem", { lineHeight: "1.45" }],
        "body":       ["0.8125rem", { lineHeight: "1.5" }],
        "display-sm": ["0.875rem", { lineHeight: "1.3", letterSpacing: "-0.005em" }],
        "display":    ["1rem", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
      },
      transitionTimingFunction: {
        // Ease-out-quart everywhere per impeccable shared laws:
        // exponential ease-out, no bounce, no elastic.
        "out-quart": "cubic-bezier(0.22, 1, 0.36, 1)",
        "out-expo":  "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        // 3 motion tokens. fast = state feedback (hover, focus,
        // toggle), base = enter/exit (panel mount, modal open),
        // slow = orchestrated reveals.
        "fast": "150ms",
        "base": "250ms",
        "slow": "400ms",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite linear",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
