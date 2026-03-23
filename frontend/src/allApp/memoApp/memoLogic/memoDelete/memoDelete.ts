import axios from 'axios';
import type { MemoIdProps } from '../types/memo-domain.types';

export function memoDelete() {
    const executeDelete = async (id: MemoIdProps['memoId']) => {
        try {
            await axios.delete(`http://localhost:3000/memos/delete/${id}`);
            return true;
        } catch {
            return false;
        }
    };

    return { executeDelete };
}
