import { Router } from 'express';
import {
  arrayField,
  handleRouteError,
  nonNegativeIntField,
  objectField,
  parseBody,
  positiveIntField,
} from '../../../../../shared/http/requestValidation';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { MemoUseCases } from '../../../application/memoUseCases';

const parseSortBody = (value: unknown) =>
  parseBody(value, {
    items: arrayField(
      objectField({
        id: positiveIntField(),
        orderIndex: nonNegativeIntField(),
      }),
    ),
  });

export const createSortRouter = ({ reorderMemos }: MemoUseCases) => {
  const sortRouter = Router();

  sortRouter.put('/', async (req, res) => {
    try {
      const { items } = parseSortBody(req.body);
      await reorderMemos(requireUserId(req), items);

      res.status(200).json({ message: 'Memo order updated.' });
    } catch (error) {
      return handleRouteError(res, error, 'Failed to update memo order.', 'Memo not found.');
    }
  });

  return sortRouter;
};
