<script setup lang="ts">
import { computed, ref, watch } from "vue";
import TagBadgeList from "../TagBadgeList.vue";
import TagSearchPopover from "../TagSearchPopover.vue";
import type { TagPickerFieldEmits, TagPickerFieldProps } from "../../model/tag.types";

const props = withDefaults(defineProps<TagPickerFieldProps>(), {
  resetKey: 0,
});
const emit = defineEmits<TagPickerFieldEmits>();

const showTagSearch = ref(false);
const dropdownWrapperRef = ref<HTMLElement | null>(null);

const selectedTagIds = computed(() => props.selectedTags.map((tag) => tag.id));

const closeTagSearch = () => {
  showTagSearch.value = false;
};

watch(
  () => props.resetKey,
  () => {
    showTagSearch.value = false;
  }
);
</script>

<template>
  <div class="tag-selection-field">
    <div ref="dropdownWrapperRef" class="tag-dropdown-wrapper">
      <button class="tag-add-btn" title="Add tag" @click.stop="showTagSearch = !showTagSearch">
        + Tag
      </button>

      <TagSearchPopover
        v-if="showTagSearch"
        :tags="availableTags"
        :selectedTagIds="selectedTagIds"
        :memoSources="memoSources"
        :isCreating="isCreating"
        :boundaryEl="dropdownWrapperRef"
        @toggle-tag="emit('toggle-tag', $event)"
        @create-tag="emit('create-tag', $event)"
        @delete-tag="emit('delete-tag', $event)"
        @apply-tags-from-memo="
          emit('apply-tags-from-memo', $event);
          closeTagSearch();
        "
        @close="closeTagSearch"
      />
    </div>

    <div v-if="selectedTags.length > 0" class="selected-tags-preview">
      <TagBadgeList :tags="selectedTags" @remove="emit('remove-tag', $event)" />
    </div>
  </div>
</template>
