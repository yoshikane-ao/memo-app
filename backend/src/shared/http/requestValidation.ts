import type { Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../logger';
import { formatZodError } from '../openapi/zodHelpers';

// リクエスト以外の application 層バリデーション（例: 「ごみ箱のメモのみ完全削除可」）
// でもこのエラーを投げることで、route の handleRouteError で 400 に揃える。
export class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestValidationError';
  }
}

export function handleRouteError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
  notFoundMessage?: string,
) {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: formatZodError(error) });
  }

  if (error instanceof RequestValidationError) {
    return res.status(400).json({ message: error.message });
  }

  if ((error as { code?: string }).code === 'P2025' && notFoundMessage) {
    return res.status(404).json({ message: notFoundMessage });
  }

  // pino-http が req.log にリクエストスコープの child logger を注入するので、
  // あればそれを使い、無ければベースロガーにフォールバック。
  const log = res.req?.log ?? logger;
  log.error({ err: error }, fallbackMessage);
  return res.status(500).json({ message: fallbackMessage });
}
