import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import { memosRouter } from "./memoApp/memos/memosRouter";
import { tagsRouter } from "./memoApp/tags/tagsRouter";
import { quizRouter } from "./quiz-app/quiz/quizRouter"
// import { tradeAppRoutes } from "./tradeApp/routes"

const createRateLimiter = () =>
  rateLimit({
    windowMs: config.rateLimitWindowMs,
    limit: config.rateLimitMaxRequests,
  });

const registerRoutes = (app: express.Express) => {
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/memos", memosRouter);
  app.use("/tags", tagsRouter);
  app.use("/quiz", quizRouter);
  // app.use("/quizTag", quizTagRouter);
  // app.use("/trade", tradeAppRoutes);
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

