

<script setup>
// import style from '';
import { reactive } from 'vue'
import { ref } from 'vue'
import inputBaseField from '../../shared/inputBaseField.vue'
import memoList from '../memoLogic/memoList/memoList.vue'
import { memoDelete } from '../memoLogic/memoDelete/memoDelete.ts';
import MemoRegister from '../memoLogic/memoRegister/memoRegister.vue';
import MemoDelete from '../memoLogic/memoDelete/memoDelete.vue'; // 削除
import memoViewControl from '../memoLogic/memoViewControl/memoViewControl.vue'; // 表示管理（検索・ソート・絞り込み）

const listRef = ref(null);

const onSaveSuccess = () => {
  // listRef（memoList）が持つ fetchMemos 関数を実行する
  if (listRef.value) {
    listRef.value.fetchMemos();
  }
};

// 検索結果などのステートはmemoListにpropsで渡すため、親で管理します
const viewConfig = reactive({
  keyword: '',
  searchType: 'all',
  sortOrder: 'custom',
  selectedTags: []
});

</script>

<template>
  <memoViewControl 
    v-model:keyword="viewConfig.keyword" 
    v-model:searchType="viewConfig.searchType"
    v-model:sortOrder="viewConfig.sortOrder" 
    v-model:selectedTags="viewConfig.selectedTags" 
  />
  <MemoRegister @save-success="onSaveSuccess" />
  <!-- <MemoDelete /> -->
  <memoList ref="listRef" :viewConfig="viewConfig" />
  <!-- <buttonBaseField /> -->
</template>