<script setup>
import { onMounted } from 'vue';
import { memoList } from './memoList.ts';
// 【修正】ロジックではなく、削除ボタン「部品」そのものをインポートする
import MemoDelete from '../memoDelete/memoDelete.vue'; 

import inputBaseField from '../../shared/inputBaseField.vue';

const { memos, fetchMemos } = memoList();

onMounted(() => {
  fetchMemos();
});

// 親（MemoScreen）から呼ばれるために公開
defineExpose({ fetchMemos });

// 【削除】ここにあった onClickDelete は不要です。
// 削除の実行は MemoDelete.vue の中で完結しているため。
</script>

<template>
  <div class="memo-container">
    <div v-if="memos.length === 0">メモがありません。</div>

    <div v-for="memo in memos" :key="memo.id" class="memo-card">
      <inputBaseField :id="'title-' + memo.id" v-model="memo.title" />
      <inputBaseField :id="'content-' + memo.id" v-model="memo.content" :multiline="true" />
      
      <div class="card-footer">
        <MemoDelete :memoId="memo.id" @deleted="fetchMemos" />
      </div>

      <div class="tags">
        <span v-for="mt in memo.memo_tags" :key="mt.tag.id" class="tag-badge">
          #{{ mt.tag.title }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 見やすさのために枠線などを有効にするのがおすすめです */
.memo-card {
  border: 1px solid #ddd;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  background-color: #fff;
}
.card-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>