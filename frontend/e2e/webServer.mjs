import http from 'node:http';
import { createReadStream, existsSync, promises as fs } from 'node:fs';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const distDir = resolve(__dirname, '../dist');
const host = process.env.HOST ?? '127.0.0.1';
const port = Number(process.env.PORT ?? '4311');
const apiTarget = new URL(process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:4310');

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const isApiRequest = (pathname) =>
  pathname === '/health' ||
  pathname.startsWith('/memos') ||
  pathname.startsWith('/tags') ||
  pathname.startsWith('/auth') ||
  pathname.startsWith('/quiz') ||
  pathname.startsWith('/api');

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
};

const serveFile = async (res, filePath) => {
  const stats = await fs.stat(filePath);
  res.writeHead(200, {
    'content-type': mimeTypes[extname(filePath)] ?? 'application/octet-stream',
    'content-length': stats.size,
  });
  createReadStream(filePath).pipe(res);
};

const proxyApiRequest = (req, res) => {
  const targetUrl = new URL(req.url ?? '/', apiTarget);
  const proxyRequest = http.request(
    {
      hostname: targetUrl.hostname,
      port: targetUrl.port,
      path: `${targetUrl.pathname}${targetUrl.search}`,
      method: req.method,
      headers: req.headers,
    },
    (proxyResponse) => {
      res.writeHead(proxyResponse.statusCode ?? 502, proxyResponse.headers);
      proxyResponse.pipe(res);
    },
  );

  proxyRequest.on('error', (error) => {
    sendJson(res, 502, {
      message: 'Failed to proxy API request.',
      detail: error instanceof Error ? error.message : 'Unknown proxy error.',
    });
  });

  req.pipe(proxyRequest);
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? `${host}:${port}`}`);
  const pathname = url.pathname;

  if (isApiRequest(pathname)) {
    proxyApiRequest(req, res);
    return;
  }

  const requestedPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const resolvedPath = resolve(distDir, requestedPath);

  if (!resolvedPath.startsWith(distDir)) {
    sendJson(res, 403, { message: 'Forbidden.' });
    return;
  }

  try {
    if (existsSync(resolvedPath)) {
      await serveFile(res, resolvedPath);
      return;
    }

    await serveFile(res, resolve(distDir, 'index.html'));
  } catch (error) {
    sendJson(res, 500, {
      message: 'Failed to serve frontend.',
      detail: error instanceof Error ? error.message : 'Unknown static server error.',
    });
  }
});

server.listen(port, host, () => {
  console.log(`E2E frontend server listening on http://${host}:${port}`);
});

const shutdown = () => {
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
