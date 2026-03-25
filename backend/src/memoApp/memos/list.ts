import { Router } from "express";
import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../db";
import { handleRouteError, optionalEnumField, parseQuery } from "../shared/requestValidation";

const listRouter = Router();
const memoListScopes = ["active", "trash", "all"] as const;
type MemoListScope = (typeof memoListScopes)[number];

const parseListQuery = (value: unknown) =>
  parseQuery(value, {
    scope: optionalEnumField(memoListScopes, { defaultValue: "active" }),
  });

const buildMemoListWhere = (scope: MemoListScope): Prisma.MemosWhereInput => {
  switch (scope) {
    case "trash":
      return { deletedAt: { not: null } };
    case "all":
      return {};
    default:
      return { deletedAt: null };
  }
};

const getMemoListOrderBy = (scope: MemoListScope): Prisma.MemosOrderByWithRelationInput[] => {
  if (scope === "trash") {
    return [{ deletedAt: "desc" }, { id: "desc" }];
  }

  return [{ orderIndex: "asc" }, { id: "desc" }];
};

listRouter.get("/", async (req, res) => {
  try {
    const { scope } = parseListQuery(req.query);
    const memos = await prisma.memos.findMany({
      where: buildMemoListWhere(scope ?? "active"),
      orderBy: getMemoListOrderBy(scope ?? "active"),
      include: {
        memo_tags: {
          include: { tag: true },
        },
      },
    });

    res.status(200).json({ items: memos });
  } catch (error) {
    return handleRouteError(res, error, "Failed to load memos.");
  }
});

export default listRouter;
