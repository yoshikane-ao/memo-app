<script setup lang="ts">
import type { TagItem } from '../Types';

withDefaults(
  defineProps<{
    tags: TagItem[];
    removable?: boolean;
  }>(),
  {
    removable: true
  }
);

const emit = defineEmits<{
  (e: 'remove', tag: TagItem): void;
}>();
</script>

<template>
  <template v-for="tag in tags" :key="tag.id || tag.title">
    <span class="tag-chip">
      #{{ tag.title }}
      <button
        v-if="removable"
        type="button"
        class="tag-remove-btn"
        title="タグを外す"
        aria-label="タグを外す"
        @click.prevent.stop="emit('remove', tag)"
      >&times;</button>
    </span>
  </template>
</template>
