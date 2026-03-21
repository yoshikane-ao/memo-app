import axios from 'axios';

export function memoDelete() {
    const executeDelete = async (id: number) => {
        if (!confirm('削除してもよろしいですか？')) return false;

        try {
            // バックエンドの delete.ts (DELETE /api/memos/:id) を叩く
            await axios.delete(`/memos/${id}`);
            return true; // 成功したら true を返す
        } catch (error) {
            console.error("削除失敗:", error);
            alert("削除に失敗しました");
            return false;
        }
    };

    return { executeDelete };
}