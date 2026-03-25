import request from "supertest";

jest.mock("../../db", () => ({
  prisma: {
    memos: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from "../../db";
import { buildJsonTestApp } from "../../test/buildJsonTestApp";
import searchRouter from "./search";

const mockedPrisma = prisma as unknown as {
  memos: {
    findMany: jest.Mock;
  };
};

describe("searchRouter", () => {
  beforeEach(() => {
    mockedPrisma.memos.findMany.mockReset();
    mockedPrisma.memos.findMany.mockResolvedValue([]);
  });

  it("filters by tag title when type=tag", async () => {
    const response = await request(buildJsonTestApp(searchRouter))
      .get("/")
      .query({ q: "work", type: "tag" });

    expect(response.status).toBe(200);
    expect(mockedPrisma.memos.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { deletedAt: null },
          {
            memo_tags: {
              some: {
                tag: {
                  title: { contains: "work" },
                },
              },
            },
          },
        ],
      },
      orderBy: { id: "asc" },
      include: {
        memo_tags: {
          include: { tag: true },
        },
      },
    });
  });

  it("returns 400 when q is missing", async () => {
    const response = await request(buildJsonTestApp(searchRouter)).get("/").query({ type: "all" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "q must be a string." });
    expect(mockedPrisma.memos.findMany).not.toHaveBeenCalled();
  });

  it("returns 400 when type is invalid", async () => {
    const response = await request(buildJsonTestApp(searchRouter))
      .get("/")
      .query({ q: "memo", type: "broken" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "type must be one of: all, title, content, tag." });
    expect(mockedPrisma.memos.findMany).not.toHaveBeenCalled();
  });

  it("searches trashed memos when scope=trash", async () => {
    const response = await request(buildJsonTestApp(searchRouter))
      .get("/")
      .query({ q: "memo", scope: "trash" });

    expect(response.status).toBe(200);
    expect(mockedPrisma.memos.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { deletedAt: { not: null } },
          {
            OR: [
              { title: { contains: "memo" } },
              { content: { contains: "memo" } },
              { memo_tags: { some: { tag: { title: { contains: "memo" } } } } },
            ],
          },
        ],
      },
      orderBy: { id: "asc" },
      include: {
        memo_tags: {
          include: { tag: true },
        },
      },
    });
  });
});
