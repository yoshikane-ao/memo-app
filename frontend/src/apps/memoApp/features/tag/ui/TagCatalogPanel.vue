<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, ref } from "vue";
import type { TagItem } from "../types";
import { useListboxNavigation } from "../../../../../shared/keyboard/useListboxNavigation";

const props = defineProps<{
  tags: TagItem[];
  selectedTagIds?: number[];
  isCreating?: boolean;
}>();

const emit = defineEmits<{
  (e: "toggle-tag", tag: TagItem): void;
  (e: "create-tag", title: string): void;
  (e: "tag-deleted", tag: TagItem): void;
}>();

const instanceId = getCurrentInstance()?.uid ?? 0;
const searchQuery = ref("");
const activeAction = ref<"select" | "delete">("select");
const trimmedQuery = computed(() => searchQuery.value.trim());

const filteredTags = computed(() => {
  const query = trimmedQuery.value.toLowerCase();

  if (!query) {
    return props.tags;
  }

  return props.tags.filter((tag) => tag.title.toLowerCase().includes(query));
});

const hasExactMatch = computed(() =>
  props.tags.some((tag) => tag.title === trimmedQuery.value)
);
const showCreateButton = computed(() => trimmedQuery.value !== "" && !hasExactMatch.value);
const canCreateTag = computed(() => showCreateButton.value && !props.isCreating);

const isSelected = (tagId: number) => (props.selectedTagIds ?? []).includes(tagId);
const getRowId = (tagId: number) => `tag-popup-option-${instanceId}-${tagId}`;
const getSelectButtonId = (tagId: number) => `tag-popup-option-${instanceId}-${tagId}-select`;
const getDeleteButtonId = (tagId: number) => `tag-popup-option-${instanceId}-${tagId}-delete`;

const getPreferredActiveId = () => {
  for (const tagId of props.selectedTagIds ?? []) {
    if (filteredTags.value.some((tag) => tag.id === tagId)) {
      return tagId;
    }
  }

  return null;
};

const {
  activeId: activeTagId,
  activeOption,
  moveFirst,
  moveLast,
  moveNext,
  movePrevious,
  setActiveId,
} = useListboxNavigation(filteredTags, getPreferredActiveId);

const scrollActiveTagIntoView = () => {
  if (typeof document === "undefined" || activeTagId.value == null) {
    return;
  }

  const activeElement = document.getElementById(getRowId(activeTagId.value));
  if (activeElement instanceof HTMLElement && typeof activeElement.scrollIntoView === "function") {
    activeElement.scrollIntoView({ block: "nearest" });
  }
};

const getButtonId = (tagId: number, action: "select" | "delete") =>
  action === "select" ? getSelectButtonId(tagId) : getDeleteButtonId(tagId);

const focusActionButton = async (tag: TagItem | null, action: "select" | "delete") => {
  if (!tag) {
    return;
  }

  setActiveId(tag.id);
  activeAction.value = action;
  await nextTick();

  if (typeof document !== "undefined") {
    const nextButton = document.getElementById(getButtonId(tag.id, action));
    if (nextButton instanceof HTMLElement) {
      nextButton.focus();
    }
  }

  scrollActiveTagIntoView();
};

const moveVertical = async (
  direction: "next" | "previous" | "first" | "last",
  action: "select" | "delete",
  shouldSelectCurrent = false
) => {
  const currentTag = activeOption.value;
  const nextTag =
    direction === "next"
      ? moveNext()
      : direction === "previous"
        ? movePrevious()
        : direction === "first"
          ? moveFirst()
          : moveLast();

  if (!nextTag) {
    return;
  }

  if (shouldSelectCurrent) {
    const selectionTarget = currentTag ?? nextTag;
    if (!isSelected(selectionTarget.id)) {
      emit("toggle-tag", selectionTarget);
    }
  }

  await focusActionButton(nextTag, action);
};

const handleSearchKeydown = (event: KeyboardEvent) => {
  if (event.isComposing) {
    return;
  }

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      void moveVertical("next", "select", event.shiftKey);
      break;
    case "ArrowUp":
      event.preventDefault();
      void moveVertical("previous", "select", event.shiftKey);
      break;
    case "Home":
      event.preventDefault();
      void moveVertical("first", "select", event.shiftKey);
      break;
    case "End":
      event.preventDefault();
      void moveVertical("last", "select", event.shiftKey);
      break;
    default:
      break;
  }
};

