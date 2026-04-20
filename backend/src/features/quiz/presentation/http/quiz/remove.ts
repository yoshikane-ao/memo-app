import { Router } from 'express';
import { handleRouteError } from '../../../../../shared/http/requestValidation';
import { openApiRegistry } from '../../../../../shared/openapi/registry';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { QuizUseCases } from '../../../application/quizUseCases';
import { ErrorResponseSchema, QuizIdParamsSchema } from '../schemas';

openApiRegistry.registerPath({
  method: 'delete',
  path: '/quiz/remove/{id}',
  tags: ['quiz'],
  summary: 'クイズの削除',
  security: [{ CookieAuth: [] }],
  request: { params: QuizIdParamsSchema },
  responses: {
    204: { description: '削除成功' },
    404: {
      description: 'クイズが存在しない',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const createRemoveRouter = ({ removeQuiz }: QuizUseCases) => {
  const removeRouter = Router();

  removeRouter.delete('/:id', async (req, res) => {
    try {
      const { id } = QuizIdParamsSchema.parse(req.params);
      await removeQuiz(requireUserId(req), id);
      res.status(204).send();
    } catch (error) {
      return handleRouteError(res, error, 'Failed to delete quiz.', 'Quiz not found.');
    }
  });

  return removeRouter;
};
