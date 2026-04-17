import { Router } from "express";
import { handleRouteError } from "../../../../../shared/http/requestValidation";
import type { QuizUseCases } from "../../../application/quizUseCases";
import { parseQuizIdParams, parseUpdateQuizBody } from "./requestParsing";

export const createUpdateRouter = ({ updateQuiz }: QuizUseCases) => {
  const updateRouter = Router();

  updateRouter.put("/:id", async (req, res) => {
    try {
      const { id } = parseQuizIdParams(req.params);
      const body = parseUpdateQuizBody(req.body);
      const updatedQuiz = await updateQuiz({ id, ...body });
      res.status(200).json(updatedQuiz);
    } catch (error) {
      return handleRouteError(res, error, "Failed to update quiz.", "Quiz not found.");
    }
  });

  return updateRouter;
};
