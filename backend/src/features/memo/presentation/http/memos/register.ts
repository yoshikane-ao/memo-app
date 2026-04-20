import { Router } from 'express';
import {
  handleRouteError,
  optionalStringArrayField,
  parseBody,
  stringField,
} from '../../../../../shared/http/requestValidation';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { MemoUseCases } from '../../../application/memoUseCases';

const parseRegisterBody = (value: unknown) =>
  parseBody(value, {
    title: stringField(),
    content: stringField({ trim: false }),
    tags: optionalStringArrayField(),
  });

export const createRegisterRouter = ({ createMemo }: MemoUseCases) => {
  const registerRouter = Router();

  registerRouter.post('/', async (req, res) => {
    try {
      const { title, content, tags } = parseRegisterBody(req.body);
      const newMemo = await createMemo({ userId: requireUserId(req), title, content, tags });

      res.status(201).json(newMemo);
    } catch (error) {
      return handleRouteError(res, error, 'Failed to create memo.');
    }
  });

  return registerRouter;
};
