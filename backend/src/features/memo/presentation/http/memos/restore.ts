import { Router } from "express";
import {
  handleRouteError,
  parseParams,
  positiveIntField,
} from "../../../../../shared/http/requestValidation";
import type { MemoUseCases } from "../../../application/memoUseCases";

const parseRestoreParams = (value: unknown) =>
  parseParams(value, {
    id: positiveIntField(),
  });

export const createRestoreRouter = ({ restoreMemo }: MemoUseCases) => {
  const restoreRouter = Router();

  restoreRouter.post("/:id", async (req, res) => {
    try {
      const { id } = parseRestoreParams(req.params);
      const restoredMemo = await restoreMemo(id);

      res.status(201).json(restoredMemo);
    } catch (error) {
      return handleRouteError(res, error, "Failed to restore memo.", "Memo not found.");
    }
  });

  return restoreRouter;
};
