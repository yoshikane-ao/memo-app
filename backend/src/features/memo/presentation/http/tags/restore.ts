import { Router } from 'express';
import { handleRouteError } from '../../../../../shared/http/requestValidation';
import { openApiRegistry } from '../../../../../shared/openapi/registry';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { TagUseCases } from '../../../application/tagUseCases';
import { RestoreTagBodySchema, TagSchema } from '../schemas';

openApiRegistry.registerPath({
  method: 'post',
  path: '/tags/restore',
  tags: ['tag'],
  summary: '削除されたタグを元の ID で復元し、関連 memo_tags を再作成',
  security: [{ CookieAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: RestoreTagBodySchema } } },
  },
  responses: {
    201: {
      description: '復元されたタグ',
      content: { 'application/json': { schema: TagSchema } },
    },
  },
});

export const createTagRestoreRouter = ({ restoreTag }: Pick<TagUseCases, 'restoreTag'>) => {
  const restoreRouter = Router();

  restoreRouter.post('/', async (req, res) => {
    try {
      const body = RestoreTagBodySchema.parse(req.body);
      const restoredTag = await restoreTag({
        userId: requireUserId(req),
        id: body.id,
        title: body.title,
        linkedMemoIds: body.linkedMemoIds,
      });

      res.status(201).json(restoredTag);
    } catch (error) {
      return handleRouteError(res, error, 'Failed to restore tag.');
    }
  });

  return restoreRouter;
};
