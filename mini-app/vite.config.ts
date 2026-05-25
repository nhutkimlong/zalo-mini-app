import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

function zaloMiniAppPlugin() {
  return {
    name: "zalo-mini-app-plugin",
    closeBundle() {
      const root = process.cwd();
      const outDir = path.join(root, "www");
      const appConfigSrc = path.join(root, "app-config.json");
      const appConfigDest = path.join(outDir, "app-config.json");

      console.log("[zalo-plugin] Running post-build packaging...");

      // 1. Copy app-config.json
      if (fs.existsSync(appConfigSrc)) {
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true });
        }
        fs.copyFileSync(appConfigSrc, appConfigDest);
        console.log(`[zalo-plugin] Copied app-config.json to ${outDir}`);
      }

      // 2. Adjust script tags in index.html to remove type="module"
      const indexHtmlPath = path.join(outDir, "index.html");
      if (fs.existsSync(indexHtmlPath)) {
        let content = fs.readFileSync(indexHtmlPath, "utf8");
        content = content.replace(/type="module"\s+crossorigin\s+src=/g, 'defer src=');
        fs.writeFileSync(indexHtmlPath, content, "utf8");
        console.log("[zalo-plugin] Patched index.html for Zalo HTML5 / Webview compatibility.");
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), zaloMiniAppPlugin()],
  base: "./",
  build: {
    target: "es2015",
    outDir: "www",
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


