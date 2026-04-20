import { Router } from 'express';
import { handleRouteError } from '../../../../../shared/http/requestValidation';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { QuizUseCases } from '../../../application/quizUseCases';

export const createListRouter = ({ listQuizzes }: QuizUseCases) => {
  const listRouter = Router();

  listRouter.get('/', async (req, res) => {
    try {
      const quizzes = await listQuizzes(requireUserId(req));
      res.status(200).json(quizzes);
    } catch (error) {
      return handleRouteError(res, error, 'Failed to load quizzes.');
    }
  });

  return listRouter;
};
