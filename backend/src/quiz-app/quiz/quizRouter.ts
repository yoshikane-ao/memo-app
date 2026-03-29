import { Router } from "express";
import registerRouter from "./register"
import listRouter from "../../quiz-app/quiz/list";

export const quizRouter = Router();

quizRouter.use("/register", registerRouter)
quizRouter.use("/list", listRouter)

quizRouter.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });
