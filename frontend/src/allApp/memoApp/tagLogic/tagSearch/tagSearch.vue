<script setup lang="ts">
import { onMounted } from 'vue';
import { useTagSearch } from './tagSearch';
import tagRegister from '../tagRegister/tagRegister.vue';
import axios from 'axios';

// 新規作成でも使い回せるよう memoId をオプショナルに
const props = defineProps<{ memoId?: number }>();
const emit = defineEmits(['close', 'tag-added']);

const { searchQuery, filteredTags, hasExactMatch, fetchAllTags } = useTagSearch();

// 既存のタグをクリックして紐付ける処理
const selectTag = async (tag: { id: number, title: string }) => {
  if (props.memoId) {
    try {
      await axios.post(`http://localhost:3000/tags/link`, { memoId: props.memoId, tagId: tag.id });
      emit('tag-added', tag); // 親に更新を通知
    } catch (error) {
      alert("タグの紐付けに失敗しました");
    }
  } else {
    // 新規作成時は紐付かないので値だけ送る
    emit('tag-added', tag);
  }
};

const handleTagRegistered = async (newTag: any) => {
  emit('tag-added', newTag);
  searchQuery.value = ''; // 新規作成したら検索窓を空欄にする
  await fetchAllTags(); // 新規追加されたタグを即時（リストに）反映させる
};

onMounted(fetchAllTags);
</script>

<template>
  <div class="tag-search-modal">
    <input 
      v-model="searchQuery" 
      type="text" 
      placeholder="タグを検索・作成..." 
      class="search-input"
    />

    <div class="tag-list">
      <button 
        v-for="tag in filteredTags" 
        :key="tag.id" 
        @click="selectTag(tag)"
        class="tag-item"
      >
        # {{ tag.title }}
      </button>
    </div>

    <!-- ここに新規タグ作成コンポーネントを埋め込む -->
    <tagRegister 
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
  top: 40px; right: 0;
  width: 250px; background: white;
  border: 1px solid #ccc; border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 10px; z-index: 100;
}
.search-input {
  width: 100%; padding: 5px; margin-bottom: 10px; box-sizing: border-box;
}
.tag-list {
  max-height: 150px; overflow-y: auto;
}
.tag-item {
  display: block; width: 100%; text-align: left;
  padding: 5px; background: none; border: none; cursor: pointer;
}
.tag-item:hover { background: #f0f0f0; }
.close-btn { width: 100%; margin-top: 10px; font-size: 0.8rem; }
</style>