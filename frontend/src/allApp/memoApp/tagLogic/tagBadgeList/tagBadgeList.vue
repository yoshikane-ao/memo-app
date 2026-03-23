<script setup lang="ts">
import type { TagItem } from '../Types';

defineProps<{
  tags: TagItem[];
  removable?: boolean;
}>();

const emit = defineEmits(['remove']);
</script>

<template>
  <template v-for="(tag, index) in tags" :key="tag.id || tag.title">
    <span class="tag-chip">
      #{{ tag.title }}
      <button
        v-if="removable ?? true"
        class="tag-remove-btn"
        title="タグを外す"
        @click.prevent.stop="emit('remove', tag, index)"
      >
        ×
      </button>
    </span>
  </template>
</template>
