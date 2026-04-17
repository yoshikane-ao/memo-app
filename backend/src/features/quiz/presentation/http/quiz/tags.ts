import { Router } from "express";
import { handleRouteError } from "../../../../../shared/http/requestValidation";
import type { QuizUseCases } from "../../../application/quizUseCases";
import { parseTagNameParams } from "./requestParsing";

export const createTagsRouter = ({ deleteQuizTag, listQuizTags }: QuizUseCases) => {
  const tagsRouter = Router();

  tagsRouter.get("/", async (_req, res) => {
    try {
      const tags = await listQuizTags();
      res.status(200).json(tags);
    } catch (error) {
      return handleRouteError(res, error, "Failed to load tags.");
    }
  });

  tagsRouter.delete("/:tagName", async (req, res) => {
    try {
      const { tagName } = parseTagNameParams(req.params);
      await deleteQuizTag(tagName);
      res.status(200).json({ message: "Tag deleted." });
    } catch (error) {
      return handleRouteError(res, error, "Failed to delete tag.", "Tag not found.");
    }
  });

  return tagsRouter;
};
