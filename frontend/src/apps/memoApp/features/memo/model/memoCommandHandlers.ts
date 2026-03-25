import {
  createMemo as createMemoRequest,
  moveMemoToTrash as moveMemoToTrashRequest,
  purgeMemo as purgeMemoRequest,
  reorderMemos as reorderMemosRequest,
  restoreMemo as restoreMemoRequest,
  updateMemo as updateMemoRequest,
} from "../api/memo.repository";
import { useMemoStore } from "./useMemoStore";
import { useHistoryManager } from "../../../../../shared/history/useHistoryManager";
import type { UndoableAction } from "../../../../../shared/history/history.types";
import type { CommandResult } from "./commandResult";
import type { CreateMemoInput, Memo, UpdateMemoInput } from "./memo.types";
import {
  cloneMemo,
  toMemoUpdateInput,
  toValueCommandResult,
  toVoidCommandResult,
} from "./commandHelpers";

type MemoCommandDependencies = {
  memoStore: ReturnType<typeof useMemoStore>;
  history: ReturnType<typeof useHistoryManager>;
};

export const createMemoCommandHandlers = ({ memoStore, history }: MemoCommandDependencies) => {
  const getMemoById = (memoId: number) => memoStore.items.find((memo) => memo.id === memoId);

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
        memoStore.removeLocalMemo(memoSnapshot.id);
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
    const finalMemo = memoSnapshot;

    return toValueCommandResult<Memo>(result, finalMemo);
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
      async do() {
        memoSnapshot = await moveMemoToTrashRequest(memoSnapshot.id);
        memoStore.removeLocalMemo(memoSnapshot.id);
      },
      async undo() {
        memoSnapshot = await restoreMemoRequest(memoSnapshot.id);
        memoStore.upsertLocalMemo(memoSnapshot);
      },
      async redo() {
        memoSnapshot = await moveMemoToTrashRequest(memoSnapshot.id);
        memoStore.removeLocalMemo(memoSnapshot.id);
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
      async do() {
        memoSnapshot = await restoreMemoRequest(memoSnapshot.id);
        memoStore.removeLocalMemo(memoSnapshot.id);
      },
      async undo() {
        memoSnapshot = await moveMemoToTrashRequest(memoSnapshot.id);
        memoStore.upsertLocalMemo(memoSnapshot);
      },
      async redo() {
        memoSnapshot = await restoreMemoRequest(memoSnapshot.id);
        memoStore.removeLocalMemo(memoSnapshot.id);
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

    await purgeMemoRequest(memoId);
    memoStore.removeLocalMemo(memoId);

    return {
      ok: true,
      value: undefined,
    };
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
        memoStore.setItems(reorderedItems);
      },
      async undo() {
        await reorderMemosRequest(
          previousItems.map((memo, index) => ({
            id: memo.id,
            orderIndex: index,
          }))
        );
        memoStore.setItems(previousItems);
      },
      async redo() {
        await reorderMemosRequest(
          reorderedItems.map((memo) => ({
            id: memo.id,
            orderIndex: memo.orderIndex,
          }))
        );
        memoStore.setItems(reorderedItems);
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
    reorderMemos,
  };
};
