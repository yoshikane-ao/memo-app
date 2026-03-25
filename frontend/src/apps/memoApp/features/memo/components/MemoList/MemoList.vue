<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import MemoCard from "./MemoCard.vue";
import type { MemoListEmits, MemoListProps } from "./types";

const props = defineProps<MemoListProps>();
const emit = defineEmits<MemoListEmits>();

const listRef = ref<HTMLElement | null>(null);
const dragIndex = ref<number | null>(null);
const keyboardReorderMemoId = ref<number | null>(null);
const keyboardSnapshot = ref<MemoListProps["items"]>([]);
const orderedItems = ref([...props.items]);

const hasSameOrder = (left: MemoListProps["items"], right: MemoListProps["items"]) =>
  left.length === right.length && left.every((memo, index) => memo.id === right[index]?.id);

const resetKeyboardReorder = () => {
  keyboardReorderMemoId.value = null;
  keyboardSnapshot.value = [];
};

const focusHandleByMemoId = async (memoId: number) => {
  await nextTick();

  const nextHandle = listRef.value?.querySelector<HTMLButtonElement>(
    `[data-reorder-handle-id="${memoId}"]`
  );
  nextHandle?.focus();
};

watch(
  () => props.items,
  (items) => {
    orderedItems.value = [...items];
    resetKeyboardReorder();
  },
  { immediate: true, deep: true }
);

const onDragStart = (event: DragEvent, index: number) => {
  if (!props.canReorder) {
    return;
  }

  resetKeyboardReorder();
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

  const nextItems = [...orderedItems.value];
  if (!hasSameOrder(props.items, nextItems)) {
    emit("reorder-requested", nextItems);
  }

  dragIndex.value = null;
};

const onDragOver = (event: DragEvent) => {
  if (!props.canReorder) {
    return;
  }

  event.preventDefault();
};

const beginKeyboardReorder = (memoId: number) => {
  keyboardSnapshot.value = [...orderedItems.value];
  keyboardReorderMemoId.value = memoId;
};

const commitKeyboardReorder = () => {
  const memoId = keyboardReorderMemoId.value;
  if (memoId == null) {
    return;
  }

  const nextItems = [...orderedItems.value];
  const hasChanged = !hasSameOrder(keyboardSnapshot.value, nextItems);
  resetKeyboardReorder();

  if (hasChanged) {
    emit("reorder-requested", nextItems);
  }

  void focusHandleByMemoId(memoId);
};

const cancelKeyboardReorder = () => {
  const memoId = keyboardReorderMemoId.value;
  if (memoId == null) {
    return;
  }

  orderedItems.value = [...keyboardSnapshot.value];
  resetKeyboardReorder();
  void focusHandleByMemoId(memoId);
};

const moveKeyboardReorderedMemo = (direction: -1 | 1) => {
  const memoId = keyboardReorderMemoId.value;
  if (memoId == null) {
    return;
  }

  const currentIndex = orderedItems.value.findIndex((memo) => memo.id === memoId);
  const nextIndex = currentIndex + direction;
  if (currentIndex === -1 || nextIndex < 0 || nextIndex >= orderedItems.value.length) {
    return;
  }

  const nextItems = [...orderedItems.value];
  const [movedMemo] = nextItems.splice(currentIndex, 1);
  nextItems.splice(nextIndex, 0, movedMemo);
  orderedItems.value = nextItems;
  void focusHandleByMemoId(memoId);
};

const getHandleTitle = (memoId: number) =>
  keyboardReorderMemoId.value === memoId
    ? "Use Arrow Up or Arrow Down to move. Press Enter to save or Escape to cancel."
    : "Drag to reorder. Press Enter to start keyboard reordering.";

const handleReorderKeydown = (event: KeyboardEvent, memoId: number) => {
  if (!props.canReorder) {
    return;
  }

  if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return;
  }

  if (event.key === "Escape") {
    if (keyboardReorderMemoId.value == null) {
      return;
    }

    event.preventDefault();
    cancelKeyboardReorder();
    return;
  }

  if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
    event.preventDefault();

    if (keyboardReorderMemoId.value === memoId) {
      commitKeyboardReorder();
      return;
    }

    if (keyboardReorderMemoId.value == null) {
      beginKeyboardReorder(memoId);
    }

    return;
  }

  if (keyboardReorderMemoId.value !== memoId) {
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    moveKeyboardReorderedMemo(-1);
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    moveKeyboardReorderedMemo(1);
  }
};
</script>

<template>
  <div ref="listRef" class="memo-container">
    <div v-if="orderedItems.length === 0" class="memo-empty">
      No memos found.
    </div>

    <div class="sortable-list" @dragover.prevent="onDragOver" @drop="onDrop">
      <div
        v-for="(memo, index) in orderedItems"
        :key="memo.id"
        class="sortable-item"
        :class="{
          dragging: dragIndex === index,
          'is-keyboard-reordering': keyboardReorderMemoId === memo.id,
        }"
        @dragenter="onDragEnter($event, index)"
        @dragover="onDragOver"
      >
        <button
          v-if="canReorder"
          :data-reorder-handle-id="memo.id"
          type="button"
          class="drag-handle"
          :class="{ 'is-keyboard-reordering': keyboardReorderMemoId === memo.id }"
          draggable="true"
          :title="getHandleTitle(memo.id)"
          :aria-label="getHandleTitle(memo.id)"
          @dragstart="onDragStart($event, index)"
          @keydown="handleReorderKeydown($event, memo.id)"
        >
          ||
        </button>

        <div class="item-content">
          <MemoCard
            :memo="memo"
            @save-requested="emit('save-requested', $event)"
            @trash-requested="emit('trash-requested', $event)"
            @memo-tags-updated="emit('memo-tags-updated', $event)"
            @tag-deleted="emit('tag-deleted', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
