<script setup>
import { ref, watch, onMounted } from 'vue';
import axios from 'axios';
import inputBaseField from '../../../shared/inputBaseField.vue';

const props = defineProps({
  keyword: String,
  searchType: String,
  sortOrder: String,
  selectedTags: Array
});

const emit = defineEmits(['update:keyword', 'update:searchType', 'update:sortOrder', 'update:selectedTags']);

const localKeyword = ref(props.keyword || '');
const localSearchType = ref(props.searchType || 'all');
const localSortOrder = ref(props.sortOrder || 'custom');
const localSelectedTags = ref([...(props.selectedTags || [])]);

const allTags = ref([]);
const isDropdownOpen = ref(false); // プルダウンの開閉状態

onMounted(async () => {
  try {
    const res = await axios.get('http://localhost:3000/tags/list');
    allTags.value = res.data.items || [];
  } catch (e) {
    console.error('タグ一覧の取得に失敗しました', e);
  }
});

watch(localKeyword, (val) => emit('update:keyword', val));
watch(localSearchType, (val) => emit('update:searchType', val));
watch(localSortOrder, (val) => emit('update:sortOrder', val));
watch(localSelectedTags, (val) => emit('update:selectedTags', val), { deep: true });

const toggleTag = (tagId) => {
  const index = localSelectedTags.value.indexOf(tagId);
  if (index === -1) {
    localSelectedTags.value.push(tagId);
  } else {
    localSelectedTags.value.splice(index, 1);
  }
};
</script>

<template>
  <div class="view-control-container">
    <!-- 検索欄 -->
    <input
      type="text"
      id="search-input"
      v-model="localKeyword"
      placeholder="🔍 検索"
      spellcheck="false"
      class="search-input-compact"
    />

    <!-- 検索条件 -->
    <select v-model="localSearchType" class="sort-select">
      <option value="all">全て</option>
      <option value="title">タイトル</option>
      <option value="content">内容</option>
      <option value="tag">タグ名</option>
    </select>

    <!-- タグで絞り込む -->
    <div class="dropdown-container" v-if="allTags.length > 0">
      <button class="dropdown-toggle" @click="isDropdownOpen = !isDropdownOpen">
        タグで絞り込む {{ localSelectedTags.length > 0 ? `(${localSelectedTags.length})` : '' }} ▼
      </button>
      <div class="dropdown-menu" v-if="isDropdownOpen">
        <label 
          v-for="tag in allTags" 
          :key="tag.id"
          class="dropdown-item"
        >
          <input 
            type="checkbox" 
            :value="tag.id" 
            :checked="localSelectedTags.includes(tag.id)"
            @change="toggleTag(tag.id)"
          />
          #{{ tag.title }}
        </label>
      </div>
    </div>
  </div>
</template>

<!-- <style scoped>
.view-control-container {
  margin-bottom: 2rem;
  background-color: #f7f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #eaeaea;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.search-sort-row {
  display: flex;
  gap: 15px;
  align-items: center;
}

.search-box {
  flex: 1;
}

.sort-select {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  background-color: #fff;
  cursor: pointer;
  outline: none;
}
.sort-select:focus {
  border-color: #4a90e2;
}

/* プルダウン用のCSS */
.dropdown-container {
  position: relative;
  display: inline-block;
}

.dropdown-toggle {
  background: #fff;
  border: 1px solid #ccc;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #333;
  transition: background-color 0.2s;
}

.dropdown-toggle:hover {
  background-color: #f0f0f0;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 5px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
  z-index: 100;
  max-height: 250px;
  overflow-y: auto;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #444;
  padding: 4px;
}

.dropdown-item:hover {
  background-color: #f4f7f9;
  border-radius: 4px;
}
</style> -->
