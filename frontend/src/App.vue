<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MemoItem from './components/MemoItem.vue'

interface Memo {
  id: number;
  title: string;
  content: string;
  tags?: string[]; // 前回の実装に合わせて追加（任意）
  tab?: string | null;
}
const memos = ref<Memo[]>([])
const isAdding = ref(false) // アコーディオンの開閉状態
const newMessage = ref({ title: '', content: '' })

// メモ一覧取得
const fetchMemos = async () => {
  const res = await fetch('http://localhost:3000/memos')
  const data = await res.json()
  memos.value = data.items
}

// 新規保存
const addMemo = async () => {
  if (!newMessage.value.title) return alert('タイトルを入力してください')
  
  await fetch('http://localhost:3000/memos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newMessage.value)
  })
  
  newMessage.value = { title: '', content: '' }
  isAdding.value = false // 保存後閉じる
  fetchMemos()
}

onMounted(fetchMemos)
</script>

<template>
  <div class="app-container">
    <div class="accordion-section">
      <button @click="isAdding = !isAdding" class="add-toggle-btn">
        {{ isAdding ? '▲ 閉じる' : '＋ 新規メモを追加' }}
      </button>
      
      <transition name="accordion">
        <div v-if="isAdding" class="add-form">
          <div class="editor-row">
            <input v-model="newMessage.title" class="title-input" placeholder="タイトル..." />
            <textarea v-model="newMessage.content" class="content-input" placeholder="内容 (Shift + Enter で保存)"></textarea>
            <button @click="addMemo" class="save-btn">保存</button>
          </div>
        </div>
      </transition>
    </div>

    <div class="memo-list">
      <MemoItem 
        v-for="memo in memos" 
        :key="memo.id" 
        :memo="memo" 
        @refresh="fetchMemos"
      />
    </div>
  </div>
</template>

<style scoped>
.app-container {
  background-color: #1a1a1a;
  color: #ccc;
  min-height: 100vh;
  padding: 20px;
  font-family: sans-serif;
}

/* アコーディオンアニメーション */
.accordion-enter-active, .accordion-leave-active {
  transition: all 0.3s ease;
  max-height: 200px;
  overflow: hidden;
}
.accordion-enter-from, .accordion-leave-to {
  max-height: 0;
  opacity: 0;
}

.add-toggle-btn {
  width: 100%;
  padding: 10px;
  background: #333;
  border: 1px solid #444;
  color: #fff;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 10px;
  transition: background 0.2s;
}
.add-toggle-btn:hover { background: #444; }

.add-form {
  background: #252525;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px dashed #555;
}

.editor-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.title-input {
  width: 200px;
  background: #111;
  border: 1px solid #444;
  color: #eee;
  padding: 8px;
}

.content-input {
  flex: 1;
  height: 60px;
  background: #111;
  border: 1px solid #444;
  color: #eee;
  padding: 8px;
}

.save-btn {
  padding: 10px 20px;
  background: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>