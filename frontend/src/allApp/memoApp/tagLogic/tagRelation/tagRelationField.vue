<script setup lang="ts">
import { computed, ref } from 'vue';
import TagSearch from '../tagSearch/tagSearch.vue';
import TagBadgeList from '../tagBadgeList/tagBadgeList.vue';
import { useTagRelation } from './tagRelation';
import type { TagItem, TagRelationFieldEmits, TagRelationFieldProps } from '../Types';

const props = defineProps<TagRelationFieldProps>();
const emit = defineEmits<TagRelationFieldEmits>();

const { unlinkTagFromMemo } = useTagRelation();
const showTagSearch = ref(false);

const linkedTagIds = computed(() => props.tags.map((tag) => tag.id));

const notifyChanged = () => {
  emit('changed');
};

const handleTagRemove = async (tag: TagItem) => {
  const success = await unlinkTagFromMemo(props.memoId, tag.id);

  if (success) {
    notifyChanged();
    return;
  }

  alert('タグの解除に失敗しました。');
};
</script>

<template>
  <div class="tag-row">
    <TagBadgeList
      :tags="tags"
      @remove="handleTagRemove"
    />

    <button class="tag-add-btn" @click.stop="showTagSearch = !showTagSearch">
      + タグ
    </button>

    <TagSearch
      v-if="showTagSearch"
      :memoId="memoId"
      :linkedTagIds="linkedTagIds"
      @tag-added="notifyChanged"
      @tag-removed="notifyChanged"
      @tag-deleted="notifyChanged"
      @close="showTagSearch = false"
    />
  </div>
</template>
