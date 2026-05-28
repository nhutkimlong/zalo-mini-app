import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: "index.html",
      external: ["ws"],
      output: {
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


