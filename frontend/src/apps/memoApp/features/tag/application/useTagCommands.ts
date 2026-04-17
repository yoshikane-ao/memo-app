import type { CommandResult } from "../../../../../shared/command/commandResult";
import { toValueCommandResult, toVoidCommandResult } from "../../../../../shared/command/commandResult";
import type { UndoableAction } from "../../../../../shared/history/history.types";
import { useHistoryManager } from "../../../../../shared/history/useHistoryManager";
import { useMemoStore } from "../../memo";
import {
  createTag as createTagRequest,
  deleteTag as deleteTagRequest,
  linkTagToMemo as linkTagToMemoRequest,
  restoreTag as restoreTagRequest,
  unlinkTagFromMemo as unlinkTagFromMemoRequest,
} from "../infrastructure/tag.repository";
import type { CreateTagInput, RestoreTagInput, TagItem } from "../types";
import { useTagStore } from "../model/useTagStore";

const cloneTag = (tag: TagItem): TagItem => ({
  ...tag,
});

const toUniqueTags = (tags: readonly TagItem[]): TagItem[] => {
  const seenTagIds = new Set<number>();
  const nextTags: TagItem[] = [];

  for (const tag of tags) {
    if (seenTagIds.has(tag.id)) {
      continue;
    }

    seenTagIds.add(tag.id);
    nextTags.push(cloneTag(tag));
  }

  return nextTags;
};

export const useTagCommands = () => {
  const memoStore = useMemoStore();
  const tagStore = useTagStore();
  const history = useHistoryManager();

  const getMemoById = (memoId: number) => memoStore.findMemoById(memoId);

  const getMemoTags = (memoId: number) =>
    getMemoById(memoId)?.memo_tags.map((memoTag) => cloneTag(memoTag.tag)) ?? [];

  const syncMemoTagSet = async (memoId: number, fromTags: TagItem[], toTags: TagItem[]) => {
    const fromTagIds = new Set(fromTags.map((tag) => tag.id));
    const toTagIds = new Set(toTags.map((tag) => tag.id));
    const tagsToRemove = fromTags.filter((tag) => !toTagIds.has(tag.id));
    const tagsToAdd = toTags.filter((tag) => !fromTagIds.has(tag.id));
    const removedTagIds: number[] = [];
    const addedTagIds: number[] = [];

    try {
      for (const tag of tagsToRemove) {
        await unlinkTagFromMemoRequest(memoId, tag.id);
        removedTagIds.push(tag.id);
      }

      for (const tag of tagsToAdd) {
        await linkTagToMemoRequest(memoId, tag.id);
        addedTagIds.push(tag.id);
      }
    } catch (error) {
      for (const tagId of [...addedTagIds].reverse()) {
        try {
          await unlinkTagFromMemoRequest(memoId, tagId);
        } catch {
          // Best effort rollback for partially-applied tag replacements.
        }
      }

      for (const tagId of [...removedTagIds].reverse()) {
        try {
          await linkTagToMemoRequest(memoId, tagId);
        } catch {
          // Best effort rollback for partially-applied tag replacements.
        }
      }

      throw error;
    }

    memoStore.replaceMemoTags(memoId, toTags);
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
        ? [...previousTags, cloneTag(tag)]
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

    return toVoidCommandResult(await history.execute(action));
  };

  const addTagToMemo = (memoId: number, tag: TagItem) => changeMemoTag(memoId, tag, "add");

  const removeTagFromMemo = (memoId: number, tag: TagItem) =>
    changeMemoTag(memoId, tag, "remove");

  const replaceMemoTags = async (memoId: number, tags: TagItem[]): Promise<CommandResult<void>> => {
    const currentMemo = getMemoById(memoId);
    if (!currentMemo) {
      return {
        ok: false,
        reason: "error",
      };
    }

    const previousTags = getMemoTags(memoId);
    const nextTags = toUniqueTags(tags);
    const hasSameTags =
      previousTags.length === nextTags.length &&
      previousTags.every((tag) => nextTags.some((nextTag) => nextTag.id === tag.id));

    if (hasSameTags) {
      return {
        ok: true,
        value: undefined,
      };
    }

    const action: UndoableAction = {
      label: "Replace memo tags",
      async do() {
        await syncMemoTagSet(memoId, previousTags, nextTags);
      },
      async undo() {
        await syncMemoTagSet(memoId, nextTags, previousTags);
      },
      async redo() {
        await syncMemoTagSet(memoId, previousTags, nextTags);
      },
    };

    return toVoidCommandResult(await history.execute(action));
  };

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
          memoStore.addLocalTagToMemo(input.memoId, createdTag);
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
          memoStore.addLocalTagToMemo(memoId, restoredTag);
        }
      },
    };

    return toValueCommandResult<TagItem>(await history.execute(action), createdTag);
  };

  const deleteTag = async (tagId: number): Promise<CommandResult<void>> => {
    const currentTag = tagStore.items.find((tag) => tag.id === tagId);
    if (!currentTag) {
      return {
        ok: false,
        reason: "error",
      };
    }

    const affectedMemoTags = memoStore.allItems
      .filter((memo) => memo.memo_tags.some((memoTag) => memoTag.tag.id === tagId))
      .map((memo) => ({
        memoId: memo.id,
        tags: memo.memo_tags.map((memoTag) => cloneTag(memoTag.tag)),
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
            memo.tags.map((tag) => (tag.id === tagSnapshot.id ? cloneTag(restoredTag) : tag))
          );
        }
      },
      async redo() {
        await deleteTagRequest(tagSnapshot.id);
        tagStore.removeLocalTag(tagSnapshot.id);
        memoStore.removeDeletedTagReference(tagSnapshot.id);
      },
    };

    return toVoidCommandResult(await history.execute(action));
  };

  return {
    addTagToMemo,
    removeTagFromMemo,
    replaceMemoTags,
    createTag,
    deleteTag,
  };
};
