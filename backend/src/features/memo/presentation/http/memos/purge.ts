import { Router } from 'express';
import {
  handleRouteError,
  parseParams,
  positiveIntField,
} from '../../../../../shared/http/requestValidation';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { MemoUseCases } from '../../../application/memoUseCases';

const parsePurgeParams = (value: unknown) =>
  parseParams(value, {
    id: positiveIntField(),
  });

export const createPurgeRouter = ({ purgeAllTrashMemos, purgeMemo }: MemoUseCases) => {
  const purgeRouter = Router();

  purgeRouter.delete('/', async (req, res) => {
    try {
      res.status(200).json({
        deletedCount: await purgeAllTrashMemos(requireUserId(req)),
      });
    } catch (error) {
      return handleRouteError(res, error, 'Failed to permanently delete trash.');
    }
  });

  purgeRouter.delete('/:id', async (req, res) => {
    try {
      const { id } = parsePurgeParams(req.params);
      const purgedMemo = await purgeMemo(requireUserId(req), id);

      res.status(200).json(purgedMemo);
    } catch (error) {
      return handleRouteError(res, error, 'Failed to permanently delete memo.', 'Memo not found.');
    }
  });

  return purgeRouter;
};
