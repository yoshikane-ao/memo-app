import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import {
  createMemo as createMemoRequest,
  deleteMemo as deleteMemoRequest,
  reorderMemos as reorderMemosRequest,
  restoreMemo as restoreMemoRequest,
  updateMemo as updateMemoRequest,
} from "../api/memo.repository";
import {
  createTag as createTagRequest,
  deleteTag as deleteTagRequest,
  linkTagToMemo as linkTagToMemoRequest,
  restoreTag as restoreTagRequest,
  unlinkTagFromMemo as unlinkTagFromMemoRequest,
} from "../../tag/api/tag.repository";
import type { Memo, TagSummary } from "./memo.types";
import { useMemoStore } from "./useMemoStore";
import { useMemoHistoryCommands } from "./useMemoHistoryCommands";
import { useTagStore } from "../../tag/model/useTagStore";
import { resetHistoryManager } from "../../../shared/history/useHistoryManager";

vi.mock("../api/memo.repository", () => ({
  createMemo: vi.fn(),
  deleteMemo: vi.fn(),
  reorderMemos: vi.fn(),
  restoreMemo: vi.fn(),
  updateMemo: vi.fn(),
}));

vi.mock("../../tag/api/tag.repository", () => ({
  createTag: vi.fn(),
  deleteTag: vi.fn(),
  linkTagToMemo: vi.fn(),
  restoreTag: vi.fn(),
  unlinkTagFromMemo: vi.fn(),
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
  memo_tags: [],
  ...overrides,
});

describe("useMemoHistoryCommands", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    resetHistoryManager();
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("undoes and redoes memo creation through the shared history", async () => {
    const createdMemo = makeMemo({ id: 5, title: "Created" });
    vi.mocked(createMemoRequest).mockResolvedValue(createdMemo);
    vi.mocked(deleteMemoRequest).mockResolvedValue();
    vi.mocked(restoreMemoRequest).mockResolvedValue(createdMemo);

    const memoStore = useMemoStore();
    const commands = useMemoHistoryCommands();

    const result = await commands.createMemo({
      title: "Created",
      content: "Body",
      tags: [],
    });

    expect(result).toEqual({
      ok: true,
      value: createdMemo,
    });
    expect(memoStore.items).toEqual([createdMemo]);

    await commands.undo();
    expect(deleteMemoRequest).toHaveBeenCalledWith(5);
    expect(memoStore.items).toEqual([]);

    await commands.redo();
    expect(restoreMemoRequest).toHaveBeenCalledWith(createdMemo);
    expect(memoStore.items).toEqual([createdMemo]);
  });

  it("restores deleted tags and memo-tag relations on undo", async () => {
    vi.mocked(deleteTagRequest).mockResolvedValue();
    vi.mocked(restoreTagRequest).mockResolvedValue({ id: 1, title: "work" });
    vi.mocked(createTagRequest).mockResolvedValue({ id: 1, title: "work" });
    vi.mocked(linkTagToMemoRequest).mockResolvedValue();
    vi.mocked(unlinkTagFromMemoRequest).mockResolvedValue();
    vi.mocked(updateMemoRequest).mockResolvedValue();
    vi.mocked(reorderMemosRequest).mockResolvedValue();

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

    const commands = useMemoHistoryCommands();

    const deleted = await commands.deleteTag(1);
    expect(deleted).toEqual({ ok: true, value: undefined });
    expect(tagStore.items).toEqual([]);
    expect(memoStore.items[0].memo_tags).toEqual([]);

    await commands.undo();

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

    const commands = useMemoHistoryCommands();

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

    await commands.undo();
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
