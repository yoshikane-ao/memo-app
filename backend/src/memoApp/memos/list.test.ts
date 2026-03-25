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
import listRouter from "./list";

const mockedPrisma = prisma as unknown as {
  memos: {
    findMany: jest.Mock;
  };
};

describe("listRouter", () => {
  beforeEach(() => {
    mockedPrisma.memos.findMany.mockReset();
    mockedPrisma.memos.findMany.mockResolvedValue([]);
  });

  it("loads active memos by default", async () => {
    const response = await request(buildJsonTestApp(listRouter)).get("/");

    expect(response.status).toBe(200);
    expect(mockedPrisma.memos.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      orderBy: [{ orderIndex: "asc" }, { id: "desc" }],
      include: {
        memo_tags: {
          include: { tag: true },
        },
      },
    });
  });

  it("loads trashed memos when scope=trash", async () => {
    const response = await request(buildJsonTestApp(listRouter)).get("/").query({ scope: "trash" });

    expect(response.status).toBe(200);
    expect(mockedPrisma.memos.findMany).toHaveBeenCalledWith({
      where: { deletedAt: { not: null } },
      orderBy: [{ deletedAt: "desc" }, { id: "desc" }],
      include: {
        memo_tags: {
          include: { tag: true },
        },
      },
    });
  });

  it("returns 400 when scope is invalid", async () => {
    const response = await request(buildJsonTestApp(listRouter)).get("/").query({ scope: "broken" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "scope must be one of: active, trash, all." });
    expect(mockedPrisma.memos.findMany).not.toHaveBeenCalled();
  });
});
