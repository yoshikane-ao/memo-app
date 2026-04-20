import { createConfig } from './config';

describe('createConfig', () => {
  it('uses defaults when env values are missing', () => {
    const cfg = createConfig({});
    expect(cfg).toMatchObject({
      host: '0.0.0.0',
      port: 3004,
      rateLimitWindowMs: 60_000,
      rateLimitMaxRequests: 60,
      logLevel: 'info',
      auth: {
        accessTokenTtl: '15m',
        refreshTokenTtl: '7d',
        cookieSecure: false,
        cookieDomain: undefined,
      },
    });
    // Dev fallback が 32 文字以上であることだけ確認し、値そのものはテストしない。
    expect(cfg.auth.jwtSecret.length).toBeGreaterThanOrEqual(32);
  });

  it('parses valid env values', () => {
    const cfg = createConfig({
      HOST: '127.0.0.1',
      PORT: '3000',
      RATE_LIMIT_WINDOW_MS: '120000',
      RATE_LIMIT_MAX_REQUESTS: '120',
      LOG_LEVEL: 'debug',
      JWT_SECRET: 'a'.repeat(32),
      JWT_ACCESS_TTL: '30m',
      JWT_REFRESH_TTL: '14d',
      COOKIE_SECURE: 'true',
      COOKIE_DOMAIN: 'example.com',
    });
    expect(cfg).toEqual({
      host: '127.0.0.1',
      port: 3000,
      rateLimitWindowMs: 120000,
      rateLimitMaxRequests: 120,
      logLevel: 'debug',
      auth: {
        jwtSecret: 'a'.repeat(32),
        accessTokenTtl: '30m',
        refreshTokenTtl: '14d',
        cookieSecure: true,
        cookieDomain: 'example.com',
      },
    });
  });

  it('falls back when numeric env values are invalid', () => {
    const cfg = createConfig({
      HOST: ' ',
      PORT: 'not-a-number',
      RATE_LIMIT_WINDOW_MS: '-1',
      RATE_LIMIT_MAX_REQUESTS: '0',
      LOG_LEVEL: 'bogus',
      JWT_SECRET: 'too-short',
      COOKIE_SECURE: 'maybe',
    });
    expect(cfg).toMatchObject({
      host: '0.0.0.0',
      port: 3004,
      rateLimitWindowMs: 60_000,
      rateLimitMaxRequests: 60,
      logLevel: 'info',
      auth: {
        accessTokenTtl: '15m',
        refreshTokenTtl: '7d',
        cookieSecure: false,
      },
    });
    expect(cfg.auth.jwtSecret.length).toBeGreaterThanOrEqual(32);
  });
});
