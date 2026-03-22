<script setup>
/**
 * 【インポート・セクション】
 * 外部の機能や部品（コンポーネント）をこのファイルで使えるように読み込みます
 */
import { onMounted, watch, computed, reactive } from 'vue'; // Vueの「ライフサイクル」：画面が表示された瞬間の動きを制御する
import { memoList } from './memoList.ts'; // 「コンポーザブル」：メモ一覧のデータ操作ロジックを別ファイルから取得
import { memoViewControl } from '../memoViewControl/memoViewControl.ts'; // 表示制御共通ロジック
import axios from 'axios';

// 他のコンポーネント（子部品）の読み込み
import memoUpdate from '../memoUpdate/memoUpdate.vue'; // 更新コンポーネント
import tagSearch from '../../tagLogic/tagSearch/tagSearch.vue'; // タグ検索機能
import TagBadgeList from '../../tagLogic/tagBadgeList/tagBadgeList.vue'; // タグバッジ共通コンポーネント
import memoCopy from '../memoCopy/memoCopy.vue'; // コピー機能部
import memoSortWrapper from '../memoSort/memoSort.vue'; // 並び替えラッパーコンポーネント
import { saveSortOrder } from '../memoSort/memoSort'; // 並び替え時の保存機能


/**
 * 【データ管理・初期化セクション】
 */
const resizeWidths = reactive({});
const resizeHeights = reactive({});

const checkResize = (id, event, type) => {
  const el = event.target;
  if (type === 'width') {
    if (el.style.width) {
      resizeWidths[id] = parseInt(el.style.width, 10);
    }
  } else if (type === 'height') {
    if (el.style.height) {
      resizeHeights[id] = parseInt(el.style.height, 10);
    }
  }
};
const props = defineProps({
  viewConfig: {
    type: Object,
    default: () => ({ keyword: '', searchType: 'all', sortOrder: 'custom', selectedTags: [] })
  }
});

// memoList関数から、リアクティブなデータ(memos)と再取得用の関数(fetchMemos)を取り出す
const { memos, fetchMemos } = memoList();

// useViewControlに全メモを渡し、フィルタ済みのリスト (displayedMemos) を取得する
const { keyword, searchType, sortOrder, selectedTags, displayedMemos } = memoViewControl(memos);

// 親からの指示 (viewConfig) が変わるたびに、useViewControl の条件を同期する
watch(() => props.viewConfig, (newVal) => {
  if (newVal) {
    keyword.value = newVal.keyword;
    searchType.value = newVal.searchType;
    sortOrder.value = newVal.sortOrder;
    selectedTags.value = newVal.selectedTags;
  }
}, { deep: true, immediate: true });

// フィルタや日付順ソートがかかっている場合は、並び替えを無効（ドラッグ不可）にする
const canSort = computed(() => 
  sortOrder.value === 'custom' && !keyword.value && selectedTags.value.length === 0
);

// ライフサイクルフック：このコンポーネントがブラウザに描画（マウント）された直後に実行
onMounted(() => {
  fetchMemos(); // サーバー等から最新のメモ一覧を取得する
});

// メモからタグの紐付けを解除する
const removeTag = async (memoId, tagId) => {
  try {
    await axios.delete(`http://localhost:3000/tags/unlink/${memoId}/${tagId}`);
    fetchMemos();
  } catch (error) {
    console.error("タグの解除に失敗しました", error);
  }
};

// メモの削除
const deleteMemo = async (memoId) => {
  console.log('[DELETE] ボタン押下, memoId:', memoId);
  
  const confirmed = window.confirm('このメモを削除してもよろしいですか？');
  console.log('[DELETE] confirm結果:', confirmed);
  
  if (!confirmed) return;
  
  try {
    console.log('[DELETE] リクエスト送信:', `http://localhost:3000/memos/delete/${memoId}`);
    const response = await axios.delete(`http://localhost:3000/memos/delete/${memoId}`);
    console.log('[DELETE] 成功:', response.data);
    await fetchMemos();
  } catch (error) {
    console.error('[DELETE] 失敗:', error);
    alert('削除に失敗しました:\n' + (error.response?.data?.message || error.message));
  }
};

