<script setup lang="ts">
import { ref, watch } from "vue";
import MemoCard from "./MemoCard.vue";
import type { MemoListEmits, MemoListProps } from "./types";

const props = defineProps<MemoListProps>();
const emit = defineEmits<MemoListEmits>();

const dragIndex = ref<number | null>(null);
const orderedItems = ref([...props.items]);

watch(
  () => props.items,
  (items) => {
    orderedItems.value = [...items];
  },
  { immediate: true, deep: true }
);

const onDragStart = (event: DragEvent, index: number) => {
  if (!props.canReorder) {
    return;
  }

  dragIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", index.toString());
  }
};

const onDragEnter = (event: DragEvent, index: number) => {
  if (!props.canReorder) {
    return;
  }

  event.preventDefault();
  if (dragIndex.value === null || dragIndex.value === index) {
    return;
  }

  const nextItems = [...orderedItems.value];
  const [movedItem] = nextItems.splice(dragIndex.value, 1);
  nextItems.splice(index, 0, movedItem);
  orderedItems.value = nextItems;
  dragIndex.value = index;
};

const onDrop = (event: DragEvent) => {
  event.preventDefault();
  if (!props.canReorder || dragIndex.value === null) {
    dragIndex.value = null;
    return;
  }

  emit("reorder-requested", [...orderedItems.value]);
  dragIndex.value = null;
};

const onDragOver = (event: DragEvent) => {
  if (!props.canReorder) {
    return;
  }

  event.preventDefault();
};
</script>

<template>
  <div class="memo-container">
    <div v-if="orderedItems.length === 0" class="memo-empty">
      No memos found.
    </div>

    <div class="sortable-list" @dragover.prevent="onDragOver" @drop="onDrop">
      <div
        v-for="(memo, index) in orderedItems"
        :key="memo.id"
        class="sortable-item"
        :class="{ dragging: dragIndex === index }"
        @dragenter="onDragEnter($event, index)"
        @dragover="onDragOver"
      >
        <div
          v-if="canReorder"
          class="drag-handle"
          draggable="true"
          title="Drag to reorder"
          @dragstart="onDragStart($event, index)"
        >
          ||
        </div>

        <div class="item-content">
          <MemoCard
            :memo="memo"
            @save-requested="emit('save-requested', $event)"
            @delete-requested="emit('delete-requested', $event)"
            @memo-tags-updated="emit('memo-tags-updated', $event)"
            @tag-deleted="emit('tag-deleted', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
