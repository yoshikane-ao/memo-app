import axios from 'axios';

export function memoSeach() {
    /**
     * 検索を実行し、その結果のメモ配列を返す
     * @param keyword 検索する文字列
     * @param type 検索範囲 (all, title, content, tag)
     */
    const executeSearch = async (keyword: string, type: string) => {
        try {
            const response = await axios.get(`http://localhost:3000/memos/search`, {
                params: {
                    q: keyword,
                    type: type
                }
            });
            
            // バックエンドからは { items: memos } が返る
            return response.data.items;
        } catch (error) {
            console.error("検索に失敗しました:", error);
            // エラー時は呼び出し元（Vue）で無視できるようnull等を返す
            return null;
        }
    };

    return { executeSearch };
}
