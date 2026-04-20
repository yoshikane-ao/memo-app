import { Router } from 'express';
import { handleRouteError } from '../../../../../shared/http/requestValidation';
import { openApiRegistry, z } from '../../../../../shared/openapi/registry';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { QuizUseCases } from '../../../application/quizUseCases';
import { ErrorResponseSchema, QuizSchema } from '../schemas';

const QuizListResponseSchema = z.array(QuizSchema).openapi('QuizListResponse');
openApiRegistry.register('QuizListResponse', QuizListResponseSchema);

openApiRegistry.registerPath({
  method: 'get',
  path: '/quiz/list',
  tags: ['quiz'],
  summary: 'クイズ一覧の取得',
  security: [{ CookieAuth: [] }],
  responses: {
    200: {
      description: 'クイズ一覧',
      content: { 'application/json': { schema: QuizListResponseSchema } },
    },
    401: {
      description: '未認証',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

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
