<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps(['memo'])
const emit = defineEmits(['refresh'])

const title = ref(props.memo.title)
const content = ref(props.memo.content)

const isTagMenuOpen = ref(false)
const searchQuery = ref('')

const allAvailableTags = ref<string[]>([])

// ★重要修正: currentTags を ref ではなく computed に変更
// これにより、emit('refresh') 後に親から届く最新のタグ情報と自動同期されます
const currentTags = computed(() => {
  if (!props.memo.memo_tags) return []
  return props.memo.memo_tags.map((mt: any) => mt.tag.title)
})

const tempSelectedTags = ref<string[]>([])

// メニューを開く瞬間に、最新のタグ一覧をDBから取得する
const openTagMenu = async () => {
  try {
    const response = await fetch('http://localhost:3000/memos/tags')
    if (!response.ok) throw new Error(`APIエラー: ${response.status}`)
    
    const data = await response.json()
    if (data.items) {
      allAvailableTags.value = data.items.map((t: any) => t.title)
      console.log(allAvailableTags)
    }
  } catch (error) {
    console.error('タグ一覧の取得に失敗しました:', error)
  }

  // computed である currentTags の値を一時リストにコピー
  tempSelectedTags.value = [...currentTags.value]
  searchQuery.value = ''
  isTagMenuOpen.value = true
}

// 検索クエリに応じてタグを絞り込む computed プロパティ
const filteredTags = computed(() => {
  if (!searchQuery.value) return allAvailableTags.value
  return allAvailableTags.value.filter(tag => 
    tag.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// クエリが完全一致しているかどうかを判定する computed プロパティ
const isExactMatch = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return true 
  return allAvailableTags.value.some(tag => tag.toLowerCase() === query)
})
// 新しいタグを追加する関数
const addNewTag = () => {
  const newTagName = searchQuery.value.trim()
  if (!newTagName || isExactMatch.value) return
  allAvailableTags.value.push(newTagName)
  tempSelectedTags.value.push(newTagName)
  searchQuery.value = ''
}
// タグの選択・解除を行う関数
const toggleTag = (tag: string) => {
  const index = tempSelectedTags.value.indexOf(tag)
  if (index === -1) {
    tempSelectedTags.value.push(tag)
  } else {
    tempSelectedTags.value.splice(index, 1)
  }
}
// メモの更新処理
const updateMemo = async () => {
  // ここではタイトルと内容、そしてタグの紐付けを一緒に更新するイメージです
  await fetch(`http://localhost:3000/memos`, {
    // PUT で更新、POST で新規作成のイメージ
    method: 'PUT',
    // タイトルと内容、そしてタグの紐付けを一緒に送るイメージ
    headers: { 'Content-Type': 'application/json' },
    // 送るデータのイメージ（必要に応じて調整してください）
    body: JSON.stringify({ title: title.value, content: content.value, id: props.memo.id })
  })
  // 更新後は親を最新状態にするために refresh イベントを発火
  emit('refresh')
}

// メモの削除処理
const deleteMemo = async () => {
  // 確認ダイアログを表示
  await fetch(`http://localhost:3000/memos/${props.memo.id}`, {
    // DELETE メソッドで削除リクエストを送るイメージ
    method: 'DELETE',
    // 必要に応じてヘッダーを追加（例: 認証トークンなど）
    headers: { 'Content-Type': 'application/json' }
    // body は通常、DELETE では必要ないですが、APIの設計によっては必要な場合もあります
  })
  // 削除後は親を最新状態にするために refresh イベントを発火
  emit('refresh')
  // ここでは削除後に親コンポーネントに「refresh」イベントを送って、親が最新のメモ一覧を再取得するイメージです
}

// タグ紐付けの保存処理
const saveTags = async () => {
  try {
    await fetch(`http://localhost:3000/memos/${props.memo.id}/tags`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: tempSelectedTags.value }) // 一時リストを送信
    });
  } catch (error) {
    console.error('タグの保存に失敗しました:', error);
    alert('保存に失敗しました');
  }
  
  isTagMenuOpen.value = false
  emit('refresh') // 親を更新
}

// ★重要修正: deleteSystemTag を1つに集約し、重複を削除
const deleteSystemTag = async (tagToDelete: string) => {
  if (!confirm(`タグ「${tagToDelete}」を完全に削除しますか？\n※他のメモからも解除されます`)) {
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:3000/memos/tags/${encodeURIComponent(tagToDelete)}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error(`APIエラー: ${response.status}`);

    // リストから消去
    allAvailableTags.value = allAvailableTags.value.filter(t => t !== tagToDelete);
    
    // 全てのメモコンポーネントを最新状態にする
    emit('refresh');

  } catch (error) {
    console.error('タグの削除に失敗しました:', error);
    alert('タグの削除に失敗しました。');
  }
};

const copyToClipboard = () => {
  navigator.clipboard.writeText(content.value)
  alert('コピーしました')
}

// ② メモの型（形）を定義する（これで id や title があることを認識させます）
interface Memo {
  id: number;
  title: string;
  content: string;
  memo_tags: any[]; // タグ情報の型
}

// ③ ref<Memo[]>([]) と書くことで「今は空だけど後で Memo の配列が入るよ」と教える
const memos = ref<Memo[]>([]) 

const globalSearchQuery = ref('')
const searchType = ref('all')

const fetchMemos = async () => {
  const url = new URL('http://localhost:3000/memos')
  // 検索クエリがある場合のみパラメータを追加
  if (globalSearchQuery.value.trim()) {
    url.searchParams.append('q', globalSearchQuery.value)
    url.searchParams.append('type', searchType.value)
  }

  try {
    const response = await fetch(url.toString())
    const data = await response.json()
    // これで memos.value にデータが入っても TypeScript が怒らなくなります
    memos.value = data.items 
  } catch (error) {
    console.error('取得失敗:', error)
  }
}
</script>

<template>
      
  <!-- <div class="app-container">


      <div class="memo-list">
        <MemoRow 
          v-for="memo in memos" 
          :key="memo.id" 
          :memo="memo" 
          @refresh="fetchMemos" 
        />
      </div>
    </div> -->
  
  <div class="memo-row">
    <div class="title-container">
      <textarea v-model="title" class="resizable-title" rows="1" placeholder="タイトル"></textarea>
    </div>

    <textarea v-model="content" class="resizable-content" placeholder="メモ内容"></textarea>

    <div class="actions">
      <button @click="updateMemo" class="icon-btn" title="保存">💾</button>
      <button @click="deleteMemo" class="icon-btn" title="削除">🗑️</button>
      <button @click="copyToClipboard" class="icon-btn" title="コピー">📋</button>
      
      <div class="tag-dropdown-wrapper">
        <button @click="openTagMenu" class="icon-btn" title="タグ・タブ設定">⚙️</button>
        
        <div v-show="isTagMenuOpen" class="tag-dropdown-menu">
          <input 
            v-model="searchQuery" 
            @keyup.enter="addNewTag"
            type="text" 
            placeholder="タグを検索..." 
            class="tag-search-input" 
          />

          <div class="selected-tags-preview" v-if="tempSelectedTags.length > 0">
            <span v-for="tag in tempSelectedTags" :key="tag" class="tag-chip">
              {{ tag }}
              <button @click.stop="toggleTag(tag)" class="tag-remove-btn">×</button>
            </span>
          </div>

          <ul class="tag-dropdown-list">
            <li 
              v-if="!isExactMatch && searchQuery.trim() !== ''"
              @click="addNewTag"
              class="tag-list-item tag-create-item"
            >
              <span class="tag-name">「{{ searchQuery.trim() }}」を新しく作成</span>
              <span class="add-icon">＋</span>
            </li>

            <li 
              v-for="tag in filteredTags" 
              :key="tag" 
              @click="toggleTag(tag)"
              class="tag-list-item"
              :class="{ 'is-selected': tempSelectedTags.includes(tag) }"
            >
              <span class="tag-name">{{ tag }}</span>
              <div class="tag-item-actions">
                <span v-if="tempSelectedTags.includes(tag)" class="check-icon">✓</span>
                <button @click.stop="deleteSystemTag(tag)" class="sys-tag-delete-btn" title="タグを完全に削除">🗑️</button>
              </div>
            </li>
            
            <li v-if="filteredTags.length === 0 && isExactMatch" class="tag-list-empty">見つかりません</li>
          </ul>

          <div class="tag-menu-actions">
            <button @click="isTagMenuOpen = false" class="tag-cancel-btn">キャンセル</button>
            <button @click="saveTags" class="tag-save-btn">保存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

