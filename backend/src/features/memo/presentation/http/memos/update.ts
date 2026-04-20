import { Router } from 'express';
import {
  handleRouteError,
  optionalNonNegativeIntField,
  parseBody,
  positiveIntField,
  stringField,
} from '../../../../../shared/http/requestValidation';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { MemoUseCases } from '../../../application/memoUseCases';

const parseUpdateBody = (value: unknown) =>
  parseBody(value, {
    id: positiveIntField(),
    title: stringField(),
    content: stringField({ trim: false }),
    width: optionalNonNegativeIntField(),
    height: optionalNonNegativeIntField(),
  });

export const createUpdateRouter = ({ updateMemo }: MemoUseCases) => {
  const updateRouter = Router();

  updateRouter.put('/', async (req, res) => {
    try {
      const { id, title, content, width, height } = parseUpdateBody(req.body);
      const updatedMemo = await updateMemo({
        userId: requireUserId(req),
        id,
        title,
        content,
        width,
        height,
      });

      res.status(200).json(updatedMemo);
    } catch (error) {
      return handleRouteError(res, error, 'Failed to update memo.', 'Memo not found.');
    }
  });

  return updateRouter;
};
