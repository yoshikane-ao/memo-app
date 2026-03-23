export type TagItem = {
  id: number;
  title: string;
};

export interface TagFilterFieldProps {
  selectedTags?: number[];
}

export type TagFilterFieldEmits = {
  (e: 'update:selectedTags', value: number[]): void;
};

export interface TagRelationFieldProps {
  memoId: number;
  tags: TagItem[];
}

export type TagRelationFieldEmits = {
  (e: 'changed'): void;
};

export interface TagSelectionFieldProps {
  resetKey?: number;
}

export type TagSelectionFieldEmits = {
  (e: 'update:selectedTitles', value: string[]): void;
};