/**
 * 検索結果など、外部から直接メモ一覧を差し替えるための関数
 */
const setMemos = (newMemos) => {
  memos.value = newMemos.map(item => ({
    ...item,
    initialTitle: item.title,
    initialContent: item.content,
    currentWidth: item.width,
    currentHeight: item.height,
    showTagSearch: false // 検索窓のフラグを初期化
  }));
};

/**
 * 【外部公開設定】
 */
defineExpose({ fetchMemos, setMemos });
</script>

<template>
  <div class="memo-container">
    <div v-if="displayedMemos.length === 0" class="memo-empty">
      対象のメモが見つかりません。
    </div>

    <memoSortWrapper 
      :items="displayedMemos" 
      :disabled="!canSort"
      @update:items="canSort ? (memos = $event) : null" 
      @sortEnd="saveSortOrder"
    >
      <template #default="{ item: memo }">
        <div class="memo-row">
          <!-- タイトル（横リサイズのみ） -->
          <div class="title-cell">
            <textarea
              :id="'title-' + memo.id"
              :value="memo.title"
              @input="memo.title = $event.target.value"
              @mouseup="checkResize(memo.id, $event, 'width')"
              :style="{ width: (resizeWidths[memo.id] ?? memo.width) ? (resizeWidths[memo.id] ?? memo.width) + 'px' : '' }"
              rows="1"
              spellcheck="false"
              class="title-input"
            />
          </div>

          <!-- コンテンツ（縦リサイズのみ） -->
          <div class="content-cell">
            <textarea
              :id="'content-' + memo.id"
              :value="memo.content"
              @input="memo.content = $event.target.value"
              @mouseup="checkResize(memo.id, $event, 'height')"
              :style="{ height: (resizeHeights[memo.id] ?? memo.height) ? (resizeHeights[memo.id] ?? memo.height) + 'px' : '' }"
              rows="2"
              spellcheck="false"
              class="content-input"
            />
            <!-- タグ行 -->
            <div class="tag-row">
              <TagBadgeList
                :tags="(memo.memo_tags || []).map(mt => mt.tag)"
                @remove="(tag) => removeTag(memo.id, tag.id)"
              />
              <button @click.stop="memo.showTagSearch = !memo.showTagSearch" class="tag-add-btn">
                ＋タグ
              </button>
              <tagSearch 
                v-if="memo.showTagSearch" 
                :memoId="memo.id"
                :linkedTagIds="(memo.memo_tags || []).map(mt => mt.tag.id)"
                @tag-added="fetchMemos"
                @tag-deleted="fetchMemos"
                @close="memo.showTagSearch = false"
              />
            </div>
          </div>

          <!-- アクションボタン群: コピー → 更新 → 削除 -->
          <div class="actions-cell">
            <memoCopy :text="`${memo.title}\n\n${memo.content}`" />
            <memoUpdate 
              :memoId="memo.id"
              :title="memo.title"
              :content="memo.content"
              :initialTitle="memo.initialTitle"
              :initialContent="memo.initialContent"
              :currentWidth="resizeWidths[memo.id] !== undefined ? resizeWidths[memo.id] : memo.width"
              :initialWidth="memo.width"
              :currentHeight="resizeHeights[memo.id] !== undefined ? resizeHeights[memo.id] : memo.height"
              :initialHeight="memo.height"
              @update="fetchMemos"
            />
            <button class="delete-btn" @click="deleteMemo(memo.id)">削除</button>
          </div>
        </div>
      </template>
    </memoSortWrapper>
  </div>
</template>

<!-- <style scoped>
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
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}
.tag-badge {
  display: inline-block;
  margin-right: 5px;
  font-size: 0.8rem;
  color: #666;
  background-color: #eee;
  padding: 2px 6px;
  border-radius: 4px;
}
</style> -->