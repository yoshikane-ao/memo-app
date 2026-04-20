import { Router } from 'express';
import { handleRouteError } from '../../../../../shared/http/requestValidation';
import { openApiRegistry } from '../../../../../shared/openapi/registry';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { MemoUseCases } from '../../../application/memoUseCases';
import { ErrorResponseSchema, MemoSchema, UpdateMemoBodySchema } from '../schemas';

openApiRegistry.registerPath({
  method: 'put',
  path: '/memos/update',
  tags: ['memo'],
  summary: 'メモの更新',
  security: [{ CookieAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: UpdateMemoBodySchema } } },
  },
  responses: {
    200: {
      description: '更新成功',
      content: { 'application/json': { schema: MemoSchema } },
    },
    404: {
      description: 'メモが存在しない',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const createUpdateRouter = ({ updateMemo }: MemoUseCases) => {
  const updateRouter = Router();

  updateRouter.put('/', async (req, res) => {
    try {
      const { id, title, content, width, height } = UpdateMemoBodySchema.parse(req.body);
      const updatedMemo = await updateMemo({
        userId: requireUserId(req),
        id,
        title,
        content,
        width,
        height,
      });

      res.status(200).json(updatedMemo);
    } catch (error) {
      return handleRouteError(res, error, 'Failed to update memo.', 'Memo not found.');
    }
  });

  return updateRouter;
};
