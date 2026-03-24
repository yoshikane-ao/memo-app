<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import TagBadgeList from "../TagBadgeList.vue";
import TagSearchPopover from "../TagSearchPopover.vue";
import { useTagStore } from "../../model/useTagStore";
import type { TagFilterSelectEmits, TagFilterSelectProps, TagItem } from "../../model/tag.types";

const props = withDefaults(defineProps<TagFilterSelectProps>(), {
  selectedTags: () => [],
});
const emit = defineEmits<TagFilterSelectEmits>();

const tagStore = useTagStore();
const localSelectedTags = ref<number[]>([...props.selectedTags]);
const isDropdownOpen = ref(false);

const isSameTagIdList = (left: number[], right: number[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const selectedTagItems = computed<TagItem[]>(() =>
  localSelectedTags.value
    .map((tagId) => tagStore.items.find((tag) => tag.id === tagId))
    .filter((tag): tag is TagItem => Boolean(tag))
);

const addTag = (tagId: number) => {
  if (!localSelectedTags.value.includes(tagId)) {
    localSelectedTags.value = [...localSelectedTags.value, tagId];
  }
};

const removeTag = (tagId: number) => {
  localSelectedTags.value = localSelectedTags.value.filter((currentTagId) => currentTagId !== tagId);
};

onMounted(() => {
  void tagStore.ensureLoaded();
});

watch(
  () => props.selectedTags,
  (value) => {
    if (!isSameTagIdList(localSelectedTags.value, value)) {
      localSelectedTags.value = [...value];
    }
  }
);

watch(
  () => tagStore.items,
  (tags) => {
    const validTagIds = tags.map((tag) => tag.id);
    localSelectedTags.value = localSelectedTags.value.filter((tagId) => validTagIds.includes(tagId));
  },
  { deep: true }
);

watch(
  localSelectedTags,
  (value) => {
    if (!isSameTagIdList(value, props.selectedTags)) {
      emit("update:selectedTags", [...value]);
    }
  },
  { deep: true }
);
</script>

<template>
  <div class="dropdown-container">
    <div class="tag-filter-trigger-row">
      <button type="button" class="dropdown-toggle" @click="isDropdownOpen = !isDropdownOpen">
        Filter tags {{ localSelectedTags.length > 0 ? `(${localSelectedTags.length})` : "" }}
      </button>

      <div v-if="selectedTagItems.length > 0" class="tag-filter-selected-preview">
        <TagBadgeList :tags="selectedTagItems" :removable="false" />
      </div>
    </div>

    <TagSearchPopover
      v-if="isDropdownOpen"
      :linkedTagIds="localSelectedTags"
      @tag-added="addTag($event.id)"
      @tag-removed="removeTag($event.id)"
      @tag-deleted="
        removeTag($event.id);
        emit('tag-deleted', $event.id);
      "
      @close="isDropdownOpen = false"
    />
  </div>
</template>
