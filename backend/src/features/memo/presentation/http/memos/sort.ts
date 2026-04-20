import { Router } from 'express';
import { handleRouteError } from '../../../../../shared/http/requestValidation';
import { openApiRegistry } from '../../../../../shared/openapi/registry';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { MemoUseCases } from '../../../application/memoUseCases';
import { ErrorResponseSchema, OkMessageSchema, SortMemoBodySchema } from '../schemas';

openApiRegistry.registerPath({
  method: 'put',
  path: '/memos/sort',
  tags: ['memo'],
  summary: 'メモ並び順を更新',
  security: [{ CookieAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: SortMemoBodySchema } } },
  },
  responses: {
    200: {
      description: '並び順更新',
      content: { 'application/json': { schema: OkMessageSchema } },
    },
    404: {
      description: '参照先のメモが存在しない',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const createSortRouter = ({ reorderMemos }: MemoUseCases) => {
  const sortRouter = Router();

  sortRouter.put('/', async (req, res) => {
    try {
      const { items } = SortMemoBodySchema.parse(req.body);
      await reorderMemos(requireUserId(req), items);

      res.status(200).json({ message: 'Memo order updated.' });
    } catch (error) {
      return handleRouteError(res, error, 'Failed to update memo order.', 'Memo not found.');
    }
  });

  return sortRouter;
};
