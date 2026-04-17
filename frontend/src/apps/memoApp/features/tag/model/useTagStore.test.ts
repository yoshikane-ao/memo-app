import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchTagList } from "../infrastructure/tag.repository";
import type { TagItem } from "./tag.types";
import { useTagStore } from "./useTagStore";
import { activateTestPinia } from "../../../../../test/pinia";

vi.mock("../infrastructure/tag.repository", () => ({
  fetchTagList: vi.fn(),
}));

const makeTag = (overrides: Partial<TagItem> = {}): TagItem => ({
  id: 1,
  title: "work",
  ...overrides,
});

describe("useTagStore", () => {
  beforeEach(() => {
    activateTestPinia();
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
    expect(store.error).toBeNull();
  });

  it("ensureLoaded skips fetching when items already exist", async () => {
    const store = useTagStore();
    store.items = [makeTag()];

    const success = await store.ensureLoaded();

    expect(success).toBe(true);
    expect(fetchTagList).not.toHaveBeenCalled();
  });

  it("sets an error when tag loading fails", async () => {
    vi.mocked(fetchTagList).mockRejectedValue(new Error("boom"));
    const store = useTagStore();

    const success = await store.fetchAll();

    expect(success).toBe(false);
    expect(store.error).toBe("Failed to fetch tags.");
    expect(store.items).toEqual([]);
  });

  it("addLocalTag upserts while keeping id order", () => {
    const store = useTagStore();
    store.setItems([makeTag({ id: 3, title: "later" }), makeTag({ id: 1, title: "work" })]);

    store.addLocalTag(makeTag({ id: 2, title: "home" }));
    store.addLocalTag(makeTag({ id: 1, title: "work updated" }));

    expect(store.items).toEqual([
      makeTag({ id: 1, title: "work updated" }),
      makeTag({ id: 2, title: "home" }),
      makeTag({ id: 3, title: "later" }),
    ]);
  });

  it("removeLocalTag drops the requested tag only", () => {
    const store = useTagStore();
    store.items = [makeTag(), makeTag({ id: 2, title: "home" })];

    store.removeLocalTag(1);

    expect(store.items).toEqual([makeTag({ id: 2, title: "home" })]);
  });
});
