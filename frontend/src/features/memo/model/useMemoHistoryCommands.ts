import { computed } from "vue";
import type { CreateMemoInput, Memo, TagSummary, UpdateMemoInput } from "./memo.types";
import {
  createMemo as createMemoRequest,
  deleteMemo as deleteMemoRequest,
  reorderMemos as reorderMemosRequest,
  restoreMemo as restoreMemoRequest,
  updateMemo as updateMemoRequest,
} from "../api/memo.repository";
import { useMemoStore } from "./useMemoStore";
import { useTagStore } from "../../tag/model/useTagStore";
import type { CreateTagInput, RestoreTagInput, TagItem } from "../../tag/model/tag.types";
import {
  createTag as createTagRequest,
  deleteTag as deleteTagRequest,
  linkTagToMemo as linkTagToMemoRequest,
  restoreTag as restoreTagRequest,
  unlinkTagFromMemo as unlinkTagFromMemoRequest,
} from "../../tag/api/tag.repository";
import { useHistoryManager } from "../../../shared/history/useHistoryManager";
import type { UndoableAction } from "../../../shared/history/history.types";
import type { CommandResult } from "./commandResult";

const cloneTagSummary = (tag: TagSummary): TagSummary => ({
  ...tag,
});

const cloneMemo = (memo: Memo): Memo => ({
  ...memo,
  memo_tags: memo.memo_tags.map((memoTag) => ({
    ...memoTag,
    tag: cloneTagSummary(memoTag.tag),
  })),
});

const toTagSummary = (tag: TagItem): TagSummary => ({
  id: tag.id,
  title: tag.title,
});

const toMemoUpdateInput = (memo: Memo): UpdateMemoInput => ({
  id: memo.id,
  title: memo.title,
  content: memo.content,
  width: memo.width,
  height: memo.height,
});

export const useMemoHistoryCommands = () => {
  const memoStore = useMemoStore();
  const tagStore = useTagStore();
  const history = useHistoryManager();

  const getMemoById = (memoId: number) => memoStore.items.find((memo) => memo.id === memoId);

  const getMemoTags = (memoId: number) =>
    getMemoById(memoId)?.memo_tags.map((memoTag) => cloneTagSummary(memoTag.tag)) ?? [];

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

        await deleteMemoRequest(memoSnapshot.id);
        memoStore.removeLocalMemo(memoSnapshot.id);
      },
      async redo() {
        if (!memoSnapshot) {
          return;
        }

        memoSnapshot = await restoreMemoRequest(memoSnapshot);
        memoStore.upsertLocalMemo(memoSnapshot);
      },
    };

    const success = await history.execute(action);
    const finalMemo = memoSnapshot;

    if (!success.ok || finalMemo == null) {
      return success.ok
        ? { ok: false, reason: "error" }
        : {
            ok: false,
            reason: success.reason,
            error: success.error,
          };
    }

    return {
      ok: true,
      value: finalMemo,
    };
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

    const result = await history.execute(action);
    return result.ok ? { ok: true, value: undefined } : result;
  };

  const deleteMemo = async (memoId: number): Promise<CommandResult<void>> => {
    const currentMemo = getMemoById(memoId);
    if (!currentMemo) {
      return {
        ok: false,
        reason: "error",
      };
    }

    let memoSnapshot = cloneMemo(currentMemo);

    const action: UndoableAction = {
      label: "Delete memo",
      async do() {
        await deleteMemoRequest(memoSnapshot.id);
        memoStore.removeLocalMemo(memoSnapshot.id);
      },
      async undo() {
        memoSnapshot = await restoreMemoRequest(memoSnapshot);
        memoStore.upsertLocalMemo(memoSnapshot);
      },
      async redo() {
        await deleteMemoRequest(memoSnapshot.id);
        memoStore.removeLocalMemo(memoSnapshot.id);
      },
    };

    const result = await history.execute(action);
    return result.ok ? { ok: true, value: undefined } : result;
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

    const result = await history.execute(action);
    return result.ok ? { ok: true, value: undefined } : result;
  };

  const changeMemoTag = async (
    memoId: number,
    tag: TagItem,
    operation: "add" | "remove"
  ): Promise<CommandResult<void>> => {
    const currentMemo = getMemoById(memoId);
    if (!currentMemo) {
      return {
        ok: false,
        reason: "error",
      };
    }

    const previousTags = getMemoTags(memoId);
    const alreadyLinked = previousTags.some((currentTag) => currentTag.id === tag.id);

    if (operation === "add" && alreadyLinked) {
      return {
        ok: true,
        value: undefined,
      };
    }

    if (operation === "remove" && !alreadyLinked) {
      return {
        ok: true,
        value: undefined,
      };
    }

    const nextTags =
      operation === "add"
        ? [...previousTags, toTagSummary(tag)]
        : previousTags.filter((currentTag) => currentTag.id !== tag.id);

    const applyDo = async () => {
      if (operation === "add") {
        await linkTagToMemoRequest(memoId, tag.id);
      } else {
        await unlinkTagFromMemoRequest(memoId, tag.id);
      }

      memoStore.replaceMemoTags(memoId, nextTags);
    };

    const applyUndo = async () => {
      if (operation === "add") {
        await unlinkTagFromMemoRequest(memoId, tag.id);
      } else {
        await linkTagToMemoRequest(memoId, tag.id);
      }

      memoStore.replaceMemoTags(memoId, previousTags);
    };

    const action: UndoableAction = {
      label: operation === "add" ? "Add tag to memo" : "Remove tag from memo",
      do: applyDo,
      undo: applyUndo,
      redo: applyDo,
    };

    const result = await history.execute(action);
    return result.ok ? { ok: true, value: undefined } : result;
  };

  const addTagToMemo = (memoId: number, tag: TagItem) => changeMemoTag(memoId, tag, "add");

  const removeTagFromMemo = (memoId: number, tag: TagItem) => changeMemoTag(memoId, tag, "remove");

  const createTag = async (input: CreateTagInput): Promise<CommandResult<TagItem>> => {
    let createdTag: TagItem | null = null;
    let tagSnapshot: RestoreTagInput | null = null;

    const action: UndoableAction = {
      label: "Create tag",
      async do() {
        createdTag = await createTagRequest(input);
        tagSnapshot = {
          ...createdTag,
          linkedMemoIds: input.memoId == null ? [] : [input.memoId],
        };
        tagStore.addLocalTag(createdTag);

        if (input.memoId != null) {
          memoStore.addLocalTagToMemo(input.memoId, toTagSummary(createdTag));
        }
      },
      async undo() {
        if (!tagSnapshot) {
          return;
        }

        await deleteTagRequest(tagSnapshot.id);
        tagStore.removeLocalTag(tagSnapshot.id);
        memoStore.removeDeletedTagReference(tagSnapshot.id);
      },
      async redo() {
        if (!tagSnapshot) {
          return;
        }

        const restoredTag = await restoreTagRequest(tagSnapshot);
        createdTag = restoredTag;
        tagSnapshot = {
          ...restoredTag,
          linkedMemoIds: tagSnapshot.linkedMemoIds ?? [],
        };
        tagStore.addLocalTag(restoredTag);

        for (const memoId of tagSnapshot.linkedMemoIds ?? []) {
          memoStore.addLocalTagToMemo(memoId, toTagSummary(restoredTag));
        }
      },
    };

    const success = await history.execute(action);
    const finalTag = createdTag;

    if (!success.ok || finalTag == null) {
      return success.ok
        ? { ok: false, reason: "error" }
        : {
            ok: false,
            reason: success.reason,
            error: success.error,
          };
    }

    return {
      ok: true,
      value: finalTag,
    };
  };

  const deleteTag = async (tagId: number): Promise<CommandResult<void>> => {
    const currentTag = tagStore.items.find((tag) => tag.id === tagId);
    if (!currentTag) {
      return {
        ok: false,
        reason: "error",
      };
    }

    const affectedMemoTags = memoStore.items
      .filter((memo) => memo.memo_tags.some((memoTag) => memoTag.tag.id === tagId))
      .map((memo) => ({
        memoId: memo.id,
        tags: memo.memo_tags.map((memoTag) => cloneTagSummary(memoTag.tag)),
      }));

    let tagSnapshot: RestoreTagInput = {
      ...currentTag,
      linkedMemoIds: affectedMemoTags.map((memo) => memo.memoId),
    };

    const action: UndoableAction = {
      label: "Delete tag",
      async do() {
        await deleteTagRequest(tagSnapshot.id);
        tagStore.removeLocalTag(tagSnapshot.id);
        memoStore.removeDeletedTagReference(tagSnapshot.id);
      },
      async undo() {
        const restoredTag = await restoreTagRequest(tagSnapshot);
        tagSnapshot = {
          ...restoredTag,
          linkedMemoIds: tagSnapshot.linkedMemoIds ?? [],
        };
        tagStore.addLocalTag(restoredTag);

        for (const memo of affectedMemoTags) {
          memoStore.replaceMemoTags(
            memo.memoId,
            memo.tags.map((tag) => (tag.id === tagSnapshot.id ? toTagSummary(restoredTag) : tag))
          );
        }
      },
      async redo() {
        await deleteTagRequest(tagSnapshot.id);
        tagStore.removeLocalTag(tagSnapshot.id);
        memoStore.removeDeletedTagReference(tagSnapshot.id);
      },
    };

    const result = await history.execute(action);
    return result.ok ? { ok: true, value: undefined } : result;
  };

  return {
    canUndo: computed(() => history.canUndo.value),
    canRedo: computed(() => history.canRedo.value),
    createMemo,
    updateMemo,
    deleteMemo,
    reorderMemos,
    addTagToMemo,
    removeTagFromMemo,
    createTag,
    deleteTag,
    undo: history.undo,
    redo: history.redo,
    clearHistory: history.clear,
  };
};