/* 既存のレイアウト（省略せず記載） */
.memo-row { display: flex; align-items: stretch; gap: 0; border-bottom: 1px solid #333; padding: 4px 0; }
.title-container { display: flex; border-right: 1px solid #333; }
.resizable-title { width: 150px; min-width: 80px; max-width: 500px; resize: horizontal; background: transparent; border: none; color: #888; padding: 8px; font-weight: bold; overflow: hidden; white-space: nowrap; }
.resizable-content { flex: 1; min-height: 32px; resize: vertical; background: transparent; border: none; color: #ccc; padding: 8px; line-height: 1.4; }
.resizable-title:focus, .resizable-content:focus { outline: none; background: #222; }
.actions { display: flex; align-items: center; padding: 0 10px; gap: 5px; }
.icon-btn { background: none; border: none; cursor: pointer; font-size: 1.1rem; opacity: 0.5; transition: opacity 0.2s; }
.icon-btn:hover { opacity: 1; }

/* タグ検索プルダウンのスタイル */
.tag-dropdown-wrapper { position: relative; display: flex; align-items: center; }
.tag-dropdown-menu { position: absolute; top: 100%; right: 0; margin-top: 8px; background: #222; border: 1px solid #444; border-radius: 6px; padding: 12px; width: 260px; z-index: 50; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); display: flex; flex-direction: column; gap: 10px; }
.tag-search-input { width: 100%; box-sizing: border-box; background: #111; color: #eee; border: 1px solid #555; border-radius: 4px; padding: 8px; font-size: 0.9rem; }
.tag-search-input:focus { outline: none; border-color: #0ea5e9; }

/* チップのスタイル */
.selected-tags-preview { display: flex; flex-wrap: wrap; gap: 6px; padding-bottom: 8px; border-bottom: 1px solid #444; }
.tag-chip { background-color: #0369a1; color: #e0f2fe; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; display: flex; align-items: center; gap: 4px; }
.tag-remove-btn { background: none; border: none; color: #e0f2fe; cursor: pointer; font-size: 0.9rem; padding: 0; line-height: 1; }

/* リスト部分のスタイル */
.tag-dropdown-list { list-style: none; margin: 0; padding: 0; max-height: 150px; overflow-y: auto; border: 1px solid #333; border-radius: 4px; background: #1a1a1a; }
.tag-dropdown-list::-webkit-scrollbar { width: 6px; }
.tag-dropdown-list::-webkit-scrollbar-thumb { background: #555; border-radius: 3px; }

.tag-list-item { padding: 8px 10px; color: #ccc; font-size: 0.9rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2a2a2a; }
.tag-list-item:last-child { border-bottom: none; }
.tag-list-item:hover { background: #333; }
.tag-list-item.is-selected { background: #0ea5e920; color: #0ea5e9; }
.tag-name { flex-grow: 1; }

/* 追加: 新規作成用アイテムの特別スタイル */
.tag-create-item {
  color: #0ea5e9; /* 目立つように青色に */
  font-weight: bold;
}
.tag-create-item:hover {
  background: #0ea5e920;
}
.add-icon {
  font-weight: bold;
  font-size: 1.1rem;
}

.tag-item-actions { display: flex; align-items: center; gap: 8px; }
.check-icon { font-weight: bold; }
.sys-tag-delete-btn { background: none; border: none; font-size: 0.9rem; cursor: pointer; opacity: 0.3; transition: 0.2s; padding: 0; }
.sys-tag-delete-btn:hover { opacity: 1; transform: scale(1.1); }
.tag-list-empty { padding: 8px 10px; color: #777; font-size: 0.9rem; text-align: center; }

/* ボタンエリア */
.tag-menu-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
.tag-cancel-btn { background: transparent; color: #aaa; border: 1px solid #555; border-radius: 4px; padding: 6px 12px; cursor: pointer; }
.tag-save-btn { background: #0ea5e9; color: white; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer; }
.tag-save-btn:hover { background: #0284c7; }
.tag-cancel-btn:hover { background: #333; }
</style>