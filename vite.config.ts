
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Fix for html2pdf.js syntax issues
      target: "es2020",
    },
  },
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["f86ca2e5-f381-4a38-916a-b6b45c97002b.lovableproject.com"]
  },
  build: {
    sourcemap: true,
    target: "esnext"
  },
}));
