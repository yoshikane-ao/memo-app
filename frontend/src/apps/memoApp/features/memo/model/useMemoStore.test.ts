import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchMemoList } from "../api/memo.repository";
import type { Memo, TagSummary } from "./memo.types";
import { useMemoStore } from "./useMemoStore";
import { activateTestPinia } from "../../../../../test/pinia";

vi.mock("../api/memo.repository", () => ({
  fetchMemoList: vi.fn(),
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
  deletedAt: null,
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
    activateTestPinia();
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("fetchAll replaces items with repository results", async () => {
    const memos = [makeMemo(), makeMemo({ id: 2, orderIndex: 1, title: "Beta" })];
    vi.mocked(fetchMemoList).mockResolvedValue(memos);
    const store = useMemoStore();

    const success = await store.fetchAll();

    expect(success).toBe(true);
    expect(store.items).toEqual(memos);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
    expect(store.loadedScope).toBe("active");
    expect(fetchMemoList).toHaveBeenCalledWith("active");
  });

  it("ensureLoaded skips fetching when items already exist", async () => {
    const store = useMemoStore();
    store.items = [makeMemo()];

    const success = await store.ensureLoaded();

    expect(success).toBe(true);
    expect(fetchMemoList).not.toHaveBeenCalled();
  });

  it("sets an error when fetching memos fails", async () => {
    vi.mocked(fetchMemoList).mockRejectedValue(new Error("boom"));
    const store = useMemoStore();

    const success = await store.fetchAll();

    expect(success).toBe(false);
    expect(store.error).toBe("Failed to fetch memos.");
    expect(store.items).toEqual([]);
  });

  it("clears the current list when switching to another scope before refetching", async () => {
    vi.mocked(fetchMemoList).mockRejectedValue(new Error("boom"));
    const store = useMemoStore();
    store.items = [makeMemo()];

    const success = await store.fetchAll("trash");

    expect(success).toBe(false);
    expect(store.items).toEqual([]);
    expect(store.loadedScope).toBe("trash");
  });

  it("setItems sorts memos by orderIndex and id", () => {
    const store = useMemoStore();
    const first = makeMemo({ id: 1, orderIndex: 1, title: "First" });
    const second = makeMemo({ id: 2, orderIndex: 0, title: "Second" });
    const third = makeMemo({ id: 3, orderIndex: 1, title: "Third" });

    store.setItems([first, second, third]);

    expect(store.items.map((memo) => memo.id)).toEqual([2, 3, 1]);
  });

  it("sorts trash items by deletedAt descending when the trash scope is loaded", () => {
    const store = useMemoStore();

    store.setItems(
      [
        makeMemo({ id: 1, deletedAt: "2026-03-24T10:00:00.000Z" }),
        makeMemo({ id: 2, deletedAt: "2026-03-25T10:00:00.000Z" }),
        makeMemo({ id: 3, deletedAt: "2026-03-23T10:00:00.000Z" }),
      ],
      "trash"
    );

    expect(store.items.map((memo) => memo.id)).toEqual([2, 1, 3]);
    expect(store.loadedScope).toBe("trash");
  });

  it("upsertLocalMemo adds and updates memos locally", () => {
    const store = useMemoStore();
    const existing = makeMemo({ id: 1, title: "Existing" });
    const created = makeMemo({ id: 2, title: "Created", orderIndex: 1 });
    store.items = [existing];

    store.upsertLocalMemo(created);
    store.upsertLocalMemo(makeMemo({ id: 1, title: "Updated existing" }));

    expect(store.items.map((memo) => memo.title)).toEqual(["Updated existing", "Created"]);
  });

  it("updates local tag relations without duplicating entries", () => {
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

    const nextTags = [makeTag({ id: 3, title: "later" })];
    store.replaceMemoTags(2, nextTags);
    store.addLocalTagToMemo(2, nextTags[0]);

    expect(store.items[1].memo_tags).toEqual([
      {
        memo_id: 2,
        tag_id: 3,
        tag: nextTags[0],
      },
    ]);
  });

  it("removes memos locally", () => {
    const store = useMemoStore();
    store.items = [makeMemo(), makeMemo({ id: 2, title: "Second" })];

    store.removeLocalMemo(1);

    expect(store.items.map((memo) => memo.id)).toEqual([2]);
  });
});
