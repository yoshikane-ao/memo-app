<script setup lang="ts">
import { TagRelationEditor } from "../../../tag";
import type { MemoCardTagsEmits, MemoCardTagsProps } from "./types";

defineProps<MemoCardTagsProps>();
const emit = defineEmits<MemoCardTagsEmits>();
</script>

<template>
  <TagRelationEditor
    :memoId="memoId"
    :tags="tags.map(({ tag }) => tag)"
    @memo-tags-updated="emit('memo-tags-updated', $event)"
    @tag-deleted="emit('tag-deleted', $event)"
  />
</template>
