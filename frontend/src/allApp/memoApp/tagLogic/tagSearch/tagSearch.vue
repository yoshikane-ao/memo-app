<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { useTagSearch } from './tagSearch';
import tagRegister from '../tagRegister/tagRegister.vue';
import axios from 'axios';

// 新規作成でも使い回せるよう memoId をオプショナルに
const props = defineProps<{ 
  memoId?: number;
  linkedTagIds?: number[]; // 既に紐付いているタグIDの配列
}>();
const emit = defineEmits(['close', 'tag-added', 'tag-removed', 'tag-deleted']);

const { searchQuery, filteredTags, hasExactMatch, fetchAllTags } = useTagSearch();

const modalRef = ref<HTMLElement | null>(null);

// タグをクリック → 紐付き済みなら解除、未紐付きなら追加（トグル）
const toggleTag = async (tag: { id: number, title: string }) => {
  const linked = isLinked(tag.id);

  if (props.memoId) {
    // 既存メモモード: APIで直接紐付け/解除
    try {
      if (linked) {
        await axios.delete(`http://localhost:3000/tags/unlink/${props.memoId}/${tag.id}`);
      } else {
        await axios.post(`http://localhost:3000/tags/link`, { memoId: props.memoId, tagId: tag.id });
      }
      emit('tag-added', tag); // 親にリスト再取得を通知
    } catch (error) {
      alert(linked ? "タグの解除に失敗しました" : "タグの紐付けに失敗しました");
    }
  } else {
    // 新規作成モード: ローカル状態のトグル
    if (linked) {
      emit('tag-removed', tag);
    } else {
      emit('tag-added', tag);
    }
  }
};

// タグをシステムから完全削除
const deleteTagFromSystem = async (tag: { id: number, title: string }) => {
  if (!confirm(`タグ「${tag.title}」をシステムから完全に削除しますか？\n（全メモとの紐付けも解除されます）`)) return;
  try {
    await axios.delete(`http://localhost:3000/tags/system-delete/${tag.id}`);
    await fetchAllTags(); // ポップアップ内のリストを更新
    emit('tag-deleted'); // 親のメモリストも再取得させる
  } catch (error) {
    alert("タグの削除に失敗しました");
  }
};

const handleTagRegistered = async (newTag: any) => {
  emit('tag-added', newTag);
  searchQuery.value = ''; // 新規作成したら検索窓を空欄にする
  await fetchAllTags(); // 新規追加されたタグを即時（リストに）反映させる
};

// そのタグが既にメモに紐付いているかどうかを判定
const isLinked = (tagId: number): boolean => {
  return (props.linkedTagIds ?? []).includes(tagId);
};

// 外側クリックで閉じる
const onClickOutside = (event: MouseEvent) => {
  if (modalRef.value && !modalRef.value.contains(event.target as Node)) {
    emit('close');
  }
};

onMounted(() => {
  fetchAllTags();
  // 少し遅らせて登録（開いた瞬間のクリックで即閉じしないように）
  setTimeout(() => {
    document.addEventListener('click', onClickOutside, true);
  }, 100);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside, true);
});
</script>

<template>
  <div class="tag-search-modal" ref="modalRef">
    <input 
      v-model="searchQuery" 
      type="text" 
      placeholder="タグを検索・作成..." 
      class="search-input"
    />

    <div class="tag-list">
      <div 
        v-for="tag in filteredTags" 
        :key="tag.id" 
        class="tag-item"
        :class="{ 'tag-linked': isLinked(tag.id) }"
      >
        <button class="tag-select-btn" @click="toggleTag(tag)">
          <span v-if="isLinked(tag.id)" class="link-indicator">✓</span>
          # {{ tag.title }}
        </button>
        <button class="tag-delete-sys-btn" @click.prevent.stop="deleteTagFromSystem(tag)" title="タグを完全削除">×</button>
      </div>
    </div>

    <!-- ここに新規タグ作成コンポーネントを埋め込む -->
    <tagRegister 
      v-if="!hasExactMatch && searchQuery.trim() !== ''" 
      :memoId="memoId" 
      :inputTitle="searchQuery" 
      @tag-registered="handleTagRegistered"
    />

    <button class="close-btn" @click="emit('close')">閉じる</button>
  </div>
</template>

<style scoped>
.tag-search-modal {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 0;
  width: 260px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.6);
  padding: 10px;
  z-index: 200;
}
.search-input {
  width: 100%;
  padding: 6px 10px;
  margin-bottom: 8px;
  box-sizing: border-box;
  background: #0d0d0d;
  color: #ddd;
  border: 1px solid #333;
  border-radius: 4px;
  font-size: 0.8rem;
  font-family: inherit;
}
.search-input:focus {
  outline: none;
  border-color: #666;
}
.tag-list {
  max-height: 180px;
  overflow-y: auto;
}
.tag-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 4px;
  transition: background 0.1s;
}
.tag-item:hover {
  background: #222;
}
.tag-item.tag-linked {
  background: rgba(108, 140, 255, 0.12);
}
.tag-item.tag-linked .tag-select-btn {
  color: #8cacff;
  font-weight: 600;
}
.tag-select-btn {
  flex: 1;
  text-align: left;
  padding: 6px 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: #ccc;
  font-size: 0.8rem;
  font-family: inherit;
}
.tag-select-btn:hover {
  color: #fff;
}
.link-indicator {
  color: #6c8cff;
  margin-right: 4px;
  font-weight: bold;
}
.tag-delete-sys-btn {
  background: rgba(232, 85, 85, 0.15);
  border: 1px solid rgba(232, 85, 85, 0.3);
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #e85555;
  padding: 2px 6px;
  line-height: 1;
  transition: all 0.15s;
}
.tag-delete-sys-btn:hover {
  background: #e85555;
  color: #fff;
  border-color: #e85555;
}
.close-btn {
  width: 100%;
  margin-top: 8px;
  font-size: 0.75rem;
  padding: 5px;
  background: transparent;
  border: 1px solid #333;
  color: #888;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
}
.close-btn:hover {
  background: #222;
  color: #ccc;
}
</style>