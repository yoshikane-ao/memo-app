import { ref } from 'vue';
import axios from 'axios';

export function memoList() {
    // DBからきたメモ一覧を入れる「箱」
    const memos = ref([]);

    // 一覧を取得する関数
    const fetchMemos = async () => {
        try {
            // 現在の検索小窓の開閉状態を記憶しておく
            const showTagSearchMap = new Map();
            memos.value.forEach((m: any) => {
                showTagSearchMap.set(m.id, m.showTagSearch);
            });

            // バックエンドの GET /memos/list を叩く
            const response = await axios.get('http://localhost:3000/memos/list');

            // バックエンドの json({ items: memos }) に合わせ、itemsを代入
            // その際、更新判定に使うため「初期状態のタイトル・内容」をコピーして保持する
            memos.value = response.data.items.map((item: any) => ({
                ...item,
                initialTitle: item.title,
                initialContent: item.content,
                // 既存のメモなら元の状態を引き継ぎ、新規なら閉じた状態にする
                showTagSearch: showTagSearchMap.get(item.id) || false
            }));
        } catch (error) {
            console.error("一覧の取得に失敗しました:", error);
        }
    };

    return { memos, fetchMemos };
}