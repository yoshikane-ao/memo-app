<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useTagSearch } from './tagSearch';
import { useTagRelation } from '../tagRelation/tagRelation';
import TagRegister from '../tagRegister/tagRegister.vue';
import type { TagItem } from '../Types';
import axios from 'axios';

const props = defineProps<{
  memoId?: number;
  linkedTagIds?: number[];
}>();

const emit = defineEmits(['close', 'tag-added', 'tag-removed', 'tag-deleted']);

const { searchQuery, filteredTags, hasExactMatch, fetchAllTags } = useTagSearch();
const { linkTagToMemo, unlinkTagFromMemo } = useTagRelation();
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
    alert(linked ? 'タグの解除に失敗しました。' : 'タグの紐付けに失敗しました。');
    return;
  }

  emit(linked ? 'tag-removed' : 'tag-added', tag);
};

const deleteTagFromSystem = async (tag: TagItem) => {
  const confirmed = confirm(
    `タグ「${tag.title}」をシステムから削除しますか？\n関連メモとの紐付けも解除されます。`
  );
  if (!confirmed) {
    return;
  }

  try {
    await axios.delete(`http://localhost:3000/tags/system-delete/${tag.id}`);
    await fetchAllTags();
    emit('tag-deleted');
  } catch {
    alert('タグの削除に失敗しました。');
  }
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
  <div ref="modalRef" class="tag-search-modal">
    <input
      v-model="searchQuery"
      type="text"
      placeholder="タグを検索・追加..."
      class="search-input"
    />

    <div class="tag-list">
      <div
        v-for="tag in filteredTags"
        :key="tag.id"
        class="tag-item"
        :class="{ 'tag-linked': isLinked(tag.id) }"
      >
        <button class="tag-select-btn" @click="toggleTag(tag)">
          <span v-if="isLinked(tag.id)" class="link-indicator">+</span>
          # {{ tag.title }}
        </button>
        <button
          class="tag-delete-sys-btn"
          title="タグを完全削除"
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

    <button class="close-btn" @click="emit('close')">閉じる</button>
  </div>
</template>

<style scoped>
.tag-search-modal {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 260px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
  padding: 10px;
  z-index: 200;
}

.search-input {
  width: 100%;
  padding: 6px 10px;
  margin-bottom: 8px;
  box-sizing: border-box;
  background: #0d0d0d;
  color: #ddd;
  border: 1px solid #333;
  border-radius: 4px;
  font-size: 0.8rem;
  font-family: inherit;
}

.search-input:focus {
  outline: none;
  border-color: #666;
}

.tag-list {
  max-height: 180px;
  overflow-y: auto;
}

.tag-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 4px;
  transition: background 0.1s;
}

.tag-item:hover {
  background: #222;
}

.tag-item.tag-linked {
  background: rgba(108, 140, 255, 0.12);
}

.tag-item.tag-linked .tag-select-btn {
  color: #8cacff;
  font-weight: 600;
}

.tag-select-btn {
  flex: 1;
  text-align: left;
  padding: 6px 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: #ccc;
  font-size: 0.8rem;
  font-family: inherit;
}

.tag-select-btn:hover {
  color: #fff;
}

.link-indicator {
  color: #6c8cff;
  margin-right: 4px;
  font-weight: bold;
}

.tag-delete-sys-btn {
  background: rgba(232, 85, 85, 0.15);
  border: 1px solid rgba(232, 85, 85, 0.3);
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #e85555;
  padding: 2px 6px;
  line-height: 1;
  transition: all 0.15s;
}

.tag-delete-sys-btn:hover {
  background: #e85555;
  color: #fff;
  border-color: #e85555;
}

.close-btn {
  width: 100%;
  margin-top: 8px;
  font-size: 0.75rem;
  padding: 5px;
  background: transparent;
  border: 1px solid #333;
  color: #888;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
}

.close-btn:hover {
  background: #222;
  color: #ccc;
}
</style>
