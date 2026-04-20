import { Router } from 'express';
import { handleRouteError } from '../../../../../shared/http/requestValidation';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { QuizUseCases } from '../../../application/quizUseCases';
import { parseQuizIdParams, parseUpdateQuizBody } from './requestParsing';

export const createUpdateRouter = ({ updateQuiz }: QuizUseCases) => {
  const updateRouter = Router();

  updateRouter.put('/:id', async (req, res) => {
    try {
      const { id } = parseQuizIdParams(req.params);
      const body = parseUpdateQuizBody(req.body);
      const updatedQuiz = await updateQuiz({ userId: requireUserId(req), id, ...body });
      res.status(200).json(updatedQuiz);
    } catch (error) {
      return handleRouteError(res, error, 'Failed to update quiz.', 'Quiz not found.');
    }
  });

  return updateRouter;
};
