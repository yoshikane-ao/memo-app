<script setup lang="ts">
import { ref } from 'vue';
import { saveSortOrder } from './memoSort';
import type { MemoSortEmits, MemoSortProps } from '../Types';

const props = defineProps<MemoSortProps>();
const emit = defineEmits<MemoSortEmits>();

const dragIndex = ref<number | null>(null);

const onDragStart = (e: DragEvent, index: number) => {
  dragIndex.value = index;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }
};

const onDragEnter = (e: DragEvent, index: number) => {
  e.preventDefault();
  if (dragIndex.value !== null && dragIndex.value !== index) {
    const newItems = [...props.items];
    const [movedItem] = newItems.splice(dragIndex.value, 1);
    newItems.splice(index, 0, movedItem);
    dragIndex.value = index;
    emit('update:items', newItems);
  }
};

const onDragOver = (e: DragEvent) => {
  e.preventDefault();
};

const onDrop = async (e: DragEvent) => {
  e.preventDefault();
  dragIndex.value = null;

  const isSaved = await saveSortOrder(props.items);
  if (!isSaved) {
    alert('Failed to save sort order.');
    return;
  }

  emit('sorted');
};
</script>

<template>
  <div class="sortable-list" @dragover.prevent @drop="onDrop">
    <div
      v-for="(item, index) in items"
      :key="item.id || index"
      class="sortable-item"
      :class="{ dragging: dragIndex === index }"
      @dragenter="onDragEnter($event, index)"
      @dragover="onDragOver"
    >
      <div
        v-if="!disabled"
        class="drag-handle"
        draggable="true"
        @dragstart="onDragStart($event, index)"
        title="Drag to reorder"
      >
        ||
      </div>
      <div class="item-content">
        <slot :item="item" :index="index"></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sortable-list {
  display: flex;
  flex-direction: column;
}

.sortable-item {
  display: flex;
  align-items: flex-start;
  transition: transform 0.2s;
  margin-bottom: 1rem;
}

.sortable-item.dragging {
  opacity: 0.5;
}

.drag-handle {
  cursor: grab;
  padding: 1rem 0.5rem;
  font-size: 1.5rem;
  color: #aaa;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.drag-handle:active {
  cursor: grabbing;
}

.item-content {
  flex: 1;
  width: 100%;
}
</style>
