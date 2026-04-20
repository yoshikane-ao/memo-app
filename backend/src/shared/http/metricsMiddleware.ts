import type { NextFunction, Request, Response } from 'express';
import { httpRequestDurationSeconds, httpRequestsTotal } from '../metrics';

const resolveRoute = (req: Request): string => {
  // Express 5 では route.path がマッチした場合のみ入る。未マッチ (404) は
  // URL 由来のラベル爆発を避けるため "unknown" に丸める。
  const matchedPath = req.route?.path;
  if (typeof matchedPath === 'string') {
    return `${req.baseUrl ?? ''}${matchedPath}` || matchedPath;
  }
  return 'unknown';
};

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/metrics') {
    return next();
  }

  const endTimer = httpRequestDurationSeconds.startTimer();

  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: resolveRoute(req),
      status_code: String(res.statusCode),
    };
    endTimer(labels);
    httpRequestsTotal.inc(labels);
  });

  next();
}
