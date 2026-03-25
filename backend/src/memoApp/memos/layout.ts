import { Router } from "express";
import { prisma } from "../../db";
import {
  handleRouteError,
  optionalNonNegativeIntField,
  parseBody,
  positiveIntField,
} from "../shared/requestValidation";

const layoutRouter = Router();

const parseLayoutBody = (value: unknown) =>
  parseBody(value, {
    memoId: positiveIntField(),
    width: optionalNonNegativeIntField(),
    height: optionalNonNegativeIntField(),
  });

layoutRouter.put("/", async (req, res) => {
  try {
    const { memoId, width, height } = parseLayoutBody(req.body);

    await prisma.memos.update({
      where: { id: memoId },
      data: {
        width: width ?? null,
        height: height ?? null,
      },
    });

    res.status(200).json({ message: "Memo layout updated." });
  } catch (error) {
    return handleRouteError(res, error, "Failed to update memo layout.", "Memo not found.");
  }
});

export default layoutRouter;
