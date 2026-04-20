import { Router } from 'express';
import { handleRouteError } from '../../../../../shared/http/requestValidation';
import { openApiRegistry, z } from '../../../../../shared/openapi/registry';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { MemoUseCases } from '../../../application/memoUseCases';
import { ErrorResponseSchema, MemoIdParamsSchema, MemoWithTagsSchema } from '../schemas';

const PurgeAllResponseSchema = z
  .object({ deletedCount: z.number().int().nonnegative() })
  .openapi('PurgeAllResponse');

openApiRegistry.register('PurgeAllResponse', PurgeAllResponseSchema);

openApiRegistry.registerPath({
  method: 'delete',
  path: '/memos/purge',
  tags: ['memo'],
  summary: 'ごみ箱の一括完全削除',
  security: [{ CookieAuth: [] }],
  responses: {
    200: {
      description: '削除件数',
      content: { 'application/json': { schema: PurgeAllResponseSchema } },
    },
  },
});

openApiRegistry.registerPath({
  method: 'delete',
  path: '/memos/purge/{id}',
  tags: ['memo'],
  summary: 'メモを完全削除',
  security: [{ CookieAuth: [] }],
  request: {
    params: MemoIdParamsSchema,
  },
  responses: {
    200: {
      description: '完全削除されたメモ',
      content: { 'application/json': { schema: MemoWithTagsSchema } },
    },
    404: {
      description: 'メモが存在しない',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const createPurgeRouter = ({ purgeAllTrashMemos, purgeMemo }: MemoUseCases) => {
  const purgeRouter = Router();

  purgeRouter.delete('/', async (req, res) => {
    try {
      res.status(200).json({
        deletedCount: await purgeAllTrashMemos(requireUserId(req)),
      });
    } catch (error) {
      return handleRouteError(res, error, 'Failed to permanently delete trash.');
    }
  });

  purgeRouter.delete('/:id', async (req, res) => {
    try {
      const { id } = MemoIdParamsSchema.parse(req.params);
      const purgedMemo = await purgeMemo(requireUserId(req), id);

      res.status(200).json(purgedMemo);
    } catch (error) {
      return handleRouteError(res, error, 'Failed to permanently delete memo.', 'Memo not found.');
    }
  });

  return purgeRouter;
};
