<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { getCommandErrorMessage } from "../../../../../../shared/command/commandResult";
import { useFeedbackStore } from "../../../../../../shared/feedback/useFeedbackStore";
import { useTagCommands } from "../../application/useTagCommands";
import TagBadgeList from "../../ui/TagBadgeList.vue";
import TagSearchPopover from "../../ui/TagSearchPopover.vue";
import { useTagStore } from "../../model/useTagStore";
import type { TagFilterSelectEmits, TagFilterSelectProps, TagItem } from "../../types";

const props = withDefaults(defineProps<TagFilterSelectProps>(), {
  selectedTags: () => [],
});
const emit = defineEmits<TagFilterSelectEmits>();

const tagStore = useTagStore();
const commands = useTagCommands();
const feedback = useFeedbackStore();
const localSelectedTags = ref<number[]>([...props.selectedTags]);
const isDropdownOpen = ref(false);
const isCreatingTag = ref(false);
const dropdownContainerRef = ref<HTMLElement | null>(null);

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

const handleToggleTag = (tag: TagItem) => {
  if (localSelectedTags.value.includes(tag.id)) {
    removeTag(tag.id);
    return;
  }

  addTag(tag.id);
};

const handleCreateTag = async (title: string) => {
  if (isCreatingTag.value) {
    return;
  }

  isCreatingTag.value = true;

  try {
    const createdTag = await commands.createTag({ title });

    if (!createdTag.ok) {
      if (createdTag.reason === "error") {
        feedback.showError(getCommandErrorMessage(createdTag, "Failed to create tag."));
      }
      return;
    }

    addTag(createdTag.value.id);
  } finally {
    isCreatingTag.value = false;
  }
};

const handleDeleteTag = async (tag: TagItem) => {
  const confirmed = window.confirm(`Delete #${tag.title} from the system?`);

  if (!confirmed) {
    return;
  }

  const success = await commands.deleteTag(tag.id);

  if (!success.ok) {
    if (success.reason === "error") {
      feedback.showError(getCommandErrorMessage(success, "Failed to delete tag."));
    }
    return;
  }

  removeTag(tag.id);
  emit("tag-deleted", tag.id);
};

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
  <div ref="dropdownContainerRef" class="dropdown-container">
    <div class="tag-filter-trigger-row">
      <button type="button" class="dropdown-toggle" @click="isDropdownOpen = !isDropdownOpen">
        Filter tags {{ localSelectedTags.length > 0 ? `(${localSelectedTags.length})` : "" }}
      </button>

      <div v-if="selectedTagItems.length > 0" class="tag-filter-selected-preview">
        <TagBadgeList :tags="selectedTagItems" @remove="removeTag($event.id)" />
      </div>
    </div>

    <TagSearchPopover
      v-if="isDropdownOpen"
      :tags="tagStore.items"
      :selectedTagIds="localSelectedTags"
      :isCreating="isCreatingTag"
      :boundaryEl="dropdownContainerRef"
      @toggle-tag="handleToggleTag"
      @create-tag="void handleCreateTag($event)"
      @tag-deleted="void handleDeleteTag($event)"
      @close="isDropdownOpen = false"
    />
  </div>
</template>
