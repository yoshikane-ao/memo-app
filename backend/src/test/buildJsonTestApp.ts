import express, { type Router } from 'express';

export interface BuildJsonTestAppOptions {
  // authMiddleware を通さずに req.userId を注入するためのスタブ。
  // 認証ミドルウェアの振る舞いはここでは検証対象にしないため、
  // ルータ単位の単体テストではこの注入で十分とする。
  userId?: number;
}

export const buildJsonTestApp = (router: Router, options: BuildJsonTestAppOptions = {}) => {
  const app = express();
  app.use(express.json());

  if (options.userId !== undefined) {
    const userId = options.userId;
    app.use((req, _res, next) => {
      (req as express.Request & { userId?: number }).userId = userId;
      next();
    });
  }

  app.use('/', router);
  return app;
};
