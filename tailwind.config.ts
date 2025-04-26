
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      xs: "375px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      // Device-specific breakpoints
      mobile: "640px",
      tablet: "1024px",
      laptop: "1440px",
      desktop: "1536px", 
      // Orientation-specific breakpoints
      portrait: { raw: "(orientation: portrait)" },
      landscape: { raw: "(orientation: landscape)" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        saas: {
          purple: "#8B5CF6",
          "light-purple": "#E5DEFF",
          dark: "#1A1F2C",
        },
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
        // Mobile app specific colors
        mobile: {
          primary: "#9b87f5",
          secondary: "#E5DEFF",
          background: "#f8f9fa",
          card: "#ffffff",
          text: "#333333",
          muted: "#64748b",
          border: "#e2e8f0",
        },
      },
      spacing: {
        // Responsive-specific spacing
        'mobile-container': '16px',
        'tablet-container': '24px',
        'desktop-container': '32px',
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-out": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "float-horizontal": {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(10px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out forwards",
        "fade-in": "fade-in 0.3s ease-out forwards",
        "slide-in": "slide-in 0.3s ease-out forwards",
        "slide-out": "slide-out 0.3s ease-out forwards",
        "float": "float 6s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        "float-fast": "float 4s ease-in-out infinite",
        "float-horizontal": "float-horizontal 6s ease-in-out infinite",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
      },
      backgroundImage: {
        "purple-gradient": "linear-gradient(to bottom right, #4A0072, #9b87f5)",
        "blue-purple-gradient": "linear-gradient(to right, #00AEFF, #9b87f5)",
        "hero-gradient": "radial-gradient(circle at center, #4A0072, #1E0030)",
        "button-gradient": "linear-gradient(to right, #9b87f5, #00C2FF)",
      },
      borderRadius: {
        "mobile": "1rem",
      },
      boxShadow: {
        "mobile": "0 4px 12px rgba(0, 0, 0, 0.1)",
        "glow": "0 0 15px rgba(155, 135, 245, 0.5)",
        "glow-strong": "0 0 30px rgba(155, 135, 245, 0.7)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
