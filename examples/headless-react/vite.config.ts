import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  publicDir: fileURLToPath(new URL("../../public", import.meta.url)),
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    strictPort: true,
    fs: {allow: [fileURLToPath(new URL("../..", import.meta.url))]},
  },
  resolve: {
    alias: {"@": fileURLToPath(new URL("./src", import.meta.url))},
    dedupe: ["react", "react-dom", "react-i18next", "i18next"],
  },
  optimizeDeps: { exclude: ["maplibre-gl/dist/maplibre-gl-worker.mjs"] },
  define: { global: "globalThis" },
  build: {
    outDir: "../../dist-headless",
    sourcemap: true,
    rolldownOptions: {
      input: {
        upstream: fileURLToPath(new URL("./index.html", import.meta.url)),
        shadcn: fileURLToPath(new URL("./shadcn.html", import.meta.url)),
      },
      checks: { invalidAnnotation: false },
    },
  },
});
