/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Palette is driven by CSS variables (see index.css) so the app can
        // switch between dark (default) and light themes by toggling a class on
        // <html>. `canvas` = app background, `ink` = foreground text.
        canvas: "rgb(var(--c-canvas) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        "surface-2": "rgb(var(--c-surface-2) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        accent: "rgb(var(--c-accent) / <alpha-value>)",
        "accent-dark": "rgb(var(--c-accent-dark) / <alpha-value>)",
        violet: "rgb(var(--c-violet) / <alpha-value>)",
        correct: "rgb(var(--c-correct) / <alpha-value>)",
        hint: "rgb(var(--c-hint) / <alpha-value>)",
        danger: "rgb(var(--c-danger) / <alpha-value>)",
        sky: "rgb(var(--c-sky) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "1.25rem",
        pill: "999px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.3), 0 12px 30px -16px rgba(0,0,0,0.6)",
        pop: "0 10px 34px -8px rgba(109,123,255,0.55)",
        soft: "0 2px 12px rgba(0,0,0,0.35)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.06)" },
          "100%": { transform: "scale(1)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-6px)" },
          "40%": { transform: "translateX(6px)" },
          "60%": { transform: "translateX(-4px)" },
          "80%": { transform: "translateX(4px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.5" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { opacity: "0" },
        },
        "draw-check": {
          to: { strokeDashoffset: "0" },
        },
        confetti: {
          "0%": { transform: "translateY(-10vh) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(110vh) rotate(720deg)", opacity: "1" },
        },
        "count-pop": {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "60%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "fade-in-up": "fade-in-up 0.5s ease-out both",
        "scale-in": "scale-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
        "slide-up": "slide-up 0.32s cubic-bezier(0.34,1.56,0.64,1) both",
        pop: "pop 0.4s ease-out",
        shake: "shake 0.4s ease-in-out",
        shimmer: "shimmer 2.2s linear infinite",
        float: "float 4s ease-in-out infinite",
        "pulse-ring": "pulse-ring 1.8s ease-out infinite",
        "count-pop": "count-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
        confetti: "confetti 3s linear forwards",
        "draw-check": "draw-check 0.5s ease-out 0.3s forwards",
      },
    },
  },
  plugins: [],
};
