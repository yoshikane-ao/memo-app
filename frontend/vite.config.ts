import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { createApiProxy, resolveApiProxyTarget } from "./vite.proxy";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendEnv = loadEnv(mode, resolve(__dirname, "../backend"), "");
  const apiProxyTarget = resolveApiProxyTarget(env, backendEnv);

  return {
    plugins: [vue()],
    server: {
      proxy: createApiProxy(apiProxyTarget),
    },
  };
});
