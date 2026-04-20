import { Router } from 'express';
import { handleRouteError } from '../../../../../shared/http/requestValidation';
import { openApiRegistry } from '../../../../../shared/openapi/registry';
import { dedupeIntArray } from '../../../../../shared/openapi/zodHelpers';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { QuizUseCases } from '../../../application/quizUseCases';
import {
  BulkUpdateQuizLabelsBodySchema,
  BulkUpdateQuizLabelsResultSchema,
  ErrorResponseSchema,
} from '../schemas';

openApiRegistry.registerPath({
  method: 'patch',
  path: '/quiz/bulk',
  tags: ['quiz'],
  summary: '複数クイズに対するタグ / グループの一括更新',
  security: [{ CookieAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: BulkUpdateQuizLabelsBodySchema } } },
  },
  responses: {
    200: {
      description: '更新件数',
      content: { 'application/json': { schema: BulkUpdateQuizLabelsResultSchema } },
    },
    404: {
      description: '対象のクイズのいずれかが存在しない',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const createBulkRouter = ({ bulkUpdateQuizLabels }: QuizUseCases) => {
  const bulkRouter = Router();

  bulkRouter.patch('/', async (req, res) => {
    try {
      const { quizIds, ...rest } = BulkUpdateQuizLabelsBodySchema.parse(req.body);
      const result = await bulkUpdateQuizLabels({
        userId: requireUserId(req),
        ...rest,
        quizIds: dedupeIntArray(quizIds),
      });
      res.status(200).json(result);
    } catch (error) {
      return handleRouteError(
        res,
        error,
        'Failed to bulk update quiz labels.',
        'One or more quizzes were not found.',
      );
    }
  });

  return bulkRouter;
};
