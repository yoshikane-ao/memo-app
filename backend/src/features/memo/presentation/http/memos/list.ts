import { Router } from 'express';
import {
  handleRouteError,
  optionalEnumField,
  parseQuery,
} from '../../../../../shared/http/requestValidation';
import { requireUserId } from '../../../../../shared/http/authContext';
import { memoScopes } from '../../../application/memoPorts';
import type { MemoUseCases } from '../../../application/memoUseCases';

const parseListQuery = (value: unknown) =>
  parseQuery(value, {
    scope: optionalEnumField(memoScopes, { defaultValue: 'active' }),
  });

export const createListRouter = ({ listMemos }: MemoUseCases) => {
  const listRouter = Router();

  listRouter.get('/', async (req, res) => {
    try {
      const { scope } = parseListQuery(req.query);
      const memos = await listMemos(requireUserId(req), scope ?? 'active');

      res.status(200).json({ items: memos });
    } catch (error) {
      return handleRouteError(res, error, 'Failed to load memos.');
    }
  });

  return listRouter;
};
