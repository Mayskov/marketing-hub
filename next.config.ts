import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { resolve } from "path";

// Manually load .env.local since Next.js 16 Turbopack has issues
try {
  const envPath = resolve(process.cwd(), ".env.local");
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx);
      const value = trimmed.substring(eqIdx + 1);
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
} catch {
  // .env.local not found, skip
}

const nextConfig: NextConfig = {
  serverExternalPackages: ["apify-client"],
};

export default nextConfig;
