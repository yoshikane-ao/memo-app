import { Router } from "express";
import { prisma } from "../../db";
import {
  handleRouteError,
  parseParams,
  positiveIntField,
  RequestValidationError,
} from "../shared/requestValidation";

const purgeRouter = Router();

const parsePurgeParams = (value: unknown) =>
  parseParams(value, {
    id: positiveIntField(),
  });

purgeRouter.delete("/", async (_req, res) => {
  try {
    const result = await prisma.memos.deleteMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
    });

    res.status(200).json({
      deletedCount: result.count,
    });
  } catch (error) {
    return handleRouteError(res, error, "Failed to permanently delete trash.");
  }
});

purgeRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = parsePurgeParams(req.params);

    const existingMemo = await prisma.memos.findUnique({
      where: { id },
    });

    if (!existingMemo) {
      throw { code: "P2025" };
    }

    if (existingMemo.deletedAt == null) {
      throw new RequestValidationError("Only trashed memos can be permanently deleted.");
    }

    const purgedMemo = await prisma.memos.delete({
      where: { id },
      include: {
        memo_tags: {
          include: { tag: true },
        },
      },
    });

    res.status(200).json(purgedMemo);
  } catch (error) {
    return handleRouteError(res, error, "Failed to permanently delete memo.", "Memo not found.");
  }
});

export default purgeRouter;
