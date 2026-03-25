import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMemo,
  fetchMemoList,
  moveMemoToTrash,
  restoreMemo,
} from "./memo.repository";

const apiClientMocks = vi.hoisted(() => ({
  getJsonMock: vi.fn(),
  postJsonMock: vi.fn(),
  deleteJsonMock: vi.fn(),
  putJsonMock: vi.fn(),
}));

vi.mock("../../../../../shared/api/client", () => ({
  getJson: apiClientMocks.getJsonMock,
  postJson: apiClientMocks.postJsonMock,
  putJson: apiClientMocks.putJsonMock,
  deleteJson: apiClientMocks.deleteJsonMock,
}));

const makeMemoDto = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  orderIndex: 0,
  width: 180,
  height: 48,
  title: "Alpha",
  content: "First memo",
  deletedAt: null,
  createdAt: "2026-03-20T10:00:00.000Z",
  updatedAt: "2026-03-20T10:00:00.000Z",
  memo_tags: [],
  ...overrides,
});

describe("memo.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps memo lists from the active API scope", async () => {
    apiClientMocks.getJsonMock.mockResolvedValue({
      items: [makeMemoDto()],
    });

    const memos = await fetchMemoList("trash");

    expect(apiClientMocks.getJsonMock).toHaveBeenCalledWith("/memos/list?scope=trash");
    expect(memos).toEqual([makeMemoDto()]);
  });

  it("accepts wrapped memo payloads from delete and restore endpoints", async () => {
    apiClientMocks.deleteJsonMock.mockResolvedValue({
      memo: makeMemoDto({
        deletedAt: "2026-03-25T00:00:00.000Z",
      }),
    });
    apiClientMocks.postJsonMock.mockResolvedValue({
      item: makeMemoDto(),
    });

    const trashed = await moveMemoToTrash(1);
    const restored = await restoreMemo(1);

    expect(trashed.deletedAt).toBe("2026-03-25T00:00:00.000Z");
    expect(restored.deletedAt).toBeNull();
  });

  it("normalizes older payloads that omit deletedAt and memo_tags", async () => {
    apiClientMocks.getJsonMock.mockResolvedValue({
      items: [
        {
          id: 1,
          orderIndex: 0,
          width: null,
          height: null,
          title: "Legacy",
          content: "Payload",
          createdAt: "2026-03-20T10:00:00.000Z",
          updatedAt: "2026-03-20T10:00:00.000Z",
        },
      ],
    });

    const memos = await fetchMemoList();

    expect(memos).toEqual([
      makeMemoDto({
        width: null,
        height: null,
        title: "Legacy",
        content: "Payload",
      }),
    ]);
  });

  it("rejects trash-specific requests when the running backend omits deletedAt", async () => {
    apiClientMocks.getJsonMock.mockResolvedValue({
      items: [
        {
          id: 1,
          orderIndex: 0,
          width: null,
          height: null,
          title: "Legacy",
          content: "Payload",
          createdAt: "2026-03-20T10:00:00.000Z",
          updatedAt: "2026-03-20T10:00:00.000Z",
          memo_tags: [],
        },
      ],
    });
    apiClientMocks.deleteJsonMock.mockResolvedValue({
      id: 1,
      orderIndex: 0,
      width: null,
      height: null,
      title: "Legacy",
      content: "Payload",
      createdAt: "2026-03-20T10:00:00.000Z",
      updatedAt: "2026-03-20T10:00:00.000Z",
      memo_tags: [],
    });

    await expect(fetchMemoList("trash")).rejects.toThrow(
      "Trash requires the latest backend. Restart the API server."
    );
    await expect(moveMemoToTrash(1)).rejects.toThrow(
      "Trash requires the latest backend. Restart the API server."
    );
  });

  it("throws a readable error when the backend response is not a memo dto", async () => {
    apiClientMocks.postJsonMock.mockResolvedValue({
      message: "ok",
    });

    await expect(
      createMemo({
        title: "Broken",
        content: "Shape",
        tags: [],
      })
    ).rejects.toThrow("Invalid memo response.");
  });
});
