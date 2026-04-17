<script setup lang="ts">
import TagBadgeList from "./TagBadgeList.vue";
import type { MemoTagSource } from "../types";

defineProps<{
  memoSources: MemoTagSource[];
}>();

const emit = defineEmits<{
  (e: "apply-tags-from-memo", source: MemoTagSource): void;
}>();

const getTitle = (source: MemoTagSource) => source.title.trim() || "Untitled memo";

const getPreview = (content: string) => {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized === "") {
    return "No content";
  }

  return normalized.length > 96 ? `${normalized.slice(0, 96)}...` : normalized;
};
</script>

<template>
  <div class="memo-source-list">
    <button
      v-for="source in memoSources"
      :key="source.memoId"
      type="button"
      class="memo-source-item"
      @click="emit('apply-tags-from-memo', source)"
    >
      <span class="memo-source-title">{{ getTitle(source) }}</span>
      <span class="memo-source-preview">{{ getPreview(source.content) }}</span>
      <span v-if="source.tags.length === 0" class="memo-source-empty-tags">No tags</span>
      <span v-else class="memo-source-tags">
        <TagBadgeList :tags="source.tags" :removable="false" />
      </span>
    </button>

    <div v-if="memoSources.length === 0" class="memo-source-empty">
      No other memos are available.
    </div>
  </div>
</template>
