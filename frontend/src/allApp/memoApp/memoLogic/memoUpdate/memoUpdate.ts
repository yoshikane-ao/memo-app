import axios from 'axios';
import type { MemoUpdateInput } from '../Types';

export function memoUpdate() {
    const executeUpdate = async (input: MemoUpdateInput) => {
        try {
            await axios.put('http://localhost:3000/memos/update', {
                id: input.id,
                title: input.title,
                content: input.content,
                width: input.width,
                height: input.height
            });

            return true;
        } catch {
            return false;
        }
    };

    return { executeUpdate };
}
