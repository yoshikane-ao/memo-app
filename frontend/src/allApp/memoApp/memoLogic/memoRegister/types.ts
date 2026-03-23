export interface MemoDraft {
  title: string;
  content: string;
}

export interface MemoRegisterFormProps extends MemoDraft {
  isRegisterDisabled: boolean;
  tagSelectionResetKey: number;
}

export interface MemoRegisterInput extends MemoDraft {
  tags?: string[];
}

export type MemoRegisterEmits = {
  (e: 'created'): void;
};

export type MemoRegisterFormEmits = {
  (e: 'update:title', value: string): void;
  (e: 'update:content', value: string): void;
  (e: 'update:selectedTitles', value: string[]): void;
  (e: 'submit'): void;
};
