import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { createContainer, type AppContainer } from './composition/container';
import { prisma } from './db';
import { requestLogger } from './shared/http/requestLogger';
import { metricsMiddleware } from './shared/http/metricsMiddleware';
import { registry as metricsRegistry } from './shared/metrics';
import { createDocsRouter } from './shared/openapi/docsRouter';
import { registerSentryErrorHandler } from './shared/sentry';

const createRateLimiter = () =>
  rateLimit({
    windowMs: config.rateLimitWindowMs,
    limit: config.rateLimitMaxRequests,
  });

const registerRoutes = (app: express.Express, container: AppContainer) => {
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/health/ready', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: 'ok', db: 'ok' });
    } catch (error) {
      res.req?.log?.error({ err: error }, 'readiness check failed');
      res.status(503).json({ status: 'error', db: 'error' });
    }
  });

  app.get('/metrics', async (_req, res) => {
    res.setHeader('Content-Type', metricsRegistry.contentType);
    res.send(await metricsRegistry.metrics());
  });

  app.use('/auth', container.authRouter);
  app.use('/memos', container.authMiddleware, container.memosRouter);
  app.use('/tags', container.authMiddleware, container.tagsRouter);
  app.use('/quiz', container.authMiddleware, container.quizRouter);
  // OpenAPI ドキュメント。認証不要（公開 API 仕様として閲覧可能）。
  app.use('/api', createDocsRouter());
};

export function buildApp(container: AppContainer = createContainer()) {
  const app = express();

  app.use(requestLogger);
  app.use(metricsMiddleware);
  app.use(cors());
  // Swagger UI が 'unsafe-inline' / 'unsafe-eval' を要求し、HTTP 配信環境では
  // upgrade-insecure-requests が誤動作するため、CSP を portfolio 用に緩める。
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          'upgrade-insecure-requests': null,
        },
      },
    }),
  );
  app.use(createRateLimiter());
  app.use(express.json());
  app.use(cookieParser());

  registerRoutes(app, container);

  registerSentryErrorHandler(app);

  return app;
}
