import { Router } from 'express';
import { handleRouteError } from '../../../../../shared/http/requestValidation';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { QuizUseCases } from '../../../application/quizUseCases';
import { parseQuizIdParams } from './requestParsing';

export const createRemoveRouter = ({ removeQuiz }: QuizUseCases) => {
  const removeRouter = Router();

  removeRouter.delete('/:id', async (req, res) => {
    try {
      const { id } = parseQuizIdParams(req.params);
      await removeQuiz(requireUserId(req), id);
      res.status(204).send();
    } catch (error) {
      return handleRouteError(res, error, 'Failed to delete quiz.', 'Quiz not found.');
    }
  });

  return removeRouter;
};
