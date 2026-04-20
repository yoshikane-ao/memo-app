import { Router } from 'express';
import { handleRouteError } from '../../../../../shared/http/requestValidation';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { QuizUseCases } from '../../../application/quizUseCases';
import { parseTagNameParams } from './requestParsing';

export const createTagsRouter = ({ deleteQuizTag, listQuizTags }: QuizUseCases) => {
  const tagsRouter = Router();

  tagsRouter.get('/', async (req, res) => {
    try {
      const tags = await listQuizTags(requireUserId(req));
      res.status(200).json(tags);
    } catch (error) {
      return handleRouteError(res, error, 'Failed to load tags.');
    }
  });

  tagsRouter.delete('/:tagName', async (req, res) => {
    try {
      const { tagName } = parseTagNameParams(req.params);
      await deleteQuizTag(requireUserId(req), tagName);
      res.status(200).json({ message: 'Tag deleted.' });
    } catch (error) {
      return handleRouteError(res, error, 'Failed to delete tag.', 'Tag not found.');
    }
  });

  return tagsRouter;
};
