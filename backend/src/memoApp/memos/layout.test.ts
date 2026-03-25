import request from "supertest";

jest.mock("../../db", () => ({
  prisma: {
    memos: {
      update: jest.fn(),
    },
  },
}));

import { prisma } from "../../db";
import { buildJsonTestApp } from "../../test/buildJsonTestApp";
import layoutRouter from "./layout";

const mockedPrisma = prisma as unknown as {
  memos: {
    update: jest.Mock;
  };
};

describe("layoutRouter", () => {
  beforeEach(() => {
    mockedPrisma.memos.update.mockReset();
    mockedPrisma.memos.update.mockResolvedValue({ id: 1 });
  });

  it("preserves zero width and height values", async () => {
    const response = await request(buildJsonTestApp(layoutRouter))
      .put("/")
      .send({ memoId: 1, width: 0, height: 0 });

    expect(response.status).toBe(200);
    expect(mockedPrisma.memos.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { width: 0, height: 0 },
    });
  });

  it("returns 400 for invalid memoId", async () => {
    const response = await request(buildJsonTestApp(layoutRouter))
      .put("/")
      .send({ memoId: 0, width: 120, height: 48 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "memoId must be a positive integer." });
    expect(mockedPrisma.memos.update).not.toHaveBeenCalled();
  });
});
