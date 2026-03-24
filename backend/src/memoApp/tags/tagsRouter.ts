import { Router } from "express";
import { prisma } from "../../db";
import registerRouter from "./register";
import deleteRouter from "./delete";
import restoreRouter from "./restore";

const tagsRouter = Router();

tagsRouter.use("/register", registerRouter);
tagsRouter.use("/delete", deleteRouter);
tagsRouter.use("/restore", restoreRouter);

tagsRouter.get("/list", async (_req, res) => {
  try {
    const tags = await prisma.tags.findMany({
      orderBy: { id: "asc" },
    });
    res.status(200).json({ items: tags });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load tags." });
  }
});

tagsRouter.post("/link", async (req, res) => {
  try {
    const { memoId, tagId } = req.body;
    if (!memoId || !tagId) {
      return res.status(400).json({ message: "memoId and tagId are required." });
    }

    await prisma.memo_tags.create({
      data: { memo_id: Number(memoId), tag_id: Number(tagId) },
    });

    res.status(200).json({ message: "Tag linked." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to link tag." });
  }
});

tagsRouter.post("/", async (req, res) => {
  try {
    const { memoId, title } = req.body;
    if (!title) {
      return res.status(400).json({ message: "title is required." });
    }

    let tag = await prisma.tags.findUnique({ where: { title } });
    if (!tag) {
      tag = await prisma.tags.create({ data: { title } });
    }

    if (memoId) {
      const existingLink = await prisma.memo_tags.findFirst({
        where: { memo_id: Number(memoId), tag_id: tag.id },
      });

      if (!existingLink) {
        await prisma.memo_tags.create({
          data: { memo_id: Number(memoId), tag_id: tag.id },
        });
      }
    }

    res.status(201).json(tag);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create tag." });
  }
});

tagsRouter.delete("/unlink/:memoId/:tagId", async (req, res) => {
  try {
    const { memoId, tagId } = req.params;
    await prisma.memo_tags.deleteMany({
      where: { memo_id: Number(memoId), tag_id: Number(tagId) },
    });
    res.status(200).json({ message: "Tag unlinked." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to unlink tag." });
  }
});

tagsRouter.delete("/system-delete/:tagId", async (req, res) => {
  try {
    const tagId = Number(req.params.tagId);
    await prisma.memo_tags.deleteMany({ where: { tag_id: tagId } });
    await prisma.tags.delete({ where: { id: tagId } });
    res.status(200).json({ message: "Tag deleted." });
  } catch (error) {
    console.error("Tag delete failed:", error);
    if ((error as { code?: string }).code === "P2025") {
      return res.status(404).json({ message: "Tag not found." });
    }
    res.status(500).json({ message: "Failed to delete tag." });
  }
});

export { tagsRouter };
