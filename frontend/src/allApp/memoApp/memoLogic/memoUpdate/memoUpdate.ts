import axios from 'axios';

export function memoUpdate() {
    /**
     * バリデーションチェック用の関数
     * ボタンの活性・非活性判定や、実行前の最終チェックに使用します。
     */
    const validateUpdate = (title: string, content: string, originalTitle: string, originalContent: string) => {
        // 1. 空文字チェック
        const isEmpty = !title?.trim() || !content?.trim();

        // 2. 変更があるかチェック（「タイトルまたは内容が違う」＝ true）
        const hasChanged = title !== originalTitle || content !== originalContent;

        // 保存可能かどうかの結果を返す（「空ではなく、かつ変更がある」場合のみ OK）
        return !isEmpty && hasChanged;
    };

    /**
     * メモを更新する関数
     */
    const executeUpdate = async (
        id: number,
        title: string,
        content: string,
        originalTitle: string,
        originalContent: string
    ) => {
        // 実行直前にもう一度バリデーションを回して安全性を担保
        if (!validateUpdate(title, content, originalTitle, originalContent)) {
            // ここに到達するのはバリデーションを無視して実行された場合のみ
            return false;
        }

        try {
            const response = await axios.put(`http://localhost:3000/memos/update`, {
                id: id,
                title: title,
                content: content
            });

            if (response.status === 200 || response.status === 201) {
                console.log("更新成功:", response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error("更新失敗:", error);
            alert("サーバーへの保存に失敗しました");
            return false;
        }
    };

    return { executeUpdate, validateUpdate };
}