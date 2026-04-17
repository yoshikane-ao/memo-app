import { Router } from "express";
import { handleRouteError } from "../../../../../shared/http/requestValidation";
import type { QuizUseCases } from "../../../application/quizUseCases";
import { parseQuizIdParams } from "./requestParsing";

export const createFavoriteRouter = ({ toggleQuizFavorite }: QuizUseCases) => {
  const favoriteRouter = Router();

  favoriteRouter.patch("/:id", async (req, res) => {
    try {
      const { id } = parseQuizIdParams(req.params);
      const updatedFavorite = await toggleQuizFavorite(id);
      res.status(200).json(updatedFavorite);
    } catch (error) {
      return handleRouteError(res, error, "Failed to toggle favorite.", "Quiz not found.");
    }
  });

  return favoriteRouter;
};
