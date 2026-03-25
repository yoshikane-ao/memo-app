// @vitest-environment node

import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import { createApiProxy, resolveApiProxyTarget } from "../../../vite.proxy";

type MemoDto = {
  id: number;
  orderIndex: number;
  width: number | null;
  height: number | null;
  title: string;
  content: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  memo_tags: Array<{
    memo_id: number;
    tag_id: number;
    tag: {
      id: number;
      title: string;
    };
  }>;
};

const FRONTEND_ROOT = "C:/personal-development/memo-app/frontend";

let backendServer: http.Server | null = null;
let viteServer: ViteDevServer | null = null;

const listen = (server: http.Server) =>
  new Promise<number>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve((server.address() as AddressInfo).port);
    });
  });

const closeServer = (server: http.Server) =>
  new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

const readJsonBody = async (req: http.IncomingMessage) => {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
};

const sendJson = (res: http.ServerResponse, statusCode: number, payload: unknown) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
};

afterEach(async () => {
  if (viteServer) {
    await viteServer.close();
    viteServer = null;
  }

  if (backendServer) {
    await closeServer(backendServer);
    backendServer = null;
  }
});

describe("vite proxy configuration", () => {
  it("uses frontend overrides before falling back to backend PORT", () => {
    expect(resolveApiProxyTarget({}, { PORT: "3000" })).toBe("http://127.0.0.1:3000");
    expect(resolveApiProxyTarget({ VITE_API_BASE_URL: "http://127.0.0.1:4100" }, { PORT: "3000" })).toBe(
      "http://127.0.0.1:4100"
    );
    expect(resolveApiProxyTarget({ API_PROXY_TARGET: "http://127.0.0.1:4200" }, { PORT: "3000" })).toBe(
      "http://127.0.0.1:4200"
    );
  });

  it("proxies health, list, and create requests through the Vite dev server", async () => {
    const existingMemo: MemoDto = {
      id: 1,
      orderIndex: 0,
      width: 180,
      height: 48,
      title: "Existing",
      content: "Saved memo",
      deletedAt: null,
      createdAt: "2026-03-25T00:00:00.000Z",
      updatedAt: "2026-03-25T00:00:00.000Z",
      memo_tags: [],
    };

    backendServer = http.createServer(async (req, res) => {
      const url = new URL(req.url ?? "/", "http://127.0.0.1");

      if (req.method === "GET" && url.pathname === "/health") {
        sendJson(res, 200, { status: "ok" });
        return;
      }

      if (req.method === "GET" && url.pathname === "/memos/list") {
        sendJson(res, 200, { items: [existingMemo] });
        return;
      }

      if (req.method === "POST" && url.pathname === "/memos/register") {
        const body = await readJsonBody(req);
        const createdMemo: MemoDto = {
          id: 2,
          orderIndex: 1,
          width: null,
          height: null,
          title: String(body.title ?? ""),
          content: String(body.content ?? ""),
          deletedAt: null,
          createdAt: "2026-03-25T00:01:00.000Z",
          updatedAt: "2026-03-25T00:01:00.000Z",
          memo_tags: Array.isArray(body.tags)
            ? body.tags.map((tagTitle, index) => ({
                memo_id: 2,
                tag_id: index + 1,
                tag: {
                  id: index + 1,
                  title: String(tagTitle),
                },
              }))
            : [],
        };

        sendJson(res, 201, createdMemo);
        return;
      }

      sendJson(res, 404, { message: "Not found." });
    });

    const backendPort = await listen(backendServer);

    viteServer = await createViteServer({
      configFile: false,
      root: FRONTEND_ROOT,
      logLevel: "error",
      publicDir: false,
      appType: "spa",
      optimizeDeps: {
        noDiscovery: true,
      },
      server: {
        host: "127.0.0.1",
        port: 0,
        strictPort: false,
        hmr: false,
        proxy: createApiProxy(`http://127.0.0.1:${backendPort}`),
      },
    });

    await viteServer.listen();

    const vitePort = (viteServer.httpServer?.address() as AddressInfo).port;
    const baseUrl = `http://127.0.0.1:${vitePort}`;

    const healthResponse = await fetch(`${baseUrl}/health`);
    expect(healthResponse.status).toBe(200);
    expect(await healthResponse.json()).toEqual({ status: "ok" });

    const listResponse = await fetch(`${baseUrl}/memos/list`);
    expect(listResponse.status).toBe(200);
    expect(await listResponse.json()).toEqual({ items: [existingMemo] });

    const createResponse = await fetch(`${baseUrl}/memos/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Created through proxy",
        content: "Smoke test",
        tags: ["work"],
      }),
    });

    expect(createResponse.status).toBe(201);
    expect(await createResponse.json()).toEqual({
      id: 2,
      orderIndex: 1,
      width: null,
      height: null,
      title: "Created through proxy",
      content: "Smoke test",
      deletedAt: null,
      createdAt: "2026-03-25T00:01:00.000Z",
      updatedAt: "2026-03-25T00:01:00.000Z",
      memo_tags: [
        {
          memo_id: 2,
          tag_id: 1,
          tag: {
            id: 1,
            title: "work",
          },
        },
      ],
    });
  });
});
