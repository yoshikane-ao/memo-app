import { Router } from "express";
import { handleRouteError } from "../../../../../shared/http/requestValidation";
import type { QuizUseCases } from "../../../application/quizUseCases";
import { parseCreateQuizBody } from "./requestParsing";

export const createRegisterRouter = ({ createQuiz }: QuizUseCases) => {
  const registerRouter = Router();

  registerRouter.post("/", async (req, res) => {
    try {
      const body = parseCreateQuizBody(req.body);
      const quiz = await createQuiz(body);
      res.status(201).json(quiz);
    } catch (error) {
      return handleRouteError(res, error, "Failed to create quiz.");
    }
  });

  return registerRouter;
};
