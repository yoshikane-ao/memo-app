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
import inputBaseField from '../../shared/inputBaseField.vue'
import buttonBaseField from '../../shared/buttonBaseField.vue'
import memoList from '../memoList/memoList.vue'
const save = () => console.log('保存しました');

const form = reactive({
  title: '',
  contents: ''
})
</script>

<template>
  <inputBaseField
    id="title"
    label="タイトル"
    v-model="form.title"
    placeholder="タイトルを入力してください"
  />

  <inputBaseField
    id="contents"
    label="内容"
    v-model="form.contents"
    placeholder="内容を入力してください"
    :multiline="true"
    :rows="6"
  />

  <buttonBaseField
    id="submit"
    label="送信"
    @click="save">
  </buttonBaseField>

  <memoList />
</template>