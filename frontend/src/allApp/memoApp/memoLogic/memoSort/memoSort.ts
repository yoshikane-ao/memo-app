import axios from 'axios';

export const saveSortOrder = async (memos: any[]) => {
    const items = memos.map((memo, index) => ({
        id: memo.id,
        orderIndex: index
    }));

    try {
        await axios.put('http://localhost:3000/memos/sort', { items });
    } catch (error) {
        console.error("並び順の保存に失敗しました:", error);
    }
};