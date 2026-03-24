export type MemoSearchType = "all" | "title" | "content" | "tag";
export type MemoSortOrder = "custom" | "newest" | "oldest";

export interface MemoToolbarProps {
  keyword: string;
  searchType: MemoSearchType;
  sortOrder: MemoSortOrder;
  selectedTags: number[];
}

export type MemoToolbarEmits = {
  (e: "update:keyword", value: string): void;
  (e: "update:searchType", value: MemoSearchType): void;
  (e: "update:sortOrder", value: MemoSortOrder): void;
  (e: "update:selectedTags", value: number[]): void;
  (e: "tag-deleted", tagId: number): void;
};
