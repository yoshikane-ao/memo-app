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
import memoList from '../memoLogic/memoList/memoList.vue'
import { memoDelete } from '../memoLogic/memoDelete/memoDelete.ts';
import MemoRegister from '../memoLogic/memoRegister/memoRegister.vue';
import MemoDelete from '../memoLogic/memoDelete/memoDelete.vue'; // 削除
import memoViewControl from '../memoLogic/memoViewControl/memoViewControl.vue'; // 表示管理（検索・ソート・絞り込み）

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

// 検索結果などのステートはmemoListにpropsで渡すため、親で管理します
const viewConfig = reactive({
  keyword: '',
  sortOrder: 'custom',
  selectedTags: []
});

</script>

<template>
  <memoViewControl 
    v-model:keyword="viewConfig.keyword" 
    v-model:sortOrder="viewConfig.sortOrder" 
    v-model:selectedTags="viewConfig.selectedTags" 
  />
  <MemoRegister @save-success="onSaveSuccess" />
  <!-- <MemoDelete /> -->
  <memoList ref="listRef" :viewConfig="viewConfig" />
  <!-- <buttonBaseField /> -->
</template>