import type { MemoIdProps } from '../types/memo-domain.types';

export interface MemoUpdateInput {
  id: number;
  title: string;
  content: string;
  width?: number;
  height?: number;
}

export interface MemoUpdatedPayload {
  memoId: number;
  title: string;
  content: string;
  width?: number;
  height?: number;
}

export interface MemoUpdateProps extends MemoIdProps {
  title: string;
  content: string;
  initialTitle: string;
  initialContent: string;
  currentWidth?: number;
  initialWidth?: number | null;
  currentHeight?: number;
  initialHeight?: number | null;
}

export type MemoUpdateEmits = {
  (e: 'memo-updated', payload: MemoUpdatedPayload): void;
};
