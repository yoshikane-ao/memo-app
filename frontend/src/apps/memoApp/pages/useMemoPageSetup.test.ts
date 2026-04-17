import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMemoPageSetup } from "./useMemoPageSetup";

const {
  fetchAllMock,
  ensureTagsLoadedMock,
  listViewState,
  useMemoListViewMock,
} = vi.hoisted(() => ({
  fetchAllMock: vi.fn(() => Promise.resolve(true)),
  ensureTagsLoadedMock: vi.fn(() => Promise.resolve(true)),
  useMemoListViewMock: vi.fn(),
  listViewState: {
    keyword: "",
    searchType: "all",
    sortOrder: "custom",
    selectedTags: [],
    displayedMemos: [],
    canReorder: true,
  },
}));

vi.mock("../features/memo", () => ({
  useMemoStore: () => ({
    getItemsForScope: vi.fn(() => []),
    fetchAll: fetchAllMock,
  }),
}));

vi.mock("../features/tag", () => ({
  useTagStore: () => ({
    ensureLoaded: ensureTagsLoadedMock,
  }),
}));

vi.mock("./useMemoListView", () => ({
  useMemoListView: (...args: unknown[]) => {
    useMemoListViewMock(...args);
    return listViewState;
  },
}));

describe("useMemoPageSetup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads memos and shared tag state on mount", async () => {
    const TestHost = defineComponent({
      template: "<div />",
      setup() {
        return useMemoPageSetup();
      },
    });

    mount(TestHost);

    expect(fetchAllMock).toHaveBeenCalledTimes(1);
    expect(fetchAllMock).toHaveBeenCalledWith("active");
    expect(ensureTagsLoadedMock).toHaveBeenCalledTimes(1);
  });

  it("passes scope and list view options through to the page setup dependencies", async () => {
    const listViewOptions = {
      allowManualReorder: false,
      defaultSortOrder: "newest" as const,
      sortTimestamp: "deletedAt" as const,
    };
    const TestHost = defineComponent({
      template: "<div />",
      setup() {
        return useMemoPageSetup({
          scope: "trash",
          listView: listViewOptions,
        });
      },
    });

    mount(TestHost);

    expect(fetchAllMock).toHaveBeenCalledWith("trash");
    expect(ensureTagsLoadedMock).toHaveBeenCalledTimes(1);
    expect(useMemoListViewMock).toHaveBeenCalledWith(expect.anything(), listViewOptions);
  });
});
