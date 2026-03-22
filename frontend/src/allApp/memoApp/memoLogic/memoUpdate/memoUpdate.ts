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

        // DBに未設定(null)の場合、フロントでユーザーが明示的にリサイズしない限り変更なしとする
        const isWidthChanged = (currentWidth != null) && (currentWidth !== originalWidth) && !(originalWidth == null && currentWidth === 0);
        const isHeightChanged = (currentHeight != null) && (currentHeight !== originalHeight) && !(originalHeight == null && currentHeight === 0);

        if (isWidthChanged || isHeightChanged) {
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