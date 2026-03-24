<script setup lang="ts">
import { useMemoStore } from "../../model/useMemoStore";
import MemoList from "./MemoList.vue";
import type {
  MemoListContainerEmits,
  MemoListContainerProps,
  SaveMemoPayload,
} from "./types";

const props = defineProps<MemoListContainerProps>();
const emit = defineEmits<MemoListContainerEmits>();
const memoStore = useMemoStore();

const handleReorderRequested = async (items: MemoListContainerProps["items"]) => {
  if (!props.canReorder) {
    return;
  }

  const isSaved = await memoStore.reorderMemos(items);
  if (!isSaved) {
    alert("Failed to save sort order.");
  }
};

const handleSaveRequested = async (payload: SaveMemoPayload) => {
  const isSaved = await memoStore.updateMemo({
    id: payload.memoId,
    title: payload.title,
    content: payload.content,
    width: payload.width,
    height: payload.height,
  });

  if (!isSaved) {
    alert("Failed to update memo.");
  }
};

const handleDeleteRequested = async (memoId: number) => {
  const confirmed = confirm("Delete this memo?");
  if (!confirmed) {
    return;
  }

  const isDeleted = await memoStore.deleteMemo(memoId);
  if (!isDeleted) {
    alert("Failed to delete memo.");
  }
};

const handleMemoTagsUpdated = (payload: { memoId: number; tags: { id: number; title: string }[] }) => {
  memoStore.replaceMemoTags(payload.memoId, payload.tags);
};
</script>

<template>
  <MemoList
    :items="items"
    :canReorder="canReorder"
    @reorder-requested="handleReorderRequested"
    @save-requested="handleSaveRequested"
    @delete-requested="handleDeleteRequested"
    @memo-tags-updated="handleMemoTagsUpdated"
    @tag-deleted="emit('tag-deleted', $event)"
  />
</template>
