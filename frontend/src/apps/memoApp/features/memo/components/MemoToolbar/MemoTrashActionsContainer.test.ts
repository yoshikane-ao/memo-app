import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Memo } from "../../model/memo.types";
import MemoTrashActionsContainer from "./MemoTrashActionsContainer.vue";

const commandsMock = {
  purgeAllTrash: vi.fn(),
};

const feedbackMock = {
  showError: vi.fn(),
  showInfo: vi.fn(),
};

const memoStoreMock = {
  trashItems: [] as Memo[],
};

vi.mock("../../model/useMemoHistoryCommands", () => ({
  useMemoHistoryCommands: () => commandsMock,
}));

vi.mock("../../model/useMemoStore", () => ({
  useMemoStore: () => memoStoreMock,
}));

vi.mock("../../../../../../shared/feedback/useFeedbackStore", () => ({
  useFeedbackStore: () => feedbackMock,
}));

const MemoTrashActionsBarStub = defineComponent({
  name: "MemoTrashActionsBar",
  props: {
    trashCount: {
      type: Number,
      required: true,
    },
    isBusy: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["purge-all-requested"],
  template:
    '<button class="emit-purge-all" @click="$emit(\'purge-all-requested\')">purge all</button>',
});

const makeMemo = (overrides: Partial<Memo> = {}): Memo => ({
  id: 1,
  orderIndex: 0,
  width: 180,
  height: 48,
  title: "Alpha",
  content: "First memo",
  deletedAt: "2026-03-25T10:00:00.000Z",
  createdAt: "2026-03-20T10:00:00.000Z",
  updatedAt: "2026-03-20T10:00:00.000Z",
  memo_tags: [],
  ...overrides,
});

describe("MemoTrashActionsContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    memoStoreMock.trashItems = [makeMemo()];
    vi.spyOn(window, "confirm").mockImplementation(() => true);
  });

  it("confirms before purging the entire trash collection", async () => {
    commandsMock.purgeAllTrash.mockResolvedValue({ ok: true, value: 1 });

    const wrapper = mount(MemoTrashActionsContainer, {
      global: {
        stubs: {
          MemoTrashActionsBar: MemoTrashActionsBarStub,
        },
      },
    });

    await wrapper.get(".emit-purge-all").trigger("click");
    await flushPromises();

    expect(window.confirm).toHaveBeenCalledWith("Delete all trashed memos forever?");
    expect(commandsMock.purgeAllTrash).toHaveBeenCalledTimes(1);
    expect(feedbackMock.showInfo).toHaveBeenCalledWith("Deleted 1 trashed memo.");
  });

  it("shows an error message when the bulk purge command fails", async () => {
    commandsMock.purgeAllTrash.mockResolvedValue({
      ok: false,
      reason: "error",
      error: new Error("Request failed."),
    });

    const wrapper = mount(MemoTrashActionsContainer, {
      global: {
        stubs: {
          MemoTrashActionsBar: MemoTrashActionsBarStub,
        },
      },
    });

    await wrapper.get(".emit-purge-all").trigger("click");
    await flushPromises();

    expect(feedbackMock.showError).toHaveBeenCalledWith("Request failed.");
  });
});
