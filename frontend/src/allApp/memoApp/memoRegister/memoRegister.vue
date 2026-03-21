<script setup>
import { reactive } from 'vue'
import { MemoRegister } from './memoRegister'
import inputBaseField from '../../shared/inputBaseField.vue'
import buttonBaseField from '../../shared/buttonBaseField.vue'
// import { fetchMemos } from '../memoList/memoList.vue';

// defineEmits を使って、親に合図を送るための「emit」関数を定義します
const emit = defineEmits(['save-success'])

const { executeRegister } = MemoRegister();
// 新規登録用のデータを保持する「箱」
const newMemo = reactive({
  title: '',
  content: ''
})

// 保存ボタンが押された時の処理
const handleSave = async () => {
  const success = await executeRegister(newMemo);
  if (success) {
    // 【変更】ここで親（MemoScreen）に合図を送る
    emit('save-success'); 

    alert("メモを保存しました！");
    newMemo.title = '';
    newMemo.content = '';
  }
};
</script>

<template>
  <inputBaseField
    id="title"
    label="タイトル"
    v-model="newMemo.title"
    placeholder="タイトルを入力してください"
  />

  <inputBaseField
    id="content"
    label="内容"
    v-model="newMemo.content"
    placeholder="内容を入力してください"
    :multiline="true"
    :rows="6"
  />

  <buttonBaseField
    id="submit"
    label="保存"
    @click="handleSave">
  </buttonBaseField>
</template>