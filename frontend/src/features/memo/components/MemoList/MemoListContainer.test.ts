import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Memo } from "../../model/memo.types";
import MemoListContainer from "./MemoListContainer.vue";

const storeMock = {
  reorderMemos: vi.fn(),
  updateMemo: vi.fn(),
  deleteMemo: vi.fn(),
};

vi.mock("../../model/useMemoHistoryCommands", () => ({
  useMemoHistoryCommands: () => storeMock,
}));

const feedbackMock = {
  showError: vi.fn(),
};

vi.mock("../../../../shared/feedback/useFeedbackStore", () => ({
  useFeedbackStore: () => feedbackMock,
}));

const MemoListStub = defineComponent({
  name: "MemoList",
  props: {
    items: {
      type: Array,
      default: () => [],
    },
    canReorder: Boolean,
  },
  emits: ["reorder-requested", "save-requested", "delete-requested", "memo-tags-updated", "tag-deleted"],
  template: `
    <div>
      <button class="emit-reorder" @click="$emit('reorder-requested', items)">reorder</button>
      <button
        class="emit-save"
        @click="$emit('save-requested', { memoId: 1, title: 'Updated', content: 'Body', width: 240, height: 80 })"
      >
        save
      </button>
      <button class="emit-delete" @click="$emit('delete-requested', 1)">delete</button>
      <button
        class="emit-tags"
        @click="$emit('memo-tags-updated', { memoId: 1, tags: [{ id: 3, title: 'later' }] })"
      >
        tags
      </button>
      <button class="emit-tag-delete" @click="$emit('tag-deleted', 11)">tag-delete</button>
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
  createdAt: "2026-03-20T10:00:00.000Z",
  updatedAt: "2026-03-20T10:00:00.000Z",
  memo_tags: [],
  ...overrides,
});

describe("MemoListContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockImplementation(() => true);
  });

  it("delegates reorder and save requests to the command layer", async () => {
    storeMock.reorderMemos.mockResolvedValue({ ok: true, value: undefined });
    storeMock.updateMemo.mockResolvedValue({ ok: true, value: undefined });

    const items = [makeMemo(), makeMemo({ id: 2, title: "Beta" })];
    const wrapper = mount(MemoListContainer, {
      props: {
        items,
        canReorder: true,
      },
      global: {
        stubs: {
          MemoList: MemoListStub,
        },
      },
    });

    await wrapper.get(".emit-reorder").trigger("click");
    await wrapper.get(".emit-save").trigger("click");
    await wrapper.get(".emit-tags").trigger("click");
    await flushPromises();

    expect(storeMock.reorderMemos).toHaveBeenCalledWith(items);
    expect(storeMock.updateMemo).toHaveBeenCalledWith({
      id: 1,
      title: "Updated",
      content: "Body",
      width: 240,
      height: 80,
    });
  });

  it("uses confirm before deleting and relays tag deletion upward", async () => {
    storeMock.deleteMemo.mockResolvedValue({ ok: true, value: undefined });

    const wrapper = mount(MemoListContainer, {
      props: {
        items: [makeMemo()],
        canReorder: true,
      },
      global: {
        stubs: {
          MemoList: MemoListStub,
        },
      },
    });

    await wrapper.get(".emit-delete").trigger("click");
    await flushPromises();
    expect(window.confirm).toHaveBeenCalledWith("Delete this memo?");
    expect(storeMock.deleteMemo).toHaveBeenCalledWith(1);

    await wrapper.get(".emit-tag-delete").trigger("click");
    expect(wrapper.emitted("tag-deleted")?.[0]).toEqual([11]);
  });

  it("skips reorder when disabled and shows feedback on failed save/delete", async () => {
    storeMock.updateMemo.mockResolvedValue({ ok: false, reason: "error" });
    storeMock.deleteMemo.mockResolvedValue({ ok: false, reason: "error" });
    vi.mocked(window.confirm).mockReturnValue(true);

    const wrapper = mount(MemoListContainer, {
      props: {
        items: [makeMemo()],
        canReorder: false,
      },
      global: {
        stubs: {
          MemoList: MemoListStub,
        },
      },
    });

    await wrapper.get(".emit-reorder").trigger("click");
    await wrapper.get(".emit-save").trigger("click");
    await wrapper.get(".emit-delete").trigger("click");
    await flushPromises();

    expect(storeMock.reorderMemos).not.toHaveBeenCalled();
    expect(feedbackMock.showError).toHaveBeenCalledWith("Failed to update memo.");
    expect(feedbackMock.showError).toHaveBeenCalledWith("Failed to delete memo.");
  });

  it("does not delete when the user cancels confirmation", async () => {
    vi.mocked(window.confirm).mockReturnValue(false);

    const wrapper = mount(MemoListContainer, {
      props: {
        items: [makeMemo()],
        canReorder: true,
      },
      global: {
        stubs: {
          MemoList: MemoListStub,
        },
      },
    });

    await wrapper.get(".emit-delete").trigger("click");
    await flushPromises();

    expect(storeMock.deleteMemo).not.toHaveBeenCalled();
  });
});
