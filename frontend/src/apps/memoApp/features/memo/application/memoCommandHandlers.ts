import {
  createMemo as createMemoRequest,
  moveMemoToTrash as moveMemoToTrashRequest,
  purgeAllTrashMemos as purgeAllTrashMemosRequest,
  purgeMemo as purgeMemoRequest,
  reorderMemos as reorderMemosRequest,
  restoreMemo as restoreMemoRequest,
  updateMemo as updateMemoRequest,
} from "../infrastructure/memo.repository";
import { cloneMemo, toMemoUpdateInput } from "../model/commandHelpers";
import type { CreateMemoInput, Memo, UpdateMemoInput } from "../model/memo.types";
import { useMemoStore } from "../model/useMemoStore";
import { memoViewNavigation, useMemoViewStore } from "../../view";
import type { CommandResult } from "../../../../../shared/command/commandResult";
import { toValueCommandResult, toVoidCommandResult } from "../../../../../shared/command/commandResult";
import type { UndoableAction } from "../../../../../shared/history/history.types";
import { useHistoryManager } from "../../../../../shared/history/useHistoryManager";

type MemoCommandDependencies = {
  memoStore: ReturnType<typeof useMemoStore>;
  viewStore: ReturnType<typeof useMemoViewStore>;
  history: ReturnType<typeof useHistoryManager>;
};

