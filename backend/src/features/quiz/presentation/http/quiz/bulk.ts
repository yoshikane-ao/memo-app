import { Router } from "express";
import { handleRouteError } from "../../../../../shared/http/requestValidation";
import type { QuizUseCases } from "../../../application/quizUseCases";
import { parseBulkUpdateQuizLabelsBody } from "./requestParsing";

export const createBulkRouter = ({ bulkUpdateQuizLabels }: QuizUseCases) => {
  const bulkRouter = Router();

  bulkRouter.patch("/", async (req, res) => {
    try {
      const body = parseBulkUpdateQuizLabelsBody(req.body);
      const result = await bulkUpdateQuizLabels(body);
      res.status(200).json(result);
    } catch (error) {
      return handleRouteError(
        res,
        error,
        "Failed to bulk update quiz labels.",
        "One or more quizzes were not found."
      );
    }
  });

  return bulkRouter;
};
