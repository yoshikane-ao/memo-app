<script setup>
/**
 * TagBadgeList - タグバッジの表示・削除を行う共通コンポーネント
 * メモ一覧とメモ新規作成の両方で使い回す
 */
defineProps({
  tags: { type: Array, required: true },  // { id, title } の配列
  removable: { type: Boolean, default: true }
});

const emit = defineEmits(['remove']);
</script>

<template>
  <template v-for="(tag, index) in tags" :key="tag.id || tag.title">
    <span class="tag-chip">
      #{{ tag.title }}
      <button 
        v-if="removable" 
        class="tag-remove-btn" 
        @click.prevent.stop="emit('remove', tag, index)"
        title="タグを外す"
      >×</button>
    </span>
  </template>
</template>