export const createMemoCommandHandlers = ({
  memoStore,
  viewStore,
  history,
}: MemoCommandDependencies) => {
  const getMemoById = (memoId: number) => memoStore.findMemoById(memoId);

  const createMemo = async (input: CreateMemoInput): Promise<CommandResult<Memo>> => {
    let memoSnapshot: Memo | null = null;

    const action: UndoableAction = {
      label: "Create memo",
      async do() {
        memoSnapshot = await createMemoRequest(input);
        memoStore.upsertLocalMemo(memoSnapshot);
      },
      async undo() {
        if (!memoSnapshot) {
          return;
        }

        memoSnapshot = await moveMemoToTrashRequest(memoSnapshot.id);
        memoStore.upsertLocalMemo(memoSnapshot);
      },
      async redo() {
        if (!memoSnapshot) {
          return;
        }

        memoSnapshot = await restoreMemoRequest(memoSnapshot.id);
        memoStore.upsertLocalMemo(memoSnapshot);
      },
    };

    const result = await history.execute(action);
    return toValueCommandResult<Memo>(result, memoSnapshot);
  };

  const updateMemo = async (input: UpdateMemoInput): Promise<CommandResult<void>> => {
    const currentMemo = getMemoById(input.id);
    if (!currentMemo) {
      return {
        ok: false,
        reason: "error",
      };
    }

    const previousMemo = cloneMemo(currentMemo);
    const nextMemo: Memo = {
      ...previousMemo,
      title: input.title,
      content: input.content,
      width: input.width === undefined ? previousMemo.width : input.width,
      height: input.height === undefined ? previousMemo.height : input.height,
    };

    const action: UndoableAction = {
      label: "Update memo",
      async do() {
        await updateMemoRequest({
          id: nextMemo.id,
          title: nextMemo.title,
          content: nextMemo.content,
          width: nextMemo.width,
          height: nextMemo.height,
        });
        memoStore.upsertLocalMemo(nextMemo);
      },
      async undo() {
        await updateMemoRequest(toMemoUpdateInput(previousMemo));
        memoStore.upsertLocalMemo(previousMemo);
      },
      async redo() {
        await updateMemoRequest(toMemoUpdateInput(nextMemo));
        memoStore.upsertLocalMemo(nextMemo);
      },
    };

    return toVoidCommandResult(await history.execute(action));
  };

  const moveMemoToTrash = async (memoId: number): Promise<CommandResult<void>> => {
    const currentMemo = getMemoById(memoId);
    if (!currentMemo) {
      return {
        ok: false,
        reason: "error",
      };
    }

    let memoSnapshot = cloneMemo(currentMemo);

    const action: UndoableAction = {
      label: "Move memo to trash",
      navigation: {
        do: memoViewNavigation.trash,
        undo: memoViewNavigation.active,
        redo: memoViewNavigation.trash,
      },
      async do() {
        memoSnapshot = await moveMemoToTrashRequest(memoSnapshot.id);
        memoStore.upsertLocalMemo(memoSnapshot);
        viewStore.setScope("trash");
      },
      async undo() {
        memoSnapshot = await restoreMemoRequest(memoSnapshot.id);
        memoStore.upsertLocalMemo(memoSnapshot);
        viewStore.setScope("active");
      },
      async redo() {
        memoSnapshot = await moveMemoToTrashRequest(memoSnapshot.id);
        memoStore.upsertLocalMemo(memoSnapshot);
        viewStore.setScope("trash");
      },
    };

    return toVoidCommandResult(await history.execute(action));
  };

  const restoreMemoFromTrash = async (memoId: number): Promise<CommandResult<void>> => {
    const currentMemo = getMemoById(memoId);
    if (!currentMemo) {
      return {
        ok: false,
        reason: "error",
      };
    }

    let memoSnapshot = cloneMemo(currentMemo);

    const action: UndoableAction = {
      label: "Restore memo from trash",
      navigation: {
        do: memoViewNavigation.active,
        undo: memoViewNavigation.trash,
        redo: memoViewNavigation.active,
      },
      async do() {
        memoSnapshot = await restoreMemoRequest(memoSnapshot.id);
        memoStore.upsertLocalMemo(memoSnapshot);
        viewStore.setScope("active");
      },
      async undo() {
        memoSnapshot = await moveMemoToTrashRequest(memoSnapshot.id);
        memoStore.upsertLocalMemo(memoSnapshot);
        viewStore.setScope("trash");
      },
      async redo() {
        memoSnapshot = await restoreMemoRequest(memoSnapshot.id);
        memoStore.upsertLocalMemo(memoSnapshot);
        viewStore.setScope("active");
      },
    };

    return toVoidCommandResult(await history.execute(action));
  };

  const purgeMemo = async (memoId: number): Promise<CommandResult<void>> => {
    const currentMemo = getMemoById(memoId);
    if (!currentMemo) {
      return {
        ok: false,
        reason: "error",
      };
    }

    try {
      await purgeMemoRequest(memoId);
      memoStore.removeLocalMemo(memoId);

      return {
        ok: true,
        value: undefined,
      };
    } catch (error) {
      return {
        ok: false,
        reason: "error",
        error,
      };
    }
  };

  const purgeAllTrash = async (): Promise<CommandResult<number>> => {
    try {
      const deletedCount = await purgeAllTrashMemosRequest();
      memoStore.clearTrashItems();

      return {
        ok: true,
        value: deletedCount,
      };
    } catch (error) {
      return {
        ok: false,
        reason: "error",
        error,
      };
    }
  };

  const reorderMemos = async (nextItems: Memo[]): Promise<CommandResult<void>> => {
    const previousItems = memoStore.items.map(cloneMemo);
    const reorderedItems = nextItems.map((memo, index) => ({
      ...cloneMemo(memo),
      orderIndex: index,
    }));

    const action: UndoableAction = {
      label: "Reorder memos",
      async do() {
        await reorderMemosRequest(
          reorderedItems.map((memo) => ({
            id: memo.id,
            orderIndex: memo.orderIndex,
          }))
        );
        memoStore.setItems(reorderedItems, "active");
      },
      async undo() {
        await reorderMemosRequest(
          previousItems.map((memo, index) => ({
            id: memo.id,
            orderIndex: index,
          }))
        );
        memoStore.setItems(previousItems, "active");
      },
      async redo() {
        await reorderMemosRequest(
          reorderedItems.map((memo) => ({
            id: memo.id,
            orderIndex: memo.orderIndex,
          }))
        );
        memoStore.setItems(reorderedItems, "active");
      },
    };

    return toVoidCommandResult(await history.execute(action));
  };

  return {
    createMemo,
    updateMemo,
    moveMemoToTrash,
    restoreMemoFromTrash,
    purgeMemo,
    purgeAllTrash,
    reorderMemos,
  };
};
