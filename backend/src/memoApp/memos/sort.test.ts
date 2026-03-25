import request from "supertest";

jest.mock("../../db", () => ({
  prisma: {
    memos: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { prisma } from "../../db";
import { buildJsonTestApp } from "../../test/buildJsonTestApp";
import sortRouter from "./sort";

const mockedPrisma = prisma as unknown as {
  memos: {
    update: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe("sortRouter", () => {
  beforeEach(() => {
    mockedPrisma.memos.update.mockReset();
    mockedPrisma.$transaction.mockReset();
    mockedPrisma.memos.update.mockImplementation(({ where, data }) => ({ where, data }));
    mockedPrisma.$transaction.mockResolvedValue(undefined);
  });

  it("accepts orderIndex zero", async () => {
    const response = await request(buildJsonTestApp(sortRouter))
      .put("/")
      .send({ items: [{ id: 1, orderIndex: 0 }] });

    expect(response.status).toBe(200);
    expect(mockedPrisma.memos.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { orderIndex: 0 },
    });
    expect(mockedPrisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("returns 400 when items is not an array", async () => {
    const response = await request(buildJsonTestApp(sortRouter)).put("/").send({ items: {} });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "items must be an array." });
    expect(mockedPrisma.memos.update).not.toHaveBeenCalled();
  });
});
