import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import {
  createMemo as createMemoRequest,
  deleteMemo as deleteMemoRequest,
  fetchMemoList,
  reorderMemos as reorderMemosRequest,
  updateMemo as updateMemoRequest,
} from "../api/memo.repository";
import type { Memo, TagSummary } from "./memo.types";
import { useMemoStore } from "./useMemoStore";

vi.mock("../api/memo.repository", () => ({
  fetchMemoList: vi.fn(),
  createMemo: vi.fn(),
  updateMemo: vi.fn(),
  deleteMemo: vi.fn(),
  reorderMemos: vi.fn(),
}));

const makeTag = (overrides: Partial<TagSummary> = {}): TagSummary => ({
  id: 1,
  title: "work",
  ...overrides,
});

const makeMemo = (overrides: Partial<Memo> = {}): Memo => ({
  id: 1,
  orderIndex: 0,
  width: 180,
  height: 48,
  title: "Alpha",
  content: "First memo",
  createdAt: "2026-03-20T10:00:00.000Z",
  updatedAt: "2026-03-20T10:00:00.000Z",
  memo_tags: [
    {
      memo_id: 1,
      tag_id: 1,
      tag: makeTag(),
    },
  ],
  ...overrides,
});

describe("useMemoStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("fetchAll replaces items with repository results", async () => {
    const memos = [makeMemo(), makeMemo({ id: 2, orderIndex: 1, title: "Beta" })];
    vi.mocked(fetchMemoList).mockResolvedValue(memos);
    const store = useMemoStore();

    await store.fetchAll();

    expect(store.items).toEqual(memos);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it("createMemo prepends the created memo", async () => {
    const existing = makeMemo({ id: 1, title: "Existing" });
    const created = makeMemo({ id: 2, title: "Created" });
    vi.mocked(createMemoRequest).mockResolvedValue(created);
    const store = useMemoStore();
    store.items = [existing];

    const result = await store.createMemo({
      title: "Created",
      content: "Created memo",
      tags: ["work"],
    });

    expect(result).toEqual(created);
    expect(store.items).toEqual([created, existing]);
  });

  it("updateMemo patches the target memo while preserving tags", async () => {
    vi.mocked(updateMemoRequest).mockResolvedValue();
    const store = useMemoStore();
    const target = makeMemo();
    const untouched = makeMemo({ id: 2, orderIndex: 1, title: "Beta" });
    store.items = [target, untouched];

    const success = await store.updateMemo({
      id: 1,
      title: "Updated",
      content: "Updated memo",
      width: 220,
      height: 72,
    });

    expect(success).toBe(true);
    expect(store.items.find((memo) => memo.id === 1)).toMatchObject({
      id: 1,
      title: "Updated",
      content: "Updated memo",
      width: 220,
      height: 72,
    });
    expect(store.items.find((memo) => memo.id === 1)?.memo_tags).toEqual(target.memo_tags);
    expect(store.items.find((memo) => memo.id === 2)).toEqual(untouched);
  });

  it("reorderMemos sends order indices and rewrites local order", async () => {
    vi.mocked(reorderMemosRequest).mockResolvedValue();
    const first = makeMemo({ id: 1, orderIndex: 0 });
    const second = makeMemo({ id: 2, orderIndex: 1, title: "Second" });
    const store = useMemoStore();
    store.items = [first, second];

    const success = await store.reorderMemos([second, first]);

    expect(success).toBe(true);
    expect(reorderMemosRequest).toHaveBeenCalledWith([
      { id: 2, orderIndex: 0 },
      { id: 1, orderIndex: 1 },
    ]);
    expect(store.items.map((memo) => ({ id: memo.id, orderIndex: memo.orderIndex }))).toEqual([
      { id: 2, orderIndex: 0 },
      { id: 1, orderIndex: 1 },
    ]);
  });

  it("removes deleted tag references and replaces memo tags locally", () => {
    const store = useMemoStore();
    store.items = [
      makeMemo(),
      makeMemo({
        id: 2,
        memo_tags: [
          {
            memo_id: 2,
            tag_id: 2,
            tag: makeTag({ id: 2, title: "home" }),
          },
        ],
      }),
    ];

    store.removeDeletedTagReference(1);
    expect(store.items[0].memo_tags).toEqual([]);
    expect(store.items[1].memo_tags).toHaveLength(1);

    const nextTags = [makeTag({ id: 3, title: "later" })];
    store.replaceMemoTags(2, nextTags);

    expect(store.items[1].memo_tags).toEqual([
      {
        memo_id: 2,
        tag_id: 3,
        tag: nextTags[0],
      },
    ]);
  });

  it("sets an error when delete fails", async () => {
    vi.mocked(deleteMemoRequest).mockRejectedValue(new Error("boom"));
    const store = useMemoStore();
    store.items = [makeMemo()];

    const success = await store.deleteMemo(1);

    expect(success).toBe(false);
    expect(store.error).toBe("Failed to delete memo.");
    expect(store.items).toHaveLength(1);
  });
});
