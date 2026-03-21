import axios from 'axios';

export function useTagRegister() {
    /**
     * 新しいタグを作成し、特定のメモに紐付ける（memoIdが任意）
     * @param memoId 紐付け対象のメモID（任意）
     * @param tagTitle 作成するタグのタイトル
     */
    const registerTag = async (memoId: number | undefined, tagTitle: string) => {
        if (!tagTitle.trim()) return null;

        try {
            const response = await axios.post(`http://localhost:3000/tags`, {
                memoId: memoId,
                title: tagTitle.trim()
            });

            return response.data; // 登録されたタグ情報
        } catch (error) {
            console.error("タグの登録に失敗しました:", error);
            return null;
        }
    };

    return { registerTag };
}