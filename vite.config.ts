import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Cibles larges pour assurer la compatibilité avec les navigateurs UE
  // (Safari iOS 14+, Chrome/Edge/Firefox récents inclus).
  build: {
    target: ["es2020", "edge90", "firefox90", "chrome90", "safari14"],
    cssTarget: ["chrome90", "edge90", "firefox90", "safari14"],
  },
}));
