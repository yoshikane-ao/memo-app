<script setup>
import { onMounted } from 'vue';
import { useMemo } from './useMemo.ts';

const { memos, fetchMemos } = useMemo();

// 画面が表示された瞬間に実行
onMounted(() => {
  fetchMemos();
});
</script>

<template>
  <div class="memo-container">
    <h2>メモ一覧</h2>
    
    <div v-if="memos.length === 0">メモがありません。</div>

    <div v-for="memo in memos" :key="memo.id" class="memo-card">
      <h3>{{ memo.title }}</h3>
      <p>{{ memo.content }}</p>
      
      <div class="tags">
        <span v-for="mt in memo.memo_tags" :key="mt.tag.id" class="tag-badge">
          #{{ mt.tag.title }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.memo-card {
  border: 1px solid #ddd;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
}
.tag-badge {
  background: #e0f2f1;
  color: #00796b;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-right: 5px;
}
</style>