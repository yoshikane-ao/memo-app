import { Router } from 'express';
import {
  handleRouteError,
  optionalEnumField,
  parseQuery,
  stringField,
} from '../../../../../shared/http/requestValidation';
import { requireUserId } from '../../../../../shared/http/authContext';
import { memoSearchScopes, memoSearchTypes } from '../../../application/memoPorts';
import { type MemoUseCases } from '../../../application/memoUseCases';

const parseSearchQuery = (value: unknown) =>
  parseQuery(value, {
    q: stringField(),
    type: optionalEnumField(memoSearchTypes, { defaultValue: 'all' }),
    scope: optionalEnumField(memoSearchScopes, { defaultValue: 'active' }),
  });

export const createSearchRouter = ({ searchMemos }: MemoUseCases) => {
  const searchRouter = Router();

  searchRouter.get('/', async (req, res) => {
    try {
      const { q, type, scope } = parseSearchQuery(req.query);
      const memos = await searchMemos(requireUserId(req), q, type ?? 'all', scope ?? 'active');

      res.status(200).json({ items: memos });
    } catch (error) {
      return handleRouteError(res, error, 'Failed to search memos.');
    }
  });

  return searchRouter;
};
