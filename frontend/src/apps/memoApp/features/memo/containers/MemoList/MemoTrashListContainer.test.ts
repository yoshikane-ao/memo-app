import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Memo } from "../../model/memo.types";
import MemoTrashListContainer from "./MemoTrashListContainer.vue";

const commandsMock = {
  restoreMemoFromTrash: vi.fn(),
  purgeMemo: vi.fn(),
};

vi.mock("../../application/useMemoCommands", () => ({
  useMemoHistoryCommands: () => commandsMock,
}));

const feedbackMock = {
  showError: vi.fn(),
};

vi.mock("../../../../../../shared/feedback/useFeedbackStore", () => ({
  useFeedbackStore: () => feedbackMock,
}));

const MemoTrashListStub = defineComponent({
  name: "MemoTrashList",
  props: {
    items: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["restore-requested", "purge-requested"],
  template: `
    <div>
      <button class="emit-restore" @click="$emit('restore-requested', 1)">restore</button>
      <button class="emit-purge" @click="$emit('purge-requested', 1)">purge</button>
    </div>
  `,
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

describe("MemoTrashListContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockImplementation(() => true);
  });

  it("restores memos from trash through the command layer", async () => {
    commandsMock.restoreMemoFromTrash.mockResolvedValue({ ok: true, value: undefined });

    const wrapper = mount(MemoTrashListContainer, {
      props: {
        items: [makeMemo()],
      },
      global: {
        stubs: {
          MemoTrashList: MemoTrashListStub,
        },
      },
    });

    await wrapper.get(".emit-restore").trigger("click");
    await flushPromises();

    expect(commandsMock.restoreMemoFromTrash).toHaveBeenCalledWith(1);
  });

  it("confirms before permanently deleting a trashed memo", async () => {
    commandsMock.purgeMemo.mockResolvedValue({ ok: true, value: undefined });

    const wrapper = mount(MemoTrashListContainer, {
      props: {
        items: [makeMemo()],
      },
      global: {
        stubs: {
          MemoTrashList: MemoTrashListStub,
        },
      },
    });

    await wrapper.get(".emit-purge").trigger("click");
    await flushPromises();

    expect(window.confirm).toHaveBeenCalledWith("このメモを完全に削除しますか？");
    expect(commandsMock.purgeMemo).toHaveBeenCalledWith(1);
  });
});
