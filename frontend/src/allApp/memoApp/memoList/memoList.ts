import { ref } from 'vue';
import axios from 'axios';

export function useMemo() {
    // DBからきたメモ一覧を入れる「箱」
    const memos = ref([]);

    // 一覧を取得する関数
    const fetchMemos = async () => {
        try {
            // バックエンドの GET /memos/list を叩く
            const response = await axios.get('http://localhost:3000/memos/list');

            // バックエンドの json({ items: memos }) に合わせ、itemsを代入
            memos.value = response.data.items;
        } catch (error) {
            console.error("一覧の取得に失敗しました:", error);
        }
    };

    return { memos, fetchMemos };
}