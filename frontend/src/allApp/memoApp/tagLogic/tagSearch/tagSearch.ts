// tagLogic/tagSearch/tagSearch.ts
import { ref, computed } from 'vue';
import axios from 'axios';

export function useTagSearch() {
    const allTags = ref<{ id: number; title: string }[]>([]);
    const searchQuery = ref('');

    // 全タグを取得
    const fetchAllTags = async () => {
        try {
            const response = await axios.get('http://localhost:3000/tags/list'); // 全タグ取得API
            allTags.value = response.data.items;
        } catch (error) {
            console.error("タグ一覧の取得失敗:", error);
        }
    };

    // インスタント検索（入力文字に一致するタグを抽出）
    const filteredTags = computed(() => {
        const query = searchQuery.value.trim().toLowerCase();
        if (!query) return allTags.value;
        return allTags.value.filter(tag => tag.title.toLowerCase().includes(query));
    });

    // 既存のタグと完全に一致するものがあるかチェック（新規作成ボタンを出すか決める）
    const hasExactMatch = computed(() => {
        return allTags.value.some(tag => tag.title === searchQuery.value.trim());
    });

    return { searchQuery, filteredTags, hasExactMatch, fetchAllTags };
}