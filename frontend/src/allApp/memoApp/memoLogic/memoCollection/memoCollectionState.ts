import { ref } from 'vue';
import type { MemoListItem } from '../types/memo-domain.types';

export const memos = ref<MemoListItem[]>([]);
