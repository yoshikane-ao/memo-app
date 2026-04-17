import { Router } from "express";
import { handleRouteError, parseParams, positiveIntField } from "../../../../../shared/http/requestValidation";
import type { MemoUseCases } from "../../../application/memoUseCases";

const parseDeleteParams = (value: unknown) =>
  parseParams(value, {
    id: positiveIntField(),
  });

export const createDeleteRouter = ({ moveMemoToTrash }: MemoUseCases) => {
  const deleteRouter = Router();

  deleteRouter.delete("/:id", async (req, res) => {
    try {
      const { id } = parseDeleteParams(req.params);
      const deletedMemo = await moveMemoToTrash(id);

      res.status(200).json(deletedMemo);
    } catch (error) {
      return handleRouteError(res, error, "Failed to move memo to trash.", "Memo not found.");
    }
  });

  return deleteRouter;
};
