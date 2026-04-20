import { Router } from 'express';
import { handleRouteError } from '../../../../../shared/http/requestValidation';
import { openApiRegistry } from '../../../../../shared/openapi/registry';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { MemoUseCases } from '../../../application/memoUseCases';
import { ErrorResponseSchema, MemoIdParamsSchema, MemoWithTagsSchema } from '../schemas';

openApiRegistry.registerPath({
  method: 'post',
  path: '/memos/restore/{id}',
  tags: ['memo'],
  summary: 'ごみ箱からメモを復元',
  security: [{ CookieAuth: [] }],
  request: {
    params: MemoIdParamsSchema,
  },
  responses: {
    201: {
      description: '復元されたメモ',
      content: { 'application/json': { schema: MemoWithTagsSchema } },
    },
    404: {
      description: 'メモが存在しない',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const createRestoreRouter = ({ restoreMemo }: MemoUseCases) => {
  const restoreRouter = Router();

  restoreRouter.post('/:id', async (req, res) => {
    try {
      const { id } = MemoIdParamsSchema.parse(req.params);
      const restoredMemo = await restoreMemo(requireUserId(req), id);

      res.status(201).json(restoredMemo);
    } catch (error) {
      return handleRouteError(res, error, 'Failed to restore memo.', 'Memo not found.');
    }
  });

  return restoreRouter;
};
