import { Router } from "express";
import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../db";
import {
  handleRouteError,
  optionalNonNegativeIntField,
  parseBody,
  positiveIntField,
  stringField,
} from "../shared/requestValidation";

const updateRouter = Router();

const parseUpdateBody = (value: unknown) =>
  parseBody(value, {
    id: positiveIntField(),
    title: stringField(),
    content: stringField({ trim: false }),
    width: optionalNonNegativeIntField(),
    height: optionalNonNegativeIntField(),
  });

updateRouter.put("/", async (req, res) => {
  try {
    const { id, title, content, width, height } = parseUpdateBody(req.body);

    const updateData: Prisma.MemosUpdateInput = { title, content };

    if (width !== undefined) {
      updateData.width = width;
    }

    if (height !== undefined) {
      updateData.height = height;
    }

    const updatedMemo = await prisma.memos.update({
      where: { id },
      data: updateData,
    });

    await prisma.memoHistories.create({
      data: { title, content, memoId: id },
    });

    res.status(200).json(updatedMemo);
  } catch (error) {
    return handleRouteError(res, error, "Failed to update memo.", "Memo not found.");
  }
});

export default updateRouter;
