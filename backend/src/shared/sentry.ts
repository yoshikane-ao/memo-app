import * as Sentry from '@sentry/node';
import type { Express } from 'express';
import { logger } from './logger';

let initialized = false;

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'production',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
  });

  initialized = true;
  logger.info('Sentry initialized');
}

export function registerSentryErrorHandler(app: Express): void {
  if (!initialized) {
    return;
  }
  Sentry.setupExpressErrorHandler(app);
}
