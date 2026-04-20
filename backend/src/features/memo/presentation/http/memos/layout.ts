import { Router } from 'express';
import {
  handleRouteError,
  optionalNonNegativeIntField,
  parseBody,
  positiveIntField,
} from '../../../../../shared/http/requestValidation';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { MemoUseCases } from '../../../application/memoUseCases';

const parseLayoutBody = (value: unknown) =>
  parseBody(value, {
    memoId: positiveIntField(),
    width: optionalNonNegativeIntField(),
    height: optionalNonNegativeIntField(),
  });

export const createLayoutRouter = ({ updateMemoLayout }: MemoUseCases) => {
  const layoutRouter = Router();

  layoutRouter.put('/', async (req, res) => {
    try {
      const { memoId, width, height } = parseLayoutBody(req.body);
      await updateMemoLayout({ userId: requireUserId(req), memoId, width, height });

      res.status(200).json({ message: 'Memo layout updated.' });
    } catch (error) {
      return handleRouteError(res, error, 'Failed to update memo layout.', 'Memo not found.');
    }
  });

  return layoutRouter;
};
