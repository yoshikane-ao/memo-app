import { Router } from "express";
import { handleRouteError } from "../../../../../shared/http/requestValidation";
import type { QuizUseCases } from "../../../application/quizUseCases";
import { parseGroupNameParams } from "./requestParsing";

export const createGroupsRouter = ({ deleteQuizGroup, listQuizGroups }: QuizUseCases) => {
  const groupsRouter = Router();

  groupsRouter.get("/", async (_req, res) => {
    try {
      const groups = await listQuizGroups();
      res.status(200).json(groups);
    } catch (error) {
      return handleRouteError(res, error, "Failed to load groups.");
    }
  });

  groupsRouter.delete("/:groupName", async (req, res) => {
    try {
      const { groupName } = parseGroupNameParams(req.params);
      await deleteQuizGroup(groupName);
      res.status(200).json({ message: "Group deleted." });
    } catch (error) {
      return handleRouteError(res, error, "Failed to delete group.");
    }
  });

  return groupsRouter;
};
