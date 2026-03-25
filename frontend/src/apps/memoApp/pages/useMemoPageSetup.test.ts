import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMemoPageSetup } from "./useMemoPageSetup";

const {
  fetchAllMock,
  clearMock,
  historyShortcutsMock,
  copyShortcutsMock,
  listViewState,
  useMemoListViewMock,
} = vi.hoisted(() => ({
  fetchAllMock: vi.fn(() => Promise.resolve(true)),
  clearMock: vi.fn(),
  historyShortcutsMock: vi.fn(),
  copyShortcutsMock: vi.fn(),
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
    items: [],
    fetchAll: fetchAllMock,
  }),
}));

vi.mock("./useMemoListView", () => ({
  useMemoListView: (...args: unknown[]) => {
    useMemoListViewMock(...args);
    return listViewState;
  },
}));

vi.mock("../../../shared/history/useHistoryManager", () => ({
  useHistoryManager: () => ({
    clear: clearMock,
  }),
}));

vi.mock("../../../shared/history/useHistoryShortcuts", () => ({
  useHistoryShortcuts: historyShortcutsMock,
}));

vi.mock("../../../shared/copy/useCopyShortcuts", () => ({
  useCopyShortcuts: copyShortcutsMock,
}));

describe("useMemoPageSetup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes shortcuts and loads memos on mount", async () => {
    const TestHost = defineComponent({
      template: "<div />",
      setup() {
        return useMemoPageSetup();
      },
    });

    mount(TestHost);

    expect(historyShortcutsMock).toHaveBeenCalledTimes(1);
    expect(copyShortcutsMock).toHaveBeenCalledTimes(1);
    expect(clearMock).toHaveBeenCalledTimes(1);
    expect(fetchAllMock).toHaveBeenCalledTimes(1);
    expect(fetchAllMock).toHaveBeenCalledWith("active");
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
    expect(useMemoListViewMock).toHaveBeenCalledWith(expect.anything(), listViewOptions);
  });
});
