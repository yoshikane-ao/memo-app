import request from "supertest";

jest.mock("../../db", () => ({
  prisma: {
    memos: {
      update: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from "../../db";
import { buildJsonTestApp } from "../../test/buildJsonTestApp";
import deleteRouter from "./delete";
import purgeRouter from "./purge";
import restoreRouter from "./restore";

const mockedPrisma = prisma as unknown as {
  memos: {
    update: jest.Mock;
    findUnique: jest.Mock;
    delete: jest.Mock;
  };
};

describe("memo trash routes", () => {
  beforeEach(() => {
    mockedPrisma.memos.update.mockReset();
    mockedPrisma.memos.findUnique.mockReset();
    mockedPrisma.memos.delete.mockReset();
    mockedPrisma.memos.update.mockResolvedValue({ id: 1, deletedAt: "2026-03-25T00:00:00.000Z" });
    mockedPrisma.memos.findUnique.mockResolvedValue({ id: 1, deletedAt: new Date("2026-03-25T00:00:00.000Z") });
    mockedPrisma.memos.delete.mockResolvedValue({ id: 1 });
  });

  it("moves a memo to trash instead of hard deleting it", async () => {
    const response = await request(buildJsonTestApp(deleteRouter)).delete("/1");

    expect(response.status).toBe(200);
    expect(mockedPrisma.memos.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        deletedAt: expect.any(Date),
      },
      include: {
        memo_tags: {
          include: { tag: true },
        },
      },
    });
  });

  it("restores a trashed memo by id", async () => {
    const response = await request(buildJsonTestApp(restoreRouter)).post("/1");

    expect(response.status).toBe(201);
    expect(mockedPrisma.memos.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        deletedAt: null,
      },
      include: {
        memo_tags: {
          include: { tag: true },
        },
      },
    });
  });

  it("purges only trashed memos", async () => {
    const response = await request(buildJsonTestApp(purgeRouter)).delete("/1");

    expect(response.status).toBe(200);
    expect(mockedPrisma.memos.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(mockedPrisma.memos.delete).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        memo_tags: {
          include: { tag: true },
        },
      },
    });
  });

  it("returns 400 when trying to purge an active memo", async () => {
    mockedPrisma.memos.findUnique.mockResolvedValueOnce({ id: 1, deletedAt: null });

    const response = await request(buildJsonTestApp(purgeRouter)).delete("/1");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "Only trashed memos can be permanently deleted.",
    });
    expect(mockedPrisma.memos.delete).not.toHaveBeenCalled();
  });
});
