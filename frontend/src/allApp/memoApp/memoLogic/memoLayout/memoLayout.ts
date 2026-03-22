import axios from 'axios';

export const useMemoResize = (memoId: number) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const saveSize = (width: number, height: number) => {
        if (timeoutId) clearTimeout(timeoutId);
        
        timeoutId = setTimeout(async () => {
            try {
                await axios.put('http://localhost:3000/memos/layout', {
                    memoId,
                    width,
                    height
                });
            } catch (error) {
                console.error('サイズの保存に失敗しました:', error);
            }
        }, 500); // 500msのデバウンスで最後のみ保存
    };

    return { saveSize };
};