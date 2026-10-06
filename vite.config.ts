import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/aerion/" : "/",
  plugins: [react(), tailwindcss()],
  build: { rollupOptions: { output: { manualChunks: { three: ["three", "@react-three/fiber", "@react-three/drei", "@react-three/postprocessing"] } } } },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
