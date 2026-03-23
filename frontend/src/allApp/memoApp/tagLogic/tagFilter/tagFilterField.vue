<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useTagCatalog } from '../tagCatalog/tagCatalog';
import { useTagFilter } from './tagFilter';
import type { TagFilterFieldEmits, TagFilterFieldProps } from '../Types';

const props = defineProps<TagFilterFieldProps>();
const emit = defineEmits<TagFilterFieldEmits>();

const { allTags, fetchAllTags } = useTagCatalog();
const {
  localSelectedTags,
  isDropdownOpen,
  toggleTag,
  replaceSelectedTags
} = useTagFilter(props.selectedTags ?? []);

onMounted(() => {
  void fetchAllTags();
});

watch(
  () => props.selectedTags,
  (value) => {
    replaceSelectedTags(value ?? []);
  }
);

watch(
  localSelectedTags,
  (value) => {
    emit('update:selectedTags', [...value]);
  },
  { deep: true }
);
</script>

<template>
  <div v-if="allTags.length > 0" class="dropdown-container">
    <button class="dropdown-toggle" @click="isDropdownOpen = !isDropdownOpen">
      タグで絞り込む {{ localSelectedTags.length > 0 ? `(${localSelectedTags.length})` : '' }} ▼
    </button>
    <div v-if="isDropdownOpen" class="dropdown-menu">
      <label
        v-for="tag in allTags"
        :key="tag.id"
        class="dropdown-item"
      >
        <input
          type="checkbox"
          :value="tag.id"
          :checked="localSelectedTags.includes(tag.id)"
          @change="toggleTag(tag.id)"
        />
        #{{ tag.title }}
      </label>
    </div>
  </div>
</template>
