import { pinoHttp } from 'pino-http';
import { nanoid } from 'nanoid';
import { logger } from '../logger';

export const requestLogger = pinoHttp({
  logger,
  genReqId: () => nanoid(10),
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  autoLogging: {
    ignore: (req) => req.url === '/health',
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});
