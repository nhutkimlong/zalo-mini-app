import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    target: "es2015",
    outDir: "dist",
    assetsDir: "assets",
    cssCodeSplit: false,
    rollupOptions: {
      input: "index.html",
      external: ["ws"],
      output: {
        format: "iife",
        entryFileNames: "assets/index.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
        inlineDynamicImports: true,
        globals: {
          ws: "undefined"
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
});


