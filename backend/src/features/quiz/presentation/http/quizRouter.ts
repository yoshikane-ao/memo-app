import { Router } from "express";
import type { QuizUseCases } from "../../application/quizUseCases";
import { createBulkRouter } from "./quiz/bulk";
import { createFavoriteRouter } from "./quiz/favorite";
import { createGroupsRouter } from "./quiz/groups";
import { createListRouter } from "./quiz/list";
import { createRegisterRouter } from "./quiz/register";
import { createRemoveRouter } from "./quiz/remove";
import { createTagsRouter } from "./quiz/tags";
import { createUpdateRouter } from "./quiz/update";

export const createQuizRouter = (quizUseCases: QuizUseCases) => {
  const quizRouter = Router();

  quizRouter.use("/list", createListRouter(quizUseCases));
  quizRouter.use("/register", createRegisterRouter(quizUseCases));
  quizRouter.use("/update", createUpdateRouter(quizUseCases));
  quizRouter.use("/remove", createRemoveRouter(quizUseCases));
  quizRouter.use("/bulk", createBulkRouter(quizUseCases));
  quizRouter.use("/tags", createTagsRouter(quizUseCases));
  quizRouter.use("/groups", createGroupsRouter(quizUseCases));
  quizRouter.use("/favorite", createFavoriteRouter(quizUseCases));

  return quizRouter;
};
