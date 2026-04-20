// Prisma の `P2025` (RecordNotFound) と互換な code を持たせ、
// handleRouteError や既存の rejects.toMatchObject({ code: 'P2025' }) を素通りさせる。
// Error を継承することで stacktrace・unhandledRejection 捕捉・Sentry 連携が正しく働く。
export class RecordNotFoundError extends Error {
  readonly code = 'P2025' as const;

  constructor(message = 'Record not found') {
    super(message);
    this.name = 'RecordNotFoundError';
  }
}
