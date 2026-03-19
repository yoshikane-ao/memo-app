<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps(['memo'])
const emit = defineEmits(['refresh'])

// 親から届くデータが変わったら、入力欄も更新するように watch を入れる
const title = ref(props.memo.title)
const content = ref(props.memo.content)

watch(() => props.memo, (newMemo) => {
  title.value = newMemo.title
  content.value = newMemo.content
}, { deep: true })

const isTagMenuOpen = ref(false)
const tagSearchQuery = ref('')

const allAvailableTags = ref<string[]>([])

// props から届く「このメモのタグ」を監視
const currentTags = computed(() => {
  if (!props.memo.memo_tags) return []
  return props.memo.memo_tags.map((mt: any) => mt.tag.title)
})

const tempSelectedTags = ref<string[]>([])

// メニューを開く
const openTagMenu = async () => {
  try {
    const response = await fetch('http://localhost:3000/memos/tags')
    const data = await response.json()
    if (data.items) allAvailableTags.value = data.items.map((t: any) => t.title)
  } catch (e) { console.error(e) }

  tempSelectedTags.value = [...currentTags.value]
  tagSearchQuery.value = ''
  isTagMenuOpen.value = true
}

// タグの絞り込み
const filteredTags = computed(() => {
  if (!tagSearchQuery.value) return allAvailableTags.value
  return allAvailableTags.value.filter(tag => 
    tag.toLowerCase().includes(tagSearchQuery.value.toLowerCase())
  )
})

const isExactMatch = computed(() => {
  const query = tagSearchQuery.value.trim().toLowerCase()
  return !query || allAvailableTags.value.some(tag => tag.toLowerCase() === query)
})

const addNewTag = () => {
  const name = tagSearchQuery.value.trim()
  if (name && !isExactMatch.value) {
    allAvailableTags.value.push(name)
    tempSelectedTags.value.push(name)
    tagSearchQuery.value = ''
  }
}

const toggleTag = (tag: string) => {
  const index = tempSelectedTags.value.indexOf(tag)
  if (index === -1) tempSelectedTags.value.push(tag)
  else tempSelectedTags.value.splice(index, 1)
}

// --- API操作関数 ---

const saveTags = async () => {
  await fetch(`http://localhost:3000/memos/${props.memo.id}/tags`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags: tempSelectedTags.value })
  });
  isTagMenuOpen.value = false
  emit('refresh')
}

const updateMemo = async () => {
  await fetch(`http://localhost:3000/memos`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: title.value, content: content.value, id: props.memo.id })
  })
  emit('refresh')
}

const deleteMemo = async () => {
  if(!confirm('このメモを削除しますか？')) return
  await fetch(`http://localhost:3000/memos/${props.memo.id}`, { method: 'DELETE' })
  emit('refresh')
}

const deleteSystemTag = async (tagToDelete: string) => {
  if (!confirm(`タグ「${tagToDelete}」を完全に削除しますか？`)) return
  await fetch(`http://localhost:3000/memos/tags/${encodeURIComponent(tagToDelete)}`, { method: 'DELETE' })
  emit('refresh')
}

const copyToClipboard = () => {
  navigator.clipboard.writeText(content.value)
  alert('コピーしました')
}
</script>

<template>
  <div class="memo-row">
    <textarea v-model="title" class="resizable-title"></textarea>
    <textarea v-model="content" class="resizable-content"></textarea>

    <div class="actions">
      <button @click="updateMemo" class="icon-btn">💾</button>
      <button @click="deleteMemo" class="icon-btn">🗑️</button>
      <button @click="copyToClipboard" class="icon-btn">📋</button>

      <div class="tag-dropdown-wrapper">
        <button @click="openTagMenu" class="icon-btn">⚙️</button>
        
        <div v-show="isTagMenuOpen" class="tag-dropdown-menu">
          <input v-model="tagSearchQuery" @keyup.enter="addNewTag" placeholder="タグを検索・追加..." class="tag-search-input" />
          
          <div class="selected-tags-preview">
            <span v-for="tag in tempSelectedTags" :key="tag" class="tag-chip">
              {{ tag }} <button @click="toggleTag(tag)">×</button>
            </span>
          </div>

          <ul class="tag-dropdown-list">
            <li v-if="!isExactMatch && tagSearchQuery" @click="addNewTag" class="tag-create-item">
              「{{ tagSearchQuery }}」を作成 ＋
            </li>
            <li v-for="tag in filteredTags" :key="tag" @click="toggleTag(tag)" 
                :class="{ 'is-selected': tempSelectedTags.includes(tag) }" class="tag-list-item">
              {{ tag }}
              <button @click.stop="deleteSystemTag(tag)" class="sys-tag-delete-btn">🗑️</button>
            </li>
          </ul>

          <div class="tag-menu-actions">
            <button @click="isTagMenuOpen = false">キャンセル</button>
            <button @click="saveTags" class="tag-save-btn">保存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>