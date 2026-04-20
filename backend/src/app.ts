import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { prisma } from './db';
import { authMiddleware, authRouter } from './features/auth';
import { memosRouter, tagsRouter } from './features/memo';
import { quizRouter } from './features/quiz';
import { requestLogger } from './shared/http/requestLogger';
import { metricsMiddleware } from './shared/http/metricsMiddleware';
import { registry as metricsRegistry } from './shared/metrics';
import { registerSentryErrorHandler } from './shared/sentry';
// import { tradeAppRoutes } from "./tradeApp/routes"

const createRateLimiter = () =>
  rateLimit({
    windowMs: config.rateLimitWindowMs,
    limit: config.rateLimitMaxRequests,
  });

const registerRoutes = (app: express.Express) => {
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

  app.use('/auth', authRouter);
  app.use('/memos', authMiddleware, memosRouter);
  app.use('/tags', authMiddleware, tagsRouter);
  // NOTE: /quiz は Session 2b で authMiddleware 適用予定（現時点では未保護）
  app.use('/quiz', quizRouter);
  // app.use("/quizTag", quizTagRouter);
  // app.use("/trade", tradeAppRoutes);
};

export function buildApp() {
  const app = express();

  app.use(requestLogger);
  app.use(metricsMiddleware);
  app.use(cors());
  app.use(helmet());
  app.use(createRateLimiter());
  app.use(express.json());
  app.use(cookieParser());

  registerRoutes(app);

  registerSentryErrorHandler(app);

  return app;
}
