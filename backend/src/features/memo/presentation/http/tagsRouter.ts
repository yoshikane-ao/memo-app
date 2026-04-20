import { Router } from 'express';
import {
  handleRouteError,
  optionalPositiveIntField,
  parseBody,
  parseParams,
  positiveIntField,
  stringField,
} from '../../../../shared/http/requestValidation';
import { requireUserId } from '../../../../shared/http/authContext';
import type { TagUseCases } from '../../application/tagUseCases';
import { createTagRestoreRouter } from './tags/restore';

const parseLinkBody = (value: unknown) =>
  parseBody(value, {
    memoId: positiveIntField(),
    tagId: positiveIntField(),
  });

const parseCreateTagBody = (value: unknown) =>
  parseBody(value, {
    title: stringField(),
    memoId: optionalPositiveIntField({ emptyStringAsUndefined: true }),
  });

const parseUnlinkParams = (value: unknown) =>
  parseParams(value, {
    memoId: positiveIntField(),
    tagId: positiveIntField(),
  });

const parseSystemDeleteParams = (value: unknown) =>
  parseParams(value, {
    tagId: positiveIntField(),
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
      const { memoId, tagId } = parseLinkBody(req.body);
      await linkTagToMemo(requireUserId(req), memoId, tagId);

      res.status(200).json({ message: 'Tag linked.' });
    } catch (error) {
      return handleRouteError(res, error, 'Failed to link tag.');
    }
  });

  tagsRouter.post('/', async (req, res) => {
    try {
      const { title, memoId } = parseCreateTagBody(req.body);
      const tag = await createTag(requireUserId(req), title, memoId);

      res.status(201).json(tag);
    } catch (error) {
      return handleRouteError(res, error, 'Failed to create tag.');
    }
  });

  tagsRouter.delete('/unlink/:memoId/:tagId', async (req, res) => {
    try {
      const { memoId, tagId } = parseUnlinkParams(req.params);
      await unlinkTagFromMemo(requireUserId(req), memoId, tagId);

      res.status(200).json({ message: 'Tag unlinked.' });
    } catch (error) {
      return handleRouteError(res, error, 'Failed to unlink tag.');
    }
  });

  tagsRouter.delete('/system-delete/:tagId', async (req, res) => {
    try {
      const { tagId } = parseSystemDeleteParams(req.params);
      await deleteSystemTag(requireUserId(req), tagId);

      res.status(200).json({ message: 'Tag deleted.' });
    } catch (error) {
      return handleRouteError(res, error, 'Failed to delete tag.', 'Tag not found.');
    }
  });

  return tagsRouter;
};
