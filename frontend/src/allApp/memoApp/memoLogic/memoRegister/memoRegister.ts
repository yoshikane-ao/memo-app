import axios from 'axios';
import type { MemoRegisterInput } from '../Types';

export function MemoRegister() {
    const executeRegister = async (memoData: MemoRegisterInput) => {
        try {
            await axios.post('http://localhost:3000/memos/register', {
                title: memoData.title,
                content: memoData.content,
                tags: memoData.tags ?? []
            });

            return true;
        } catch {
            return false;
        }
    };

    return { executeRegister };
}
