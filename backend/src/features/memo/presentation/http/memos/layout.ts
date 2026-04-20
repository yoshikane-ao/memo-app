import { Router } from 'express';
import { handleRouteError } from '../../../../../shared/http/requestValidation';
import { openApiRegistry } from '../../../../../shared/openapi/registry';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { MemoUseCases } from '../../../application/memoUseCases';
import { ErrorResponseSchema, LayoutMemoBodySchema, OkMessageSchema } from '../schemas';

openApiRegistry.registerPath({
  method: 'put',
  path: '/memos/layout',
  tags: ['memo'],
  summary: 'メモのレイアウト (width / height) を更新',
  security: [{ CookieAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: LayoutMemoBodySchema } } },
  },
  responses: {
    200: {
      description: 'レイアウト更新',
      content: { 'application/json': { schema: OkMessageSchema } },
    },
    404: {
      description: '参照先のメモが存在しない',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const createLayoutRouter = ({ updateMemoLayout }: MemoUseCases) => {
  const layoutRouter = Router();

  layoutRouter.put('/', async (req, res) => {
    try {
      const { memoId, width, height } = LayoutMemoBodySchema.parse(req.body);
      await updateMemoLayout({ userId: requireUserId(req), memoId, width, height });

      res.status(200).json({ message: 'Memo layout updated.' });
    } catch (error) {
      return handleRouteError(res, error, 'Failed to update memo layout.', 'Memo not found.');
    }
  });

  return layoutRouter;
};
