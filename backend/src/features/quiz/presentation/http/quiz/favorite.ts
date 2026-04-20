import { Router } from 'express';
import { handleRouteError } from '../../../../../shared/http/requestValidation';
import { openApiRegistry } from '../../../../../shared/openapi/registry';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { QuizUseCases } from '../../../application/quizUseCases';
import { ErrorResponseSchema, QuizFavoriteStateSchema, QuizIdParamsSchema } from '../schemas';

openApiRegistry.registerPath({
  method: 'patch',
  path: '/quiz/favorite/{id}',
  tags: ['quiz'],
  summary: 'クイズのお気に入り状態をトグル',
  security: [{ CookieAuth: [] }],
  request: { params: QuizIdParamsSchema },
  responses: {
    200: {
      description: 'トグル後の状態',
      content: { 'application/json': { schema: QuizFavoriteStateSchema } },
    },
    404: {
      description: 'クイズが存在しない',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const createFavoriteRouter = ({ toggleQuizFavorite }: QuizUseCases) => {
  const favoriteRouter = Router();

  favoriteRouter.patch('/:id', async (req, res) => {
    try {
      const { id } = QuizIdParamsSchema.parse(req.params);
      const updatedFavorite = await toggleQuizFavorite(requireUserId(req), id);
      res.status(200).json(updatedFavorite);
    } catch (error) {
      return handleRouteError(res, error, 'Failed to toggle favorite.', 'Quiz not found.');
    }
  });

  return favoriteRouter;
};
