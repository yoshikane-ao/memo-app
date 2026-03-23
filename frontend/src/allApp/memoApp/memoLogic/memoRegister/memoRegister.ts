import axios from 'axios';
import type { MemoCreatedPayload, MemoRegisterInput } from './types';

export function MemoRegister() {
    const executeRegister = async (memoData: MemoRegisterInput) => {
        try {
            const response = await axios.post<MemoCreatedPayload>('http://localhost:3000/memos/register', {
                title: memoData.title,
                content: memoData.content,
                tags: memoData.tags ?? []
            });

            return response.data;
        } catch {
            return null;
        }
    };

    return { executeRegister };
}
