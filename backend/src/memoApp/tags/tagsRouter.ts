import { Router } from "express";
import { prisma } from "../../db";
import {
  handleRouteError,
  optionalPositiveIntField,
  parseBody,
  parseParams,
  positiveIntField,
  stringField,
} from "../shared/requestValidation";
import restoreRouter from "./restore";

const tagsRouter = Router();

const parseLinkBody = (value: unknown) =>
  parseBody(value, {
    memoId: positiveIntField(),
    tagId: positiveIntField(),
  });

const parseCreateTagBody = (value: unknown) =>
  parseBody(value, {
    title: stringField(),
    memoId: optionalPositiveIntField({ emptyStringAsUndefined: true }),
  });

const parseUnlinkParams = (value: unknown) =>
  parseParams(value, {
    memoId: positiveIntField(),
    tagId: positiveIntField(),
  });

const parseSystemDeleteParams = (value: unknown) =>
  parseParams(value, {
    tagId: positiveIntField(),
  });

tagsRouter.use("/restore", restoreRouter);

tagsRouter.get("/list", async (_req, res) => {
  try {
    const tags = await prisma.tags.findMany({
      orderBy: { id: "asc" },
    });
    res.status(200).json({ items: tags });
  } catch (error) {
    return handleRouteError(res, error, "Failed to load tags.");
  }
});

tagsRouter.post("/link", async (req, res) => {
  try {
    const { memoId, tagId } = parseLinkBody(req.body);

    await prisma.memo_tags.createMany({
      data: [{ memo_id: memoId, tag_id: tagId }],
      skipDuplicates: true,
    });

    res.status(200).json({ message: "Tag linked." });
  } catch (error) {
    return handleRouteError(res, error, "Failed to link tag.");
  }
});

tagsRouter.post("/", async (req, res) => {
  try {
    const { title, memoId } = parseCreateTagBody(req.body);

    let tag = await prisma.tags.findUnique({ where: { title } });
    if (!tag) {
      tag = await prisma.tags.create({ data: { title } });
    }

    if (memoId != null) {
      await prisma.memo_tags.createMany({
        data: [{ memo_id: memoId, tag_id: tag.id }],
        skipDuplicates: true,
      });
    }

    res.status(201).json(tag);
  } catch (error) {
    return handleRouteError(res, error, "Failed to create tag.");
  }
});

tagsRouter.delete("/unlink/:memoId/:tagId", async (req, res) => {
  try {
    const { memoId, tagId } = parseUnlinkParams(req.params);

    await prisma.memo_tags.deleteMany({
      where: { memo_id: memoId, tag_id: tagId },
    });

    res.status(200).json({ message: "Tag unlinked." });
  } catch (error) {
    return handleRouteError(res, error, "Failed to unlink tag.");
  }
});

tagsRouter.delete("/system-delete/:tagId", async (req, res) => {
  try {
    const { tagId } = parseSystemDeleteParams(req.params);

    await prisma.memo_tags.deleteMany({ where: { tag_id: tagId } });
    await prisma.tags.delete({ where: { id: tagId } });

    res.status(200).json({ message: "Tag deleted." });
  } catch (error) {
    return handleRouteError(res, error, "Failed to delete tag.", "Tag not found.");
  }
});

export { tagsRouter };
