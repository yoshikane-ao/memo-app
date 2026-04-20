import { Router } from 'express';
import { handleRouteError } from '../../../../../shared/http/requestValidation';
import { openApiRegistry } from '../../../../../shared/openapi/registry';
import { requireUserId } from '../../../../../shared/http/authContext';
import { type MemoUseCases } from '../../../application/memoUseCases';
import { ErrorResponseSchema, MemoListResponseSchema, SearchMemoQuerySchema } from '../schemas';

openApiRegistry.registerPath({
  method: 'get',
  path: '/memos/search',
  tags: ['memo'],
  summary: 'メモを検索',
  security: [{ CookieAuth: [] }],
  request: {
    query: SearchMemoQuerySchema,
  },
  responses: {
    200: {
      description: '検索結果',
      content: { 'application/json': { schema: MemoListResponseSchema } },
    },
    400: {
      description: 'クエリ不正',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const createSearchRouter = ({ searchMemos }: MemoUseCases) => {
  const searchRouter = Router();

  searchRouter.get('/', async (req, res) => {
    try {
      const { q, type, scope } = SearchMemoQuerySchema.parse(req.query);
      const memos = await searchMemos(requireUserId(req), q, type, scope);

      res.status(200).json({ items: memos });
    } catch (error) {
      return handleRouteError(res, error, 'Failed to search memos.');
    }
  });

  return searchRouter;
};
