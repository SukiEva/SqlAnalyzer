import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";
import path from "node:path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

const appRoot = fileURLToPath(new URL("./src", import.meta.url));
const pev2Root = fileURLToPath(new URL("./vendor/pev2/src", import.meta.url));
const pev2Package = JSON.parse(
  readFileSync(fileURLToPath(new URL("./vendor/pev2/package.json", import.meta.url)), "utf-8"),
);
const pev2Version = pev2Package?.version ?? "dev";

function scopedAliasPlugin() {
  return {
    name: "scoped-alias",
    enforce: "pre",
    async resolveId(source: string, importer?: string) {
      if (!source.startsWith("@/")) return null;
      const base = importer && importer.includes("/vendor/pev2/") ? pev2Root : appRoot;
      const resolved = path.resolve(base, source.slice(2));
      const result = await this.resolve(resolved, importer, { skipSelf: true });
      return result?.id ?? resolved;
    },
  };
}

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [scopedAliasPlugin(), vue()],
  define: {
    __APP_VERSION__: JSON.stringify(pev2Version),
  },
  resolve: {},

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
