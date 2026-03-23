import type { MemoApiItem } from '../types/memo-domain.types';
import type { TagDeletedPayload } from '../../tagLogic/Types';

export interface MemoDraft {
  title: string;
  content: string;
}

export interface MemoRegisterFormProps extends MemoDraft {
  isRegisterDisabled: boolean;
  tagSelectionResetKey: number;
}

export interface MemoRegisterFieldsProps extends MemoDraft {}

export interface MemoRegisterInput extends MemoDraft {
  tags?: string[];
}

export type MemoCreatedPayload = MemoApiItem;

export type MemoRegisterEmits = {
  (e: 'memo-created', payload: MemoCreatedPayload): void;
  (e: 'tag-deleted', tagId: TagDeletedPayload): void;
};

export type MemoRegisterFormEmits = {
  (e: 'update:title', value: string): void;
  (e: 'update:content', value: string): void;
  (e: 'update:selectedTitles', value: string[]): void;
  (e: 'tag-deleted', tagId: TagDeletedPayload): void;
  (e: 'submit'): void;
};

export type MemoRegisterFieldsEmits = {
  (e: 'update:title', value: string): void;
  (e: 'update:content', value: string): void;
};
