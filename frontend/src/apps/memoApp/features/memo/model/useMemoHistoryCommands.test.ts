import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMemo as createMemoRequest,
  moveMemoToTrash as moveMemoToTrashRequest,
  purgeAllTrashMemos as purgeAllTrashMemosRequest,
  purgeMemo as purgeMemoRequest,
  restoreMemo as restoreMemoRequest,
} from "../infrastructure/memo.repository";
import type { Memo } from "./memo.types";
import { useMemoStore } from "./useMemoStore";
import { useMemoHistoryCommands } from "../application/useMemoCommands";
import { useMemoViewStore } from "../../view";
import { resetHistoryManager } from "../../../../../shared/history/useHistoryManager";
import { activateTestPinia } from "../../../../../test/pinia";

vi.mock("../infrastructure/memo.repository", () => ({
  createMemo: vi.fn(),
  moveMemoToTrash: vi.fn(),
  purgeAllTrashMemos: vi.fn(),
  purgeMemo: vi.fn(),
  restoreMemo: vi.fn(),
}));

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

describe("useMemoHistoryCommands", () => {
  beforeEach(() => {
    activateTestPinia();
    resetHistoryManager();
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("undoes and redoes memo creation through the shared history", async () => {
    const createdMemo = makeMemo({ id: 5, title: "Created" });
    vi.mocked(createMemoRequest).mockResolvedValue(createdMemo);
    vi.mocked(moveMemoToTrashRequest).mockResolvedValue(
      makeMemo({
        ...createdMemo,
        deletedAt: "2026-03-25T00:00:00.000Z",
      })
    );
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
    expect(memoStore.trashItems).toEqual([]);

    await commands.undo();
    expect(moveMemoToTrashRequest).toHaveBeenCalledWith(5);
    expect(memoStore.items).toEqual([]);
    expect(memoStore.trashItems).toEqual([
      makeMemo({
        ...createdMemo,
        deletedAt: "2026-03-25T00:00:00.000Z",
      }),
    ]);

    await commands.redo();
    expect(restoreMemoRequest).toHaveBeenCalledWith(5);
    expect(memoStore.items).toEqual([createdMemo]);
    expect(memoStore.trashItems).toEqual([]);
  });

  it("moves an active memo to trash and restores it through undo", async () => {
    const activeMemo = makeMemo({ id: 9, title: "Trash me" });
    const trashedMemo = makeMemo({
      ...activeMemo,
      deletedAt: "2026-03-25T00:00:00.000Z",
    });
    vi.mocked(moveMemoToTrashRequest).mockResolvedValue(trashedMemo);
    vi.mocked(restoreMemoRequest).mockResolvedValue(activeMemo);

    const memoStore = useMemoStore();
    const viewStore = useMemoViewStore();
    memoStore.items = [activeMemo];
    const commands = useMemoHistoryCommands();

    const result = await commands.moveMemoToTrash(9);
    expect(result).toEqual({ ok: true, value: undefined });
    expect(viewStore.currentScope).toBe("trash");
    expect(memoStore.items).toEqual([]);
    expect(memoStore.trashItems).toEqual([trashedMemo]);

    await commands.undo();
    expect(restoreMemoRequest).toHaveBeenCalledWith(9);
    expect(viewStore.currentScope).toBe("active");
    expect(memoStore.items).toEqual([activeMemo]);
    expect(memoStore.trashItems).toEqual([]);

    await commands.redo();
    expect(moveMemoToTrashRequest).toHaveBeenCalledWith(9);
    expect(viewStore.currentScope).toBe("trash");
    expect(memoStore.items).toEqual([]);
    expect(memoStore.trashItems).toEqual([trashedMemo]);
  });

  it("records manual scope switches in undo history", async () => {
    const viewStore = useMemoViewStore();
    const commands = useMemoHistoryCommands();

    expect(viewStore.currentScope).toBe("active");

    const switched = await commands.switchMemoScope("trash");
    expect(switched).toEqual({ ok: true, value: undefined });
    expect(viewStore.currentScope).toBe("trash");

    await commands.undo();
    expect(viewStore.currentScope).toBe("active");

    await commands.redo();
    expect(viewStore.currentScope).toBe("trash");
  });

  it("purges a trashed memo without recording history", async () => {
    vi.mocked(purgeMemoRequest).mockResolvedValue();

    const memoStore = useMemoStore();
    memoStore.trashItems = [
      makeMemo({
        id: 12,
        title: "To purge",
        deletedAt: "2026-03-25T00:00:00.000Z",
      }),
    ];
    const commands = useMemoHistoryCommands();

    const result = await commands.purgeMemo(12);

    expect(result).toEqual({ ok: true, value: undefined });
    expect(purgeMemoRequest).toHaveBeenCalledWith(12);
    expect(memoStore.trashItems).toEqual([]);
    expect(commands.canUndo.value).toBe(false);
  });

  it("purges the entire trash collection without recording history", async () => {
    vi.mocked(purgeAllTrashMemosRequest).mockResolvedValue(2);

    const memoStore = useMemoStore();
    memoStore.trashItems = [
      makeMemo({
        id: 12,
        title: "To purge",
        deletedAt: "2026-03-25T00:00:00.000Z",
      }),
      makeMemo({
        id: 13,
        title: "To purge 2",
        deletedAt: "2026-03-26T00:00:00.000Z",
      }),
    ];
    const commands = useMemoHistoryCommands();

    const result = await commands.purgeAllTrash();

    expect(result).toEqual({ ok: true, value: 2 });
    expect(purgeAllTrashMemosRequest).toHaveBeenCalledTimes(1);
    expect(memoStore.trashItems).toEqual([]);
    expect(commands.canUndo.value).toBe(false);
  });
});
