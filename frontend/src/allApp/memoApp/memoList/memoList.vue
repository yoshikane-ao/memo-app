<script setup>
/**
 * 【インポート・セクション】
 * 外部の機能や部品（コンポーネント）をこのファイルで使えるように読み込みます
 */
import { onMounted } from 'vue'; // Vueの「ライフサイクル」：画面が表示された瞬間の動きを制御する
import { memoList } from './memoList.ts'; // 「コンポーザブル」：メモ一覧のデータ操作ロジックを別ファイルから取得

// 他のコンポーネント（子部品）の読み込み
import MemoDelete from '../memoDelete/memoDelete.vue'; // 削除ボタンの部品
import memoUpdate from '../memoUpdate/memoUpdate.vue'; // 更新コンポーネント
import inputBaseField from '../../shared/inputBaseField.vue'; // 入力フォームの共通部品

/**
 * 【データ管理・初期化セクション】
 */
// memoList関数から、リアクティブなデータ(memos)と再取得用の関数(fetchMemos)を取り出す
// これにより、データの状態と表示が常に同期されます
const { memos, fetchMemos } = memoList();

// ライフサイクルフック：このコンポーネントがブラウザに描画（マウント）された直後に実行
onMounted(() => {
  fetchMemos(); // サーバー等から最新のメモ一覧を取得する
});

/**
 * 検索結果など、外部から直接メモ一覧を差し替えるための関数
 */
const setMemos = (newMemos) => {
  memos.value = newMemos.map(item => ({
    ...item,
    initialTitle: item.title,
    initialContent: item.content
  }));
};

/**
 * 【外部公開設定】
 * defineExpose: 親コンポーネントからこのコンポーネントの関数を直接呼べるようにする
 * 例：メモ作成画面（親）で保存に成功した後、この一覧を更新させるために使用
 */
defineExpose({ fetchMemos, setMemos });
</script>

<template>
  <div class="memo-container">
    <div v-if="memos.length === 0">メモがありません。</div>

    <div v-for="memo in memos" :key="memo.id" class="memo-card">
      
      <inputBaseField :id="'title-' + memo.id" v-model="memo.title" />
      
      <inputBaseField :id="'content-' + memo.id" v-model="memo.content" :multiline="true" />

      <memoUpdate 
        :memoId="memo.id"
        :title="memo.title"
        :content="memo.content"
        :initialTitle="memo.initialTitle"
        :initialContent="memo.initialContent"
        @update="fetchMemos"
      />

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
/**
 * 【スタイル定義】
 * scoped属性により、このファイル内のHTML要素だけにデザインが適用されます（他への干渉を防ぐ）
 */
.memo-card {
  border: 1px solid #ddd;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  background-color: #fff;
}
.card-footer {
  display: flex;
  justify-content: flex-end; /* 右寄せ */
  margin-top: 10px;
}
.tag-badge {
  display: inline-block;
  margin-right: 5px;
  font-size: 0.8rem;
  color: #666;
}
</style>