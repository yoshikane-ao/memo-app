<script setup lang="ts">
import TagRelationField from '../../tagLogic/tagRelation/tagRelationField.vue';
import type { MemoRowTagsEmits, MemoRowTagsProps } from './types';

defineProps<MemoRowTagsProps>();
const emit = defineEmits<MemoRowTagsEmits>();
</script>

<template>
  <TagRelationField
    :memoId="memoId"
    :tags="tags"
    @memo-tags-updated="emit('memo-tags-updated', $event)"
    @tag-deleted="emit('tag-deleted', $event)"
  />
</template>
