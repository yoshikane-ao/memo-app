import { Router } from 'express';
import { handleRouteError } from '../../../../../shared/http/requestValidation';
import { openApiRegistry } from '../../../../../shared/openapi/registry';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { MemoUseCases } from '../../../application/memoUseCases';
import { ErrorResponseSchema, MemoIdParamsSchema, MemoWithTagsSchema } from '../schemas';

openApiRegistry.registerPath({
  method: 'delete',
  path: '/memos/delete/{id}',
  tags: ['memo'],
  summary: 'メモをごみ箱に移動',
  security: [{ CookieAuth: [] }],
  request: {
    params: MemoIdParamsSchema,
  },
  responses: {
    200: {
      description: 'ごみ箱に移動した結果のメモ',
      content: { 'application/json': { schema: MemoWithTagsSchema } },
    },
    404: {
      description: 'メモが存在しない',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const createDeleteRouter = ({ moveMemoToTrash }: MemoUseCases) => {
  const deleteRouter = Router();

  deleteRouter.delete('/:id', async (req, res) => {
    try {
      const { id } = MemoIdParamsSchema.parse(req.params);
      const deletedMemo = await moveMemoToTrash(requireUserId(req), id);

      res.status(200).json(deletedMemo);
    } catch (error) {
      return handleRouteError(res, error, 'Failed to move memo to trash.', 'Memo not found.');
    }
  });

  return deleteRouter;
};
