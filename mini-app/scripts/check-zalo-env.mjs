import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env.production");

const parseEnv = (content) => {
  const result = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    result[key] = value;
  }
  return result;
};

if (!fs.existsSync(envPath)) {
  console.error("[deploy:zalo] Missing mini-app/.env.production.");
  console.error("[deploy:zalo] Copy .env.production.example to .env.production and fill real deploy values.");
  process.exit(1);
}

const env = parseEnv(fs.readFileSync(envPath, "utf8"));
const required = ["APP_ID", "ZMP_TOKEN", "VITE_BASE_URL", "VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];
const missing = required.filter((key) => !env[key] || env[key].startsWith("your-"));

if (missing.length > 0) {
  console.error(`[deploy:zalo] Missing or placeholder values: ${missing.join(", ")}`);
  process.exit(1);
}

if (!env.VITE_BASE_URL.startsWith("https://")) {
  console.error("[deploy:zalo] VITE_BASE_URL must be a public HTTPS backend URL.");
  process.exit(1);
}

if (/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(env.VITE_BASE_URL)) {
  console.error("[deploy:zalo] VITE_BASE_URL cannot point to localhost for Zalo deployment.");
  process.exit(1);
}

if (!env.VITE_SUPABASE_URL.startsWith("https://") || !env.VITE_SUPABASE_URL.includes(".supabase.co")) {
  console.error("[deploy:zalo] VITE_SUPABASE_URL must be your Supabase project URL.");
  process.exit(1);
}

console.log("[deploy:zalo] Production env looks valid.");
