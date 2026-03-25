import { Router } from "express";
import { prisma } from "../../db";
import { handleRouteError, parseParams, positiveIntField } from "../shared/requestValidation";

const deleteRouter = Router();

const parseDeleteParams = (value: unknown) =>
  parseParams(value, {
    id: positiveIntField(),
  });

deleteRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = parseDeleteParams(req.params);

    const deletedMemo = await prisma.memos.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
      include: {
        memo_tags: {
          include: { tag: true },
        },
      },
    });

    res.status(200).json(deletedMemo);
  } catch (error) {
    return handleRouteError(res, error, "Failed to move memo to trash.", "Memo not found.");
  }
});

export default deleteRouter;
