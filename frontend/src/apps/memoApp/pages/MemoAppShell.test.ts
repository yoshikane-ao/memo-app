import { defineComponent, nextTick, reactive } from "vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MemoAppShell from "./MemoAppShell.vue";

const {
  historyShortcutsMock,
  copyShortcutsMock,
  clearMock,
  routerPushMock,
  setScopeMock,
} = vi.hoisted(() => ({
  historyShortcutsMock: vi.fn(),
  copyShortcutsMock: vi.fn(),
  clearMock: vi.fn(),
  routerPushMock: vi.fn(),
  setScopeMock: vi.fn(),
}));

const routeState = reactive({
  path: "/menu/workspace/memo/trash",
});

const viewStoreState = reactive<{
  currentScope: "active" | "trash";
}>({
  currentScope: "active",
});

vi.mock("vue-router", async () => {
  const actual = await vi.importActual<typeof import("vue-router")>("vue-router");
  return {
    ...actual,
    useRouter: () => ({ push: routerPushMock }),
    useRoute: () => routeState,
  };
});

vi.mock("../../../shared/history/useHistoryShortcuts", () => ({
  useHistoryShortcuts: historyShortcutsMock,
}));

vi.mock("../../../shared/copy/useCopyShortcuts", () => ({
  useCopyShortcuts: copyShortcutsMock,
}));

vi.mock("../../../shared/history/useHistoryManager", () => ({
  useHistoryManager: () => ({
    clear: clearMock,
  }),
}));

vi.mock("../features/view/model/useMemoViewStore", () => ({
  useMemoViewStore: () => ({
    get currentScope() {
      return viewStoreState.currentScope;
    },
    setScope: setScopeMock,
  }),
}));

const RouterViewStub = defineComponent({
  name: "RouterView",
  template: "<div class='router-view-stub' />",
});

describe("MemoAppShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeState.path = "/menu/workspace/memo/trash";
    viewStoreState.currentScope = "active";
    setScopeMock.mockImplementation((scope: "active" | "trash") => {
      viewStoreState.currentScope = scope;
    });
    routerPushMock.mockImplementation((path: string) => {
      routeState.path = path;
      return Promise.resolve();
    });
  });

  it("registers app-scoped shortcuts and clears history when the shell unmounts", () => {
    const wrapper = mount(MemoAppShell, {
      global: {
        stubs: {
          RouterView: RouterViewStub,
        },
      },
    });

    expect(historyShortcutsMock).toHaveBeenCalledTimes(1);
    expect(copyShortcutsMock).toHaveBeenCalledTimes(1);
    expect(setScopeMock).toHaveBeenCalledWith("trash");

    wrapper.unmount();

    expect(clearMock).toHaveBeenCalledTimes(1);
  });

  it("syncs the route when the view scope changes through app history", async () => {
    mount(MemoAppShell, {
      global: {
        stubs: {
          RouterView: RouterViewStub,
        },
      },
    });

    viewStoreState.currentScope = "active";
    await nextTick();

    expect(routerPushMock).toHaveBeenCalledWith("/menu/workspace/memo");
  });
});
