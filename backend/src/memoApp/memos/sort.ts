import { Router } from "express";
import { prisma } from "../../db";
import {
  arrayField,
  handleRouteError,
  nonNegativeIntField,
  objectField,
  parseBody,
  positiveIntField,
} from "../shared/requestValidation";

const sortRouter = Router();

const parseSortBody = (value: unknown) =>
  parseBody(value, {
    items: arrayField(
      objectField({
        id: positiveIntField(),
        orderIndex: nonNegativeIntField(),
      })
    ),
  });

sortRouter.put("/", async (req, res) => {
  try {
    const { items } = parseSortBody(req.body);

    await prisma.$transaction(
      items.map((item) =>
        prisma.memos.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        })
      )
    );

    res.status(200).json({ message: "Memo order updated." });
  } catch (error) {
    return handleRouteError(res, error, "Failed to update memo order.", "Memo not found.");
  }
});

export default sortRouter;
