import { Router } from 'express';
import { handleRouteError } from '../../../../../shared/http/requestValidation';
import { openApiRegistry, z } from '../../../../../shared/openapi/registry';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { QuizUseCases } from '../../../application/quizUseCases';
import { ErrorResponseSchema, QuizTagNameParamsSchema, QuizTagSchema } from '../schemas';

const QuizTagsListResponseSchema = z.array(QuizTagSchema).openapi('QuizTagsListResponse');
openApiRegistry.register('QuizTagsListResponse', QuizTagsListResponseSchema);

const OkMessageSchema = z.object({ message: z.string() });

openApiRegistry.registerPath({
  method: 'get',
  path: '/quiz/tags',
  tags: ['quiz'],
  summary: 'クイズタグ一覧の取得',
  security: [{ CookieAuth: [] }],
  responses: {
    200: {
      description: 'タグ一覧',
      content: { 'application/json': { schema: QuizTagsListResponseSchema } },
    },
  },
});

openApiRegistry.registerPath({
  method: 'delete',
  path: '/quiz/tags/{tagName}',
  tags: ['quiz'],
  summary: 'クイズタグを名前で削除',
  security: [{ CookieAuth: [] }],
  request: { params: QuizTagNameParamsSchema },
  responses: {
    200: {
      description: '削除成功',
      content: { 'application/json': { schema: OkMessageSchema } },
    },
    404: {
      description: 'タグが存在しない',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const createTagsRouter = ({ deleteQuizTag, listQuizTags }: QuizUseCases) => {
  const tagsRouter = Router();

  tagsRouter.get('/', async (req, res) => {
    try {
      const tags = await listQuizTags(requireUserId(req));
      res.status(200).json(tags);
    } catch (error) {
      return handleRouteError(res, error, 'Failed to load tags.');
    }
  });

  tagsRouter.delete('/:tagName', async (req, res) => {
    try {
      const { tagName } = QuizTagNameParamsSchema.parse(req.params);
      await deleteQuizTag(requireUserId(req), tagName);
      res.status(200).json({ message: 'Tag deleted.' });
    } catch (error) {
      return handleRouteError(res, error, 'Failed to delete tag.', 'Tag not found.');
    }
  });

  return tagsRouter;
};
