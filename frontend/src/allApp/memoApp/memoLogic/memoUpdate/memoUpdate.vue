<script setup>
import { computed } from 'vue';
import { memoUpdate } from './memoUpdate.ts';
import buttonBaseField from '../../../shared/buttonBaseField.vue'; 

/**
 * 【Props（プロパティ）の設定】
 */
const props = defineProps({
  memoId: { type: Number, required: true },
  title: { type: String, required: true },         // 現在の入力値
  content: { type: String, required: true },       // 現在の入力値
  initialTitle: { type: String, required: true },  // 比較用の初期タイトル
  initialContent: { type: String, required: true } // 比較用の初期内容
});

/**
 * 【Emits（イベント発行）の設定】
 */
const emit = defineEmits(['update']);

/**
 * ロジックの初期化
 */
const { executeUpdate, validateUpdate } = memoUpdate();

/**
 * 【更新ボタンの有効判定】
 * TS側の validateUpdate を呼び出して結果を判定します。
 * 判定結果を反転させて「無効(disabled)にするか」を決めます。
 */
const isUpdateDisabled = computed(() => {
  const isValid = validateUpdate(
    props.title, 
    props.content, 
    props.initialTitle, 
    props.initialContent
  );
  
  // バリデーションが OK でないなら Disabled(無効) を true にする
  return !isValid;
});

/**
 * 更新ボタンがクリックされた時の処理
 */
const handleUpdate = async () => {
  const success = await executeUpdate(
    props.memoId, 
    props.title, 
    props.content,
    props.initialTitle,
    props.initialContent
  );
  
  if (success) {
    emit('update');
  }
};
</script>

<template>
  <buttonBaseField 
    label="更新"
    :disabled="isUpdateDisabled"
    @click="handleUpdate"
  />
</template>