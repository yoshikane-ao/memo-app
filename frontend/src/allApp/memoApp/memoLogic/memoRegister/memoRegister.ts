import axios from 'axios';

export function MemoRegister() {
    /**
     * メモを新規登録する関数
     * @param {Object} memoData - { title: string, content: string } の形式
     * @returns {Promise<boolean>} - 成功したら true, 失敗したら false
     */
    const executeRegister = async (memoData: { title: string, content: string, tags?: string[] }) => {
        // 簡単なバリデーション（入力チェック）
        if (!memoData.title.trim() || !memoData.content.trim()) {
            return false;
        }

        try {
            // バックエンドの POST /api/memos を叩く
            // Viteのプロキシ設定を使っている前提なので、ドメイン（localhost:3000）は省略
            const response = await axios.post('http://localhost:3000/memos/register', {
                title: memoData.title,
                content: memoData.content,
                tags: memoData.tags || []
            });

            if (response.status === 201 || response.status === 200) {
                console.log("登録成功:", response.data);
                return true;
            }
            return false;

        } catch (error) {
            console.error("登録失敗:", error);
            alert("サーバーへの登録に失敗しました");
            return false;
        }
    };

    return { executeRegister };
}