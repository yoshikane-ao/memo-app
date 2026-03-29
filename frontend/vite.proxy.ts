import type { ProxyOptions } from "vite";

export type ProxyEnv = Record<string, string | undefined>;

export const resolveApiProxyTarget = (env: ProxyEnv, backendEnv: ProxyEnv) => {
  const backendPort = backendEnv.PORT?.trim() || "3004";

  return (
    env.API_PROXY_TARGET ||
    env.VITE_API_BASE_URL ||
    env.VITE_API_URL ||
    `http://127.0.0.1:${backendPort}`
  );
};

export const createApiProxy = (target: string): Record<string, ProxyOptions> => ({
  "/health": {
    target,
    changeOrigin: true,
  },
  "/memos": {
    target,
    changeOrigin: true,
  },
  "/tags": {
    target,
    changeOrigin: true,
  },
  "/quiz": {
    target,
    changeOrigin: true,
  },

  "/trade": {
    target,
    changeOrigin: true,
  }
});
