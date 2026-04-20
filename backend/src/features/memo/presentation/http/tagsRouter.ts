import { Router } from 'express';
import { handleRouteError } from '../../../../shared/http/requestValidation';
import { openApiRegistry } from '../../../../shared/openapi/registry';
import { requireUserId } from '../../../../shared/http/authContext';
import type { TagUseCases } from '../../application/tagUseCases';
import {
  CreateTagBodySchema,
  ErrorResponseSchema,
  LinkTagBodySchema,
  OkMessageSchema,
  SystemDeleteTagParamsSchema,
  TagListResponseSchema,
  TagSchema,
  UnlinkTagParamsSchema,
} from './schemas';
import { createTagRestoreRouter } from './tags/restore';

openApiRegistry.registerPath({
  method: 'get',
  path: '/tags/list',
  tags: ['tag'],
  summary: 'タグ一覧の取得',
  security: [{ CookieAuth: [] }],
  responses: {
    200: {
      description: 'タグ一覧',
      content: { 'application/json': { schema: TagListResponseSchema } },
    },
  },
});

openApiRegistry.registerPath({
  method: 'post',
  path: '/tags/link',
  tags: ['tag'],
  summary: 'タグをメモに紐付け',
  security: [{ CookieAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: LinkTagBodySchema } } },
  },
  responses: {
    200: {
      description: '紐付け成功',
      content: { 'application/json': { schema: OkMessageSchema } },
    },
  },
});

openApiRegistry.registerPath({
  method: 'post',
  path: '/tags',
  tags: ['tag'],
  summary: 'タグ新規作成',
  security: [{ CookieAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: CreateTagBodySchema } } },
  },
  responses: {
    201: {
      description: '作成成功',
      content: { 'application/json': { schema: TagSchema } },
    },
  },
});

openApiRegistry.registerPath({
  method: 'delete',
  path: '/tags/unlink/{memoId}/{tagId}',
  tags: ['tag'],
  summary: 'タグとメモの紐付けを解除',
  security: [{ CookieAuth: [] }],
  request: {
    params: UnlinkTagParamsSchema,
  },
  responses: {
    200: {
      description: '解除成功',
      content: { 'application/json': { schema: OkMessageSchema } },
    },
  },
});

openApiRegistry.registerPath({
  method: 'delete',
  path: '/tags/system-delete/{tagId}',
  tags: ['tag'],
  summary: 'タグを完全削除（関連 memo_tags もまとめて削除）',
  security: [{ CookieAuth: [] }],
  request: {
    params: SystemDeleteTagParamsSchema,
  },
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

export const createTagsRouter = ({
  createTag,
  deleteSystemTag,
  linkTagToMemo,
  listTags,
  restoreTag,
  unlinkTagFromMemo,
}: TagUseCases) => {
  const tagsRouter = Router();

  tagsRouter.use('/restore', createTagRestoreRouter({ restoreTag }));

  tagsRouter.get('/list', async (req, res) => {
    try {
      const tags = await listTags(requireUserId(req));
      res.status(200).json({ items: tags });
    } catch (error) {
      return handleRouteError(res, error, 'Failed to load tags.');
    }
  });

  tagsRouter.post('/link', async (req, res) => {
    try {
      const { memoId, tagId } = LinkTagBodySchema.parse(req.body);
      await linkTagToMemo(requireUserId(req), memoId, tagId);

      res.status(200).json({ message: 'Tag linked.' });
    } catch (error) {
      return handleRouteError(res, error, 'Failed to link tag.');
    }
  });

  tagsRouter.post('/', async (req, res) => {
    try {
      const { title, memoId } = CreateTagBodySchema.parse(req.body);
      const tag = await createTag(requireUserId(req), title, memoId);

      res.status(201).json(tag);
    } catch (error) {
      return handleRouteError(res, error, 'Failed to create tag.');
    }
  });

  tagsRouter.delete('/unlink/:memoId/:tagId', async (req, res) => {
    try {
      const { memoId, tagId } = UnlinkTagParamsSchema.parse(req.params);
      await unlinkTagFromMemo(requireUserId(req), memoId, tagId);

      res.status(200).json({ message: 'Tag unlinked.' });
    } catch (error) {
      return handleRouteError(res, error, 'Failed to unlink tag.');
    }
  });

  tagsRouter.delete('/system-delete/:tagId', async (req, res) => {
    try {
      const { tagId } = SystemDeleteTagParamsSchema.parse(req.params);
      await deleteSystemTag(requireUserId(req), tagId);

      res.status(200).json({ message: 'Tag deleted.' });
    } catch (error) {
      return handleRouteError(res, error, 'Failed to delete tag.', 'Tag not found.');
    }
  });

  return tagsRouter;
};
