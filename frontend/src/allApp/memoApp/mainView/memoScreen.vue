<!-- <script setup lang="ts">
import { onMounted } from 'vue';
// import { useMemos } from '@/composables/useMemos';
import MemoItem from '@/components/memo/MemoItem.vue';
import MemoForm from '@/components/memo/MemoForm.vue';
import SearchBar from '@/components/memo/SearchBar.vue';

const { filteredMemos, fetchMemos, keyword, selected } = useMemos();

onMounted(fetchMemos);
</script>

<template>
  <div class="app-container">
    <MemoForm @refresh="fetchMemos" />
    <SearchBar v-model:keyword="keyword" v-model:selected="selected" />
    <div class="memo-list">
      <MemoItem 
        v-for="memo in filteredMemos" 
        :key="memo.id" 
        :memo="memo" 
        @refresh="fetchMemos"
      />
    </div>
  </div>
</template> -->

<script setup>
import { reactive } from 'vue'
import { ref } from 'vue'
import inputBaseField from '../../shared/inputBaseField.vue'
import memoList from '../memoList/memoList.vue'
import { memoDelete } from '../memoDelete/memoDelete.ts';
import MemoRegister from '../memoRegister/memoRegister.vue'; // 追加
import MemoDelete from '../memoDelete/memoDelete.vue'; // 削除
import memoSeach from '../memoSeach/memoSeach.vue'; // 検索機能


// const form = reactive({
//   title: '',
//   contents: ''
// })

const listRef = ref(null);

const onSaveSuccess = () => {
  // listRef（memoList）が持つ fetchMemos 関数を実行する
  if (listRef.value) {
    listRef.value.fetchMemos();
  }
};

// 検索完了時に呼ばれる関数（検索結果でリストを上書き）
const onSearchResults = (results) => {
  if (listRef.value) {
    listRef.value.setMemos(results);
  }
};

// 検索クリア時に呼ばれる関数（リストを全件再取得）
const onClearSearch = () => {
  if (listRef.value) {
    listRef.value.fetchMemos();
  }
};

</script>

<template>
  <memoSeach @search-results="onSearchResults" @clear-search="onClearSearch" />
  <MemoRegister @save-success="onSaveSuccess" />
  <!-- <MemoDelete /> -->
  <memoList ref="listRef"/>
  <!-- <buttonBaseField /> -->
</template>