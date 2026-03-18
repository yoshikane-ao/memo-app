<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps(['memo'])
const emit = defineEmits(['refresh'])

const title = ref(props.memo.title)
const content = ref(props.memo.content)

const copyToClipboard = () => {
  navigator.clipboard.writeText(content.value)
  alert('コピーしました')
}

const updateMemo = async () => {
  await fetch(`http://localhost:3000/memos`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: title.value, content: content.value, id: props.memo.id })
  })
  emit('refresh')
}
</script>

<template>
  <div class="memo-row">
    <div class="title-container">
      <textarea 
        v-model="title" 
        class="resizable-title" 
        rows="1"
        placeholder="タイトル"
      ></textarea>
    </div>

    <textarea 
      v-model="content" 
      class="resizable-content" 
      placeholder="メモ内容"
    ></textarea>

    <div class="actions">
      <button @click="updateMemo" class="icon-btn" title="保存">💾</button>
      <button @click="copyToClipboard" class="icon-btn" title="コピー">📋</button>
      <button class="icon-btn" title="タグ・タブ設定">⚙️</button>
    </div>
  </div>
</template>

<style scoped>
.memo-row {
  display: flex;
  align-items: stretch;
  gap: 0; /* 隙間をなくして密に並べる */
  border-bottom: 1px solid #333;
  padding: 4px 0;
}

/* タイトルのリサイズ設定 */
.title-container {
  display: flex;
  border-right: 1px solid #333;
}

.resizable-title {
  width: 150px; /* 初期値 */
  min-width: 80px;
  max-width: 500px;
  resize: horizontal; /* 横幅のみ変更可能 */
  background: transparent;
  border: none;
  color: #888;
  padding: 8px;
  font-weight: bold;
  overflow: hidden;
  white-space: nowrap;
}

/* コンテンツのリサイズ設定 */
.resizable-content {
  flex: 1;
  min-height: 32px;
  resize: vertical; /* 縦幅のみ変更可能 */
  background: transparent;
  border: none;
  color: #ccc;
  padding: 8px;
  line-height: 1.4;
}

.resizable-title:focus, .resizable-content:focus {
  outline: none;
  background: #222;
}

.actions {
  display: flex;
  align-items: center;
  padding: 0 10px;
  gap: 5px;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.icon-btn:hover {
  opacity: 1;
}
</style>