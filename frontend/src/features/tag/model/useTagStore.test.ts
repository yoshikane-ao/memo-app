import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import {
  createTag as createTagRequest,
  deleteTag as deleteTagRequest,
  fetchTagList,
  linkTagToMemo as linkTagToMemoRequest,
  unlinkTagFromMemo as unlinkTagFromMemoRequest,
} from "../api/tag.repository";
import type { TagItem } from "./tag.types";
import { useTagStore } from "./useTagStore";

vi.mock("../api/tag.repository", () => ({
  fetchTagList: vi.fn(),
  createTag: vi.fn(),
  deleteTag: vi.fn(),
  linkTagToMemo: vi.fn(),
  unlinkTagFromMemo: vi.fn(),
}));

const makeTag = (overrides: Partial<TagItem> = {}): TagItem => ({
  id: 1,
  title: "work",
  ...overrides,
});

describe("useTagStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("fetchAll replaces items from the repository", async () => {
    const tags = [makeTag(), makeTag({ id: 2, title: "home" })];
    vi.mocked(fetchTagList).mockResolvedValue(tags);
    const store = useTagStore();

    const success = await store.fetchAll();

    expect(success).toBe(true);
    expect(store.items).toEqual(tags);
    expect(store.loading).toBe(false);
  });

  it("ensureLoaded skips fetching when items already exist", async () => {
    const store = useTagStore();
    store.items = [makeTag()];

    const success = await store.ensureLoaded();

    expect(success).toBe(true);
    expect(fetchTagList).not.toHaveBeenCalled();
  });

  it("createTag adds a new tag only once", async () => {
    const created = makeTag({ id: 5, title: "later" });
    vi.mocked(createTagRequest).mockResolvedValue(created);
    const store = useTagStore();

    const result = await store.createTag({ title: "later", memoId: 3 });
    store.addLocalTag(created);

    expect(result).toEqual(created);
    expect(store.items).toEqual([created]);
  });

  it("deleteTag removes the tag locally after success", async () => {
    vi.mocked(deleteTagRequest).mockResolvedValue();
    const store = useTagStore();
    store.items = [makeTag(), makeTag({ id: 2, title: "home" })];

    const success = await store.deleteTag(1);

    expect(success).toBe(true);
    expect(store.items).toEqual([makeTag({ id: 2, title: "home" })]);
  });

  it("returns true when linking and unlinking a tag succeeds", async () => {
    vi.mocked(linkTagToMemoRequest).mockResolvedValue();
    vi.mocked(unlinkTagFromMemoRequest).mockResolvedValue();
    const store = useTagStore();

    await expect(store.linkTagToMemo(1, 2)).resolves.toBe(true);
    await expect(store.unlinkTagFromMemo(1, 2)).resolves.toBe(true);
  });

  it("sets an error when tag creation fails", async () => {
    vi.mocked(createTagRequest).mockRejectedValue(new Error("boom"));
    const store = useTagStore();

    const result = await store.createTag({ title: "broken" });

    expect(result).toBeNull();
    expect(store.error).toBe("Failed to create tag.");
  });
});
