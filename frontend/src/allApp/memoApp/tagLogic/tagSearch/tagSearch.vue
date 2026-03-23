<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useTagCatalog } from '../tagCatalog/tagCatalog';
import { useTagDelete } from '../tagDelete/tagDelete';
import TagRegister from '../tagRegister/tagRegister.vue';
import { useTagRelation } from '../tagRelation/tagRelation';
import type { TagItem } from '../Types';
import { useTagSearch } from './tagSearch';

const props = defineProps<{
  memoId?: number;
  linkedTagIds?: number[];
}>();

const emit = defineEmits(['close', 'tag-added', 'tag-removed', 'tag-deleted']);

const { searchQuery, filteredTags, hasExactMatch, fetchAllTags } = useTagSearch();
const { linkTagToMemo, unlinkTagFromMemo } = useTagRelation();
const { removeTag } = useTagCatalog();
const { executeDelete } = useTagDelete();
const modalRef = ref<HTMLElement | null>(null);

const isLinked = (tagId: number) => {
  return (props.linkedTagIds ?? []).includes(tagId);
};

const toggleTag = async (tag: TagItem) => {
  const linked = isLinked(tag.id);

  if (!props.memoId) {
    emit(linked ? 'tag-removed' : 'tag-added', tag);
    return;
  }

  const success = linked
    ? await unlinkTagFromMemo(props.memoId, tag.id)
    : await linkTagToMemo(props.memoId, tag.id);

  if (!success) {
    alert(linked ? 'Failed to remove tag.' : 'Failed to add tag.');
    return;
  }

  emit(linked ? 'tag-removed' : 'tag-added', tag);
};

const deleteTagFromSystem = async (tag: TagItem) => {
  const confirmed = confirm(`Delete #${tag.title} from the system?`);

  if (!confirmed) {
    return;
  }

  const success = await executeDelete(tag.id);

  if (!success) {
    alert('Failed to delete tag.');
    return;
  }

  removeTag(tag.id);
  emit('tag-deleted', tag);
};

const handleTagRegistered = async (newTag: TagItem) => {
  emit('tag-added', newTag);
  searchQuery.value = '';
  await fetchAllTags();
};

const onClickOutside = (event: MouseEvent) => {
  if (modalRef.value && !modalRef.value.contains(event.target as Node)) {
    emit('close');
  }
};

onMounted(() => {
  void fetchAllTags();

  setTimeout(() => {
    document.addEventListener('click', onClickOutside, true);
  }, 100);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside, true);
});
</script>

<template>
  <div ref="modalRef" class="tag-popup">
    <input
      v-model="searchQuery"
      type="text"
      placeholder="Search tags..."
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
          @click.prevent.stop="deleteTagFromSystem(tag)"
        >
          x
        </button>
      </div>
    </div>

    <TagRegister
      v-if="!hasExactMatch && searchQuery.trim() !== ''"
      :memoId="memoId"
      :inputTitle="searchQuery"
      @tag-registered="handleTagRegistered"
    />

    <button type="button" class="tag-popup-close-btn" @click="emit('close')">Close</button>
  </div>
</template>
