jest.mock('./features/memo', () => {
  const { Router } = jest.requireActual<typeof import('express')>('express');
  return {
    memosRouter: Router(),
    tagsRouter: Router(),
  };
});

jest.mock('./features/quiz', () => {
  const { Router } = jest.requireActual<typeof import('express')>('express');
  return {
    quizRouter: Router(),
  };
});

const prismaMock = {
  $queryRaw: jest.fn<Promise<unknown>, unknown[]>(),
};
jest.mock('./db', () => ({ prisma: prismaMock }));

import request from 'supertest';
import { buildApp } from './app';

describe('buildApp', () => {
  it('returns 200 from /health', async () => {
    const app = buildApp();
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('returns 200 from /health/ready when DB ping succeeds', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);
    const app = buildApp();
    const response = await request(app).get('/health/ready');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', db: 'ok' });
  });

  it('returns 503 from /health/ready when DB ping fails', async () => {
    prismaMock.$queryRaw.mockRejectedValueOnce(new Error('connection refused'));
    const app = buildApp();
    const response = await request(app).get('/health/ready');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: 'error', db: 'error' });
  });

  it('returns Prometheus metrics from /metrics', async () => {
    const app = buildApp();
    const response = await request(app).get('/metrics');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.text).toContain('http_requests_total');
  });

  it('applies cors and security headers', async () => {
    const app = buildApp();
    const response = await request(app).get('/health').set('Origin', 'http://example.com');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('*');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('rate limits repeated requests', async () => {
    const app = buildApp();
    let lastResponse = await request(app).get('/health');

    for (let index = 0; index < 60; index += 1) {
      lastResponse = await request(app).get('/health');
    }

    expect(lastResponse.status).toBe(429);
  });

  it('returns 404 for unknown routes', async () => {
    const app = buildApp();
    const response = await request(app).get('/missing-route');

    expect(response.status).toBe(404);
  });
});
