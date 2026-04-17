import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteTag as deleteTagRequest,
  linkTagToMemo as linkTagToMemoRequest,
  restoreTag as restoreTagRequest,
  unlinkTagFromMemo as unlinkTagFromMemoRequest,
} from "../infrastructure/tag.repository";
import type { Memo } from "../../memo";
import { useMemoStore } from "../../memo";
import { resetHistoryManager, useHistoryManager } from "../../../../../shared/history/useHistoryManager";
import { activateTestPinia } from "../../../../../test/pinia";
import { useTagStore } from "../model/useTagStore";
import { useTagCommands } from "./useTagCommands";

vi.mock("../infrastructure/tag.repository", () => ({
  createTag: vi.fn(),
  deleteTag: vi.fn(),
  linkTagToMemo: vi.fn(),
  restoreTag: vi.fn(),
  unlinkTagFromMemo: vi.fn(),
}));

const makeTag = (overrides: Partial<{ id: number; title: string }> = {}) => ({
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
  memo_tags: [],
  ...overrides,
});

describe("useTagCommands", () => {
  beforeEach(() => {
    activateTestPinia();
    resetHistoryManager();
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("restores deleted tags and memo-tag relations on undo", async () => {
    vi.mocked(deleteTagRequest).mockResolvedValue();
    vi.mocked(restoreTagRequest).mockResolvedValue({ id: 1, title: "work" });

    const memoStore = useMemoStore();
    memoStore.items = [
      makeMemo({
        memo_tags: [
          {
            memo_id: 1,
            tag_id: 1,
            tag: makeTag(),
          },
        ],
      }),
    ];

    const tagStore = useTagStore();
    tagStore.items = [{ id: 1, title: "work" }];

    const commands = useTagCommands();
    const history = useHistoryManager();

    const deleted = await commands.deleteTag(1);
    expect(deleted).toEqual({ ok: true, value: undefined });
    expect(tagStore.items).toEqual([]);
    expect(memoStore.items[0].memo_tags).toEqual([]);

    await history.undo();

    expect(restoreTagRequest).toHaveBeenCalledWith({
      id: 1,
      title: "work",
      linkedMemoIds: [1],
    });
    expect(tagStore.items).toEqual([{ id: 1, title: "work" }]);
    expect(memoStore.items[0].memo_tags).toEqual([
      {
        memo_id: 1,
        tag_id: 1,
        tag: { id: 1, title: "work" },
      },
    ]);
  });

  it("replaces memo tags as a single undoable action", async () => {
    vi.mocked(linkTagToMemoRequest).mockResolvedValue();
    vi.mocked(unlinkTagFromMemoRequest).mockResolvedValue();

    const memoStore = useMemoStore();
    memoStore.items = [
      makeMemo({
        memo_tags: [
          {
            memo_id: 1,
            tag_id: 1,
            tag: makeTag(),
          },
        ],
      }),
    ];

    const commands = useTagCommands();
    const history = useHistoryManager();

    const replaced = await commands.replaceMemoTags(1, [{ id: 2, title: "home" }]);
    expect(replaced).toEqual({ ok: true, value: undefined });
    expect(unlinkTagFromMemoRequest).toHaveBeenCalledWith(1, 1);
    expect(linkTagToMemoRequest).toHaveBeenCalledWith(1, 2);
    expect(memoStore.items[0].memo_tags).toEqual([
      {
        memo_id: 1,
        tag_id: 2,
        tag: { id: 2, title: "home" },
      },
    ]);

    await history.undo();
    expect(linkTagToMemoRequest).toHaveBeenCalledWith(1, 1);
    expect(unlinkTagFromMemoRequest).toHaveBeenCalledWith(1, 2);
    expect(memoStore.items[0].memo_tags).toEqual([
      {
        memo_id: 1,
        tag_id: 1,
        tag: { id: 1, title: "work" },
      },
    ]);
  });
});
