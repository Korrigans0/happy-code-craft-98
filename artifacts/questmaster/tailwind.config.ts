import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        feature: {
          dice: "hsl(var(--feature-dice))",
          maps: "hsl(var(--feature-maps))",
          compendium: "hsl(var(--feature-compendium))",
          character: "hsl(var(--feature-character))",
        },
      },
      fontFamily: {
        display: ["Cinzel", "serif"],
        body: ["Lora", "serif"],
        sans: ["Lora", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "shake-crit": {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "20%": { transform: "translate3d(-6px, 2px, 0) rotate(-0.4deg)" },
          "40%": { transform: "translate3d(7px, -3px, 0) rotate(0.4deg)" },
          "60%": { transform: "translate3d(-5px, 4px, 0) rotate(-0.3deg)" },
          "80%": { transform: "translate3d(4px, -2px, 0) rotate(0.2deg)" },
        },
        "shake-fail": {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "25%": { transform: "translate3d(-3px, 1px, 0)" },
          "50%": { transform: "translate3d(3px, -1px, 0)" },
          "75%": { transform: "translate3d(-2px, 2px, 0)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shake-crit": "shake-crit 0.6s cubic-bezier(.36,.07,.19,.97) both",
        "shake-fail": "shake-fail 0.6s ease-in-out both",
        "fade-in": "fade-in 0.4s ease-out both",
        "fade-out": "fade-out 0.7s ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
