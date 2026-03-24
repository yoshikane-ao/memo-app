<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useTagStore } from "../model/useTagStore";
import type { TagItem } from "../model/tag.types";

const props = defineProps<{
  memoId?: number;
  linkedTagIds?: number[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "tag-added", tag: TagItem): void;
  (e: "tag-removed", tag: TagItem): void;
  (e: "tag-deleted", tag: TagItem): void;
}>();

const modalRef = ref<HTMLElement | null>(null);
const searchQuery = ref("");
const tagStore = useTagStore();

const filteredTags = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  if (!query) {
    return tagStore.items;
  }

  return tagStore.items.filter((tag) => tag.title.toLowerCase().includes(query));
});

const hasExactMatch = computed(() =>
  tagStore.items.some((tag) => tag.title === searchQuery.value.trim())
);

const isLinked = (tagId: number) => (props.linkedTagIds ?? []).includes(tagId);

const toggleTag = async (tag: TagItem) => {
  const linked = isLinked(tag.id);

  if (!props.memoId) {
    if (linked) {
      emit("tag-removed", tag);
    } else {
      emit("tag-added", tag);
    }
    return;
  }

  const success = linked
    ? await tagStore.unlinkTagFromMemo(props.memoId, tag.id)
    : await tagStore.linkTagToMemo(props.memoId, tag.id);

  if (!success) {
    window.alert(linked ? "Failed to remove tag." : "Failed to add tag.");
    return;
  }

  if (linked) {
    emit("tag-removed", tag);
  } else {
    emit("tag-added", tag);
  }
};

const handleCreateTag = async () => {
  const title = searchQuery.value.trim();

  if (title === "") {
    return;
  }

  const createdTag = await tagStore.createTag({
    memoId: props.memoId,
    title,
  });

  if (!createdTag) {
    window.alert("Failed to create tag.");
    return;
  }

  emit("tag-added", createdTag);
  searchQuery.value = "";
};

const handleDeleteTag = async (tag: TagItem) => {
  const confirmed = window.confirm(`Delete #${tag.title} from the system?`);

  if (!confirmed) {
    return;
  }

  const success = await tagStore.deleteTag(tag.id);

  if (!success) {
    window.alert("Failed to delete tag.");
    return;
  }

  emit("tag-deleted", tag);
};

const handleClickOutside = (event: MouseEvent) => {
  if (modalRef.value && !modalRef.value.contains(event.target as Node)) {
    emit("close");
  }
};

onMounted(() => {
  void tagStore.ensureLoaded();

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
        :class="{ 'is-selected': isLinked(tag.id) }"
      >
        <button type="button" class="tag-popup-select-btn" @click="toggleTag(tag)">
          <span v-if="isLinked(tag.id)" class="tag-popup-indicator">+</span>
          # {{ tag.title }}
        </button>
        <button
          type="button"
          class="tag-popup-danger-btn"
          title="Delete tag"
          @click.prevent.stop="handleDeleteTag(tag)"
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
