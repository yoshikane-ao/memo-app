import { Router } from 'express';
import { handleRouteError } from '../../../../../shared/http/requestValidation';
import { openApiRegistry } from '../../../../../shared/openapi/registry';
import { normalizeStringArray } from '../../../../../shared/openapi/zodHelpers';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { QuizUseCases } from '../../../application/quizUseCases';
import {
  ErrorResponseSchema,
  QuizIdParamsSchema,
  QuizSchema,
  UpdateQuizBodySchema,
} from '../schemas';

openApiRegistry.registerPath({
  method: 'put',
  path: '/quiz/update/{id}',
  tags: ['quiz'],
  summary: 'クイズの更新',
  security: [{ CookieAuth: [] }],
  request: {
    params: QuizIdParamsSchema,
    body: { content: { 'application/json': { schema: UpdateQuizBodySchema } } },
  },
  responses: {
    200: {
      description: '更新成功',
      content: { 'application/json': { schema: QuizSchema } },
    },
    404: {
      description: 'クイズが存在しない',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const createUpdateRouter = ({ updateQuiz }: QuizUseCases) => {
  const updateRouter = Router();

  updateRouter.put('/:id', async (req, res) => {
    try {
      const { id } = QuizIdParamsSchema.parse(req.params);
      const { tag, choices, ...rest } = UpdateQuizBodySchema.parse(req.body);
      const updatedQuiz = await updateQuiz({
        userId: requireUserId(req),
        id,
        ...rest,
        tag: normalizeStringArray(tag),
        choices: normalizeStringArray(choices),
      });
      res.status(200).json(updatedQuiz);
    } catch (error) {
      return handleRouteError(res, error, 'Failed to update quiz.', 'Quiz not found.');
    }
  });

  return updateRouter;
};
