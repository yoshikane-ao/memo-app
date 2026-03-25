import { Router } from "express";
import { prisma } from "../../db";
import {
  handleRouteError,
  optionalStringArrayField,
  parseBody,
  stringField,
} from "../shared/requestValidation";

const registerRouter = Router();

const parseRegisterBody = (value: unknown) =>
  parseBody(value, {
    title: stringField(),
    content: stringField({ trim: false }),
    tags: optionalStringArrayField(),
  });

registerRouter.post("/", async (req, res) => {
  try {
    const { title, content, tags } = parseRegisterBody(req.body);

    const newMemo = await prisma.memos.create({
      data: {
        title,
        content,
        memo_tags:
          tags && tags.length > 0
            ? {
                create: tags.map((tagName) => ({
                  tag: {
                    connectOrCreate: {
                      where: { title: tagName },
                      create: { title: tagName },
                    },
                  },
                })),
              }
            : undefined,
      },
      include: {
        memo_tags: {
          include: { tag: true },
        },
      },
    });

    res.status(201).json(newMemo);
  } catch (error) {
    return handleRouteError(res, error, "Failed to create memo.");
  }
});

export default registerRouter;
