import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import { memosRouter } from "./memoApp/memos/memosRouter";
import { tagsRouter } from "./memoApp/tags/tagsRouter";

<<<<<<< HEAD
const createRateLimiter = () =>
  rateLimit({
    windowMs: config.rateLimitWindowMs,
    limit: config.rateLimitMaxRequests,
=======

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
>>>>>>> main
  });

const registerRoutes = (app: express.Express) => {
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/memos", memosRouter);
  app.use("/tags", tagsRouter);
};

export function buildApp() {
  const app = express();

  app.use(cors());
  app.use(helmet());
  app.use(createRateLimiter());
  app.use(express.json());

  registerRoutes(app);

  return app;
}
