import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// Target proxy dev server dikelola lewat environment (tanpa mengubah source):
//   npm run dev          -> .env.development            -> backend lokal
//   npm run dev:server   -> .env.dev-server             -> backend server development
// Override per developer: .env.development.local / .env.dev-server.local (tidak di-commit).
const DEFAULT_PROXY_TARGET = "http://localhost:8000";

// Host API production. Mengarahkan dev server ke host ini membutuhkan izin eksplisit
// (VITE_ALLOW_PRODUCTION_PROXY=true) agar data production tidak termodifikasi tanpa sengaja.
const PRODUCTION_API_HOSTS = ["api-jkstok.my.id"];

function resolveProxyTarget(env: Record<string, string>): string {
  const raw = (env.VITE_DEV_PROXY_TARGET || DEFAULT_PROXY_TARGET).trim().replace(/\/+$/, "");
  let host: string;
  try {
    host = new URL(raw).hostname;
  } catch {
    throw new Error(
      `VITE_DEV_PROXY_TARGET tidak valid: "${raw}". Gunakan URL lengkap, mis. ${DEFAULT_PROXY_TARGET}`,
    );
  }
  if (PRODUCTION_API_HOSTS.includes(host) && env.VITE_ALLOW_PRODUCTION_PROXY !== "true") {
    throw new Error(
      `Dev server diarahkan ke backend PRODUCTION (${host}). Jika memang diizinkan, set ` +
        "VITE_ALLOW_PRODUCTION_PROXY=true pada berkas env lokal Anda; jika tidak, gunakan " +
        "backend lokal atau server development.",
    );
  }
  return raw;
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const proxyTarget = command === "serve" ? resolveProxyTarget(env) : DEFAULT_PROXY_TARGET;

  if (command === "serve") {
    console.log(`\n  [wms] mode "${mode}": request /api diteruskan ke ${proxyTarget}\n`);
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
