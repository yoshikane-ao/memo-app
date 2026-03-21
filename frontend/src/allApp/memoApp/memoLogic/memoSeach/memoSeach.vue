<script setup>
import { ref, watch } from 'vue';
import { memoSeach } from './memoSeach.ts';
import inputBaseField from '../../../shared/inputBaseField.vue';

/**
 * 親コンポーネント（memoScreen.vue）へ検索結果を伝えるイベントと、
 * 検索クリア（全件戻し）を伝えるイベントを定義
 */
const emit = defineEmits(['searchResults', 'clearSearch']);

const { executeSearch } = memoSeach();

// 検索キーワードとカテゴリの状態管理
const keyword = ref('');
const searchType = ref('all');

/**
 * watch を使い、キーワードやプルダウンの変更を常に監視します。
 * 入力されるたびに（即座に）関数が実行されます。
 */
watch([keyword, searchType], async ([newKeyword, newType]) => {
  // キーワードが空っぽ、またはスペースだけの場合は全件表示に戻す
  if (!newKeyword || !newKeyword.trim()) {
    emit('clearSearch');
    return;
  }
  
  // キーワードがあれば、API通信を実行して結果を取得
  const results = await executeSearch(newKeyword, newType);
  if (results !== null && results !== undefined) {
    emit('searchResults', results);
  }
});
</script>

<template>
  <div class="search-container">
    <div class="search-controls">
      <!-- 検索対象のプルダウン -->
      <select v-model="searchType" class="search-select">
        <option value="all">全て</option>
        <option value="title">タイトル</option>
        <option value="content">内容</option>
        <option value="tag">タグ</option>
      </select>
      
      <!-- 検索キーワード入力 -->
      <!-- 文字を打ち込むたびに即座に反映されます -->
      <inputBaseField 
        id="search-input" 
        v-model="keyword" 
        placeholder="検索キーワードを入力（即時反映）" 
      />
    </div>
  </div>
</template>

<style scoped>
.search-container {
  margin-bottom: 2rem;
  background-color: #f7f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #eaeaea;
}
.search-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}
.search-select {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  background-color: #fff;
  cursor: pointer;
  outline: none;
}
.search-select:focus {
  border-color: #4a90e2;
}
</style>
