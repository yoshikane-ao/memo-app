const prismaMock = {
  $queryRaw: jest.fn<Promise<unknown>, unknown[]>(),
};
jest.mock('./db', () => ({ prisma: prismaMock }));

import { Router } from 'express';
import request from 'supertest';
import { buildApp } from './app';
import type { AppContainer } from './composition/container';

type TestAuthMiddleware = AppContainer['authMiddleware'];

const passThroughMiddleware: TestAuthMiddleware = (_req, _res, next) => {
  next();
  return undefined as never;
};

const unauthorizedMiddleware: TestAuthMiddleware = (_req, res) => {
  return res.status(401).json({ message: 'Unauthorized' });
};

function buildTestContainer(
  authMiddleware: TestAuthMiddleware = unauthorizedMiddleware,
): AppContainer {
  return {
    authMiddleware,
    authRouter: Router(),
    memosRouter: Router(),
    tagsRouter: Router(),
    quizRouter: Router(),
    ensureDemoUser: () => Promise.resolve(),
  };
}

describe('buildApp', () => {
  it('returns 200 from /health', async () => {
    const app = buildApp(buildTestContainer(passThroughMiddleware));
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('returns 200 from /health/ready when DB ping succeeds', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);
    const app = buildApp(buildTestContainer());
    const response = await request(app).get('/health/ready');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', db: 'ok' });
  });

  it('returns 503 from /health/ready when DB ping fails', async () => {
    prismaMock.$queryRaw.mockRejectedValueOnce(new Error('connection refused'));
    const app = buildApp(buildTestContainer());
    const response = await request(app).get('/health/ready');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: 'error', db: 'error' });
  });

  it('returns Prometheus metrics from /metrics', async () => {
    const app = buildApp(buildTestContainer());
    const response = await request(app).get('/metrics');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.text).toContain('http_requests_total');
  });

  it('applies cors and security headers', async () => {
    const app = buildApp(buildTestContainer());
    const response = await request(app).get('/health').set('Origin', 'http://example.com');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('*');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('rate limits repeated requests', async () => {
    const app = buildApp(buildTestContainer());
    let lastResponse = await request(app).get('/health');

    for (let index = 0; index < 60; index += 1) {
      lastResponse = await request(app).get('/health');
    }

    expect(lastResponse.status).toBe(429);
  });

  it('returns 404 for unknown routes', async () => {
    const app = buildApp(buildTestContainer());
    const response = await request(app).get('/missing-route');

    expect(response.status).toBe(404);
  });

  it('rejects /memos without auth', async () => {
    const app = buildApp(buildTestContainer());
    const response = await request(app).get('/memos/list');

    expect(response.status).toBe(401);
    expect(response.body.message).toBeTruthy();
  });

  it('rejects /tags without auth', async () => {
    const app = buildApp(buildTestContainer());
    const response = await request(app).get('/tags/list');

    expect(response.status).toBe(401);
    expect(response.body.message).toBeTruthy();
  });
});
