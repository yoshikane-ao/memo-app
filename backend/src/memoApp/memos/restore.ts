import { Router } from "express";
import { prisma } from "../../db";
import {
  handleRouteError,
  positiveIntField,
  parseParams,
} from "../shared/requestValidation";

const parseRestoreParams = (value: unknown) =>
  parseParams(value, {
    id: positiveIntField(),
  });

const restoreRouter = Router();

restoreRouter.post("/:id", async (req, res) => {
  try {
    const { id } = parseRestoreParams(req.params);

    const restoredMemo = await prisma.memos.update({
      where: { id },
      data: {
        deletedAt: null,
      },
      include: {
        memo_tags: {
          include: { tag: true },
        },
      },
    });

    res.status(201).json(restoredMemo);
  } catch (error) {
    return handleRouteError(res, error, "Failed to restore memo.", "Memo not found.");
  }
});

export default restoreRouter;
