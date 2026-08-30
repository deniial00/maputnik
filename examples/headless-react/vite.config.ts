import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  publicDir: fileURLToPath(new URL("../../public", import.meta.url)),
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    fs: {allow: [fileURLToPath(new URL("../..", import.meta.url))]},
  },
  resolve: { dedupe: ["react", "react-dom", "react-i18next", "i18next"] },
  optimizeDeps: { exclude: ["maplibre-gl/dist/maplibre-gl-worker.mjs"] },
  define: { global: "globalThis" },
  build: {
    outDir: "../../dist-headless",
    sourcemap: true,
    rolldownOptions: { checks: { invalidAnnotation: false } },
  },
});
