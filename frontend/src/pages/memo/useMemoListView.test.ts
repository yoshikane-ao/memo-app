import { describe, expect, it } from "vitest";
import { ref } from "vue";
import type { Memo } from "../../features/memo";
import { useMemoListView } from "./useMemoListView";

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
      tag: { id: 1, title: "work" },
    },
  ],
  ...overrides,
});

describe("useMemoListView", () => {
  it("filters memos by selected tags and keyword", () => {
    const items = ref([
      makeMemo({ id: 1, title: "Project note", content: "Roadmap", memo_tags: [] }),
      makeMemo({
        id: 2,
        title: "Home",
        content: "Buy milk",
        memo_tags: [{ memo_id: 2, tag_id: 2, tag: { id: 2, title: "errand" } }],
      }),
      makeMemo({
        id: 3,
        title: "Work item",
        content: "Finish report",
        memo_tags: [{ memo_id: 3, tag_id: 1, tag: { id: 1, title: "work" } }],
      }),
    ]);
    const view = useMemoListView(items);

    view.selectedTags.value = [1];
    view.keyword.value = "report";
    view.searchType.value = "content";

    expect(view.displayedMemos.value.map((memo) => memo.id)).toEqual([3]);
  });

  it("matches tags when search type is tag", () => {
    const items = ref([
      makeMemo({ id: 1, memo_tags: [{ memo_id: 1, tag_id: 7, tag: { id: 7, title: "idea" } }] }),
      makeMemo({ id: 2, memo_tags: [{ memo_id: 2, tag_id: 8, tag: { id: 8, title: "travel" } }] }),
    ]);
    const view = useMemoListView(items);

    view.keyword.value = "travel";
    view.searchType.value = "tag";

    expect(view.displayedMemos.value.map((memo) => memo.id)).toEqual([2]);
  });

  it("sorts newest and oldest by createdAt", () => {
    const items = ref([
      makeMemo({ id: 1, createdAt: "2026-03-20T10:00:00.000Z" }),
      makeMemo({ id: 2, createdAt: "2026-03-22T10:00:00.000Z" }),
      makeMemo({ id: 3, createdAt: "2026-03-21T10:00:00.000Z" }),
    ]);
    const view = useMemoListView(items);

    view.sortOrder.value = "newest";
    expect(view.displayedMemos.value.map((memo) => memo.id)).toEqual([2, 3, 1]);

    view.sortOrder.value = "oldest";
    expect(view.displayedMemos.value.map((memo) => memo.id)).toEqual([1, 3, 2]);
  });

  it("disables manual reorder when filters are active", () => {
    const items = ref([makeMemo()]);
    const view = useMemoListView(items);

    expect(view.canReorder.value).toBe(true);

    view.keyword.value = "alpha";
    expect(view.canReorder.value).toBe(false);

    view.keyword.value = "";
    view.selectedTags.value = [1];
    expect(view.canReorder.value).toBe(false);

    view.selectedTags.value = [];
    view.sortOrder.value = "newest";
    expect(view.canReorder.value).toBe(false);
  });
});
