<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useTagCatalog } from '../tagCatalog/tagCatalog';
import TagSearch from '../tagSearch/tagSearch.vue';
import TagBadgeList from '../tagBadgeList/tagBadgeList.vue';
import { useTagRelation } from './tagRelation';
import type { TagItem, TagRelationFieldEmits, TagRelationFieldProps } from '../Types';

const props = defineProps<TagRelationFieldProps>();
const emit = defineEmits<TagRelationFieldEmits>();

const { unlinkTagFromMemo } = useTagRelation();
const { allTags } = useTagCatalog();
const showTagSearch = ref(false);
const localTags = ref<TagItem[]>([...props.tags]);

const linkedTagIds = computed(() => localTags.value.map((tag) => tag.id));

const notifyChanged = () => {
  emit('changed');
};

const syncLocalTags = (tags: TagItem[]) => {
  localTags.value = [...tags];
};

const addLocalTag = (tag: TagItem) => {
  if (!localTags.value.find((currentTag) => currentTag.id === tag.id)) {
    localTags.value = [...localTags.value, tag];
  }
};

const removeLocalTag = (tag: TagItem) => {
  localTags.value = localTags.value.filter((currentTag) => currentTag.id !== tag.id);
};

const handleTagRemove = async (tag: TagItem) => {
  const success = await unlinkTagFromMemo(props.memoId, tag.id);

  if (success) {
    removeLocalTag(tag);
    notifyChanged();
    return;
  }

  alert('タグの解除に失敗しました。');
};

const handleTagAdded = (tag: TagItem) => {
  addLocalTag(tag);
  notifyChanged();
};

const handleTagRemoved = (tag: TagItem) => {
  removeLocalTag(tag);
  notifyChanged();
};

watch(
  () => props.tags,
  (value) => {
    syncLocalTags(value);
  },
  { deep: true }
);

watch(
  allTags,
  (tags) => {
    const validTagIds = tags.map((tag) => tag.id);
    const nextTags = localTags.value.filter((tag) => validTagIds.includes(tag.id));

    if (nextTags.length !== localTags.value.length) {
      localTags.value = nextTags;
      notifyChanged();
    }
  },
  { deep: true }
);
</script>

<template>
  <div class="tag-row">
    <TagBadgeList
      :tags="localTags"
      @remove="handleTagRemove"
    />

    <button class="tag-add-btn" @click.stop="showTagSearch = !showTagSearch">
      + タグ
    </button>

    <TagSearch
      v-if="showTagSearch"
      :memoId="memoId"
      :linkedTagIds="linkedTagIds"
      @tag-added="handleTagAdded"
      @tag-removed="handleTagRemoved"
      @tag-deleted="notifyChanged"
      @close="showTagSearch = false"
    />
  </div>
</template>
