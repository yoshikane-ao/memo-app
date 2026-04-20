import { Router } from 'express';
import { handleRouteError } from '../../../../../shared/http/requestValidation';
import { openApiRegistry } from '../../../../../shared/openapi/registry';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { MemoUseCases } from '../../../application/memoUseCases';
import { ErrorResponseSchema, ListMemoQuerySchema, MemoListResponseSchema } from '../schemas';

openApiRegistry.registerPath({
  method: 'get',
  path: '/memos/list',
  tags: ['memo'],
  summary: 'メモ一覧の取得',
  security: [{ CookieAuth: [] }],
  request: {
    query: ListMemoQuerySchema,
  },
  responses: {
    200: {
      description: 'メモ一覧',
      content: { 'application/json': { schema: MemoListResponseSchema } },
    },
    401: {
      description: '未認証',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const createListRouter = ({ listMemos }: MemoUseCases) => {
  const listRouter = Router();

  listRouter.get('/', async (req, res) => {
    try {
      const { scope } = ListMemoQuerySchema.parse(req.query);
      const memos = await listMemos(requireUserId(req), scope);

      res.status(200).json({ items: memos });
    } catch (error) {
      return handleRouteError(res, error, 'Failed to load memos.');
    }
  });

  return listRouter;
};
