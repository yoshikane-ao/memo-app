<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { TagItem } from "../model/tag.types";

const props = defineProps<{
  tags: TagItem[];
  selectedTagIds?: number[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "toggle-tag", tag: TagItem): void;
  (e: "create-tag", title: string): void;
  (e: "tag-deleted", tag: TagItem): void;
}>();

const modalRef = ref<HTMLElement | null>(null);
const searchQuery = ref("");

const filteredTags = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  if (!query) {
    return props.tags;
  }

  return props.tags.filter((tag) => tag.title.toLowerCase().includes(query));
});

const hasExactMatch = computed(() =>
  props.tags.some((tag) => tag.title === searchQuery.value.trim())
);

const isSelected = (tagId: number) => (props.selectedTagIds ?? []).includes(tagId);

const handleCreateTag = () => {
  const title = searchQuery.value.trim();

  if (title === "") {
    return;
  }

  emit("create-tag", title);
  searchQuery.value = "";
};

const handleClickOutside = (event: MouseEvent) => {
  if (modalRef.value && !modalRef.value.contains(event.target as Node)) {
    emit("close");
  }
};

onMounted(() => {
  setTimeout(() => {
    document.addEventListener("click", handleClickOutside, true);
  }, 100);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside, true);
});
</script>

<template>
  <div ref="modalRef" class="tag-popup">
    <input
      v-model="searchQuery"
      type="text"
      placeholder="Search tags"
      class="tag-popup-input"
    />

    <div class="tag-popup-list">
      <div
        v-for="tag in filteredTags"
        :key="tag.id"
        class="tag-popup-item"
        :class="{ 'is-selected': isSelected(tag.id) }"
      >
        <button type="button" class="tag-popup-select-btn" @click="emit('toggle-tag', tag)">
          <span v-if="isSelected(tag.id)" class="tag-popup-indicator">+</span>
          # {{ tag.title }}
        </button>
        <button
          type="button"
          class="tag-popup-danger-btn"
          title="Delete tag"
          @click.prevent.stop="emit('tag-deleted', tag)"
        >
          x
        </button>
      </div>
    </div>

    <div v-if="!hasExactMatch && searchQuery.trim() !== ''" class="tag-register-container">
      <button type="button" class="add-tag-button" @click="handleCreateTag">
        <span class="plus-icon">+</span>
        Create #{{ searchQuery.trim() }}
      </button>
    </div>

    <button type="button" class="tag-popup-close-btn" @click="emit('close')">Close</button>
  </div>
</template>
