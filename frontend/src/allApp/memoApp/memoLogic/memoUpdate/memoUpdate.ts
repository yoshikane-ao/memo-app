import axios from 'axios';

export function memoUpdate() {
    /**
     * バリデーションチェック用の関数
     * ボタンの活性・非活性判定や、実行前の最終チェックに使用します。
     */
    const validateUpdate = (
        title: string, content: string, originalTitle: string, originalContent: string,
        currentWidth?: number | null, originalWidth?: number | null,
        currentHeight?: number | null, originalHeight?: number | null
    ) => {
        // 1. 文字列チェック
        const isEmpty = !title?.trim() || !content?.trim();
        const isTextChanged = title !== originalTitle || content !== originalContent;

        // 2. サイズ変更チェック
        let isSizeChanged = false;

        // DBに未設定(null)の場合フロントからはundefinedが渡ることがあるため、便宜上 0 または -1 に変換して比較する
        const w1 = currentWidth != null ? currentWidth : 0;
        const w2 = originalWidth != null ? originalWidth : 0;
        const h1 = currentHeight != null ? currentHeight : 0;
        const h2 = originalHeight != null ? originalHeight : 0;

        // フロントでリサイズされて0以外の値が入り、かつ元の値と異なれば変更あり
        if ((w1 > 0 && w1 !== w2) || (h1 > 0 && h1 !== h2)) {
            isSizeChanged = true;
        }

        return !isEmpty && (isTextChanged || isSizeChanged);
    };

    /**
     * メモを更新する関数
     */
    const executeUpdate = async (
        id: number,
        title: string,
        content: string,
        originalTitle: string,
        originalContent: string,
        currentWidth?: number,
        originalWidth?: number | null,
        currentHeight?: number,
        originalHeight?: number | null
    ) => {
        // 実行直前にもう一度バリデーションを回して安全性を担保
        if (!validateUpdate(title, content, originalTitle, originalContent, currentWidth, originalWidth, currentHeight, originalHeight)) {
            // ここに到達するのはバリデーションを無視して実行された場合のみ
            return false;
        }

        try {
            const response = await axios.put(`http://localhost:3000/memos/update`, {
                id: id,
                title: title,
                content: content,
                width: currentWidth,
                height: currentHeight
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