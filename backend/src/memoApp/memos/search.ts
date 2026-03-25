import { Router } from "express";
import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../db";
import {
  handleRouteError,
  optionalEnumField,
  parseQuery,
  stringField,
} from "../shared/requestValidation";

const searchRouter = Router();

const searchTypes = ["all", "title", "content", "tag"] as const;
const searchScopes = ["active", "trash", "all"] as const;

type SearchType = (typeof searchTypes)[number];
type SearchScope = (typeof searchScopes)[number];

const parseSearchQuery = (value: unknown) =>
  parseQuery(value, {
    q: stringField(),
    type: optionalEnumField(searchTypes, { defaultValue: "all" }),
    scope: optionalEnumField(searchScopes, { defaultValue: "active" }),
  });

const buildSearchWhere = (q: string, type: SearchType): Prisma.MemosWhereInput => {
  const searchCondition = { contains: q };

  switch (type) {
    case "title":
      return { title: searchCondition };
    case "content":
      return { content: searchCondition };
    case "tag":
      return {
        memo_tags: {
          some: {
            tag: {
              title: searchCondition,
            },
          },
        },
      };
    default:
      return {
        OR: [
          { title: searchCondition },
          { content: searchCondition },
          { memo_tags: { some: { tag: { title: searchCondition } } } },
        ],
      };
  }
};

const buildScopeWhere = (scope: SearchScope): Prisma.MemosWhereInput => {
  switch (scope) {
    case "trash":
      return { deletedAt: { not: null } };
    case "all":
      return {};
    default:
      return { deletedAt: null };
  }
};

searchRouter.get("/", async (req, res) => {
  try {
    const { q, type, scope } = parseSearchQuery(req.query);

    const memos = await prisma.memos.findMany({
      where: {
        AND: [buildScopeWhere(scope ?? "active"), buildSearchWhere(q, type ?? "all")],
      },
      orderBy: { id: "asc" },
      include: {
        memo_tags: {
          include: { tag: true },
        },
      },
    });

    res.status(200).json({ items: memos });
  } catch (error) {
    return handleRouteError(res, error, "Failed to search memos.");
  }
});

export default searchRouter;