const executeAction = (tag: TagItem, action: "select" | "delete") => {
  if (action === "select") {
    emit("toggle-tag", tag);
    return;
  }

  emit("tag-deleted", tag);
};

const handleButtonKeydown = (event: KeyboardEvent, tag: TagItem, action: "select" | "delete") => {
  if (event.isComposing) {
    return;
  }

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      void moveVertical("next", "select", event.shiftKey);
      break;
    case "ArrowUp":
      event.preventDefault();
      void moveVertical("previous", "select", event.shiftKey);
      break;
    case "Home":
      event.preventDefault();
      void moveVertical("first", "select", event.shiftKey);
      break;
    case "End":
      event.preventDefault();
      void moveVertical("last", "select", event.shiftKey);
      break;
    case "ArrowRight":
      if (action === "select") {
        event.preventDefault();
        void focusActionButton(tag, "delete");
      }
      break;
    case "ArrowLeft":
      if (action === "delete") {
        event.preventDefault();
        void focusActionButton(tag, "select");
      }
      break;
    case "Enter":
      if (!event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        executeAction(tag, action);
      }
      break;
    default:
      break;
  }
};

const setActiveControl = (tagId: number, action: "select" | "delete") => {
  setActiveId(tagId);
  activeAction.value = action;
};

const handleTagClick = (tag: TagItem) => {
  setActiveControl(tag.id, "select");
  emit("toggle-tag", tag);
};

const handleDeleteClick = (tag: TagItem) => {
  setActiveControl(tag.id, "delete");
  emit("tag-deleted", tag);
};

const requestCreateTag = () => {
  if (!canCreateTag.value) {
    return;
  }

  emit("create-tag", trimmedQuery.value);
  searchQuery.value = "";
};
</script>

<template>
  <div class="tag-catalog-panel">
    <input
      v-model="searchQuery"
      type="text"
      placeholder="Search tags"
      class="tag-popup-input"
      data-tag-popover-autofocus
      @keydown="handleSearchKeydown"
    />

    <div class="tag-popup-list">
      <div
        v-for="tag in filteredTags"
        :id="getRowId(tag.id)"
        :key="tag.id"
        class="tag-popup-item"
        :class="{ 'is-selected': isSelected(tag.id), 'is-active': activeTagId === tag.id }"
        @mouseenter="setActiveControl(tag.id, 'select')"
      >
        <button
          :id="getSelectButtonId(tag.id)"
          type="button"
          class="tag-popup-select-btn"
          :class="{ 'is-active-control': activeTagId === tag.id && activeAction === 'select' }"
          :tabindex="activeTagId === tag.id && activeAction === 'select' ? 0 : -1"
          :aria-pressed="isSelected(tag.id)"
          @focus="setActiveControl(tag.id, 'select')"
          @keydown="handleButtonKeydown($event, tag, 'select')"
          @click="handleTagClick(tag)"
        >
          <span v-if="isSelected(tag.id)" class="tag-popup-indicator">+</span>
          # {{ tag.title }}
        </button>
        <button
          :id="getDeleteButtonId(tag.id)"
          type="button"
          class="tag-popup-danger-btn"
          :class="{ 'is-active-control': activeTagId === tag.id && activeAction === 'delete' }"
          :tabindex="activeTagId === tag.id && activeAction === 'delete' ? 0 : -1"
          title="Delete tag"
          @focus="setActiveControl(tag.id, 'delete')"
          @keydown="handleButtonKeydown($event, tag, 'delete')"
          @click.prevent.stop="handleDeleteClick(tag)"
        >
          x
        </button>
      </div>
    </div>

    <div v-if="showCreateButton" class="tag-register-container">
      <button
        type="button"
        class="add-tag-button"
        :disabled="!canCreateTag"
        @click="requestCreateTag"
      >
        <span class="plus-icon">+</span>
        {{ props.isCreating ? "Creating..." : `Create #${trimmedQuery}` }}
      </button>
    </div>
  </div>
</template>
