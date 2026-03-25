import express, { Request, Response } from "express";
import { memosRouter } from "./memoApp/memos/memosRouter";
import { tagsRouter } from "./memoApp/tags/tagsRouter";
import helmet from "helmet";
import rateLimit from "express-rate-limit";


// 初期セットアップ
export function buildApp() {
  const app = express();
  const cors = require('cors');
  app.use(cors());
  // helmetを使用してセキュリティヘッダーを設定
  app.use(helmet());
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
  });


  // 全てのリクエストに対してレートリミットを適用
  app.use(limiter);

  // JSONのリクエストボディをパースするミドルウェア
  app.use(express.json());


  //URLエンドポイントとルーティング
  // ヘルスチェック（稼働確認）
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  // メモ関連のAPI
  app.use("/memos", memosRouter);

  // タグ関連のAPI
  app.use("/tags", tagsRouter);

  return app;
}