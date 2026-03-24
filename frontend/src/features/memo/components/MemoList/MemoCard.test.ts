import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Memo } from "../../model/memo.types";
import MemoCard from "./MemoCard.vue";

vi.mock("../../../../shared/composables/textareaAutosize", () => ({
  applyAutoWidth: vi.fn(() => 210),
  applyAutoHeight: vi.fn(() => 64),
}));

const feedbackMock = {
  showError: vi.fn(),
};

vi.mock("../../../../shared/feedback/useFeedbackStore", () => ({
  useFeedbackStore: () => feedbackMock,
}));

const MemoCardActionsStub = defineComponent({
  name: "MemoCardActions",
  props: {
    memoId: Number,
    isSaveDisabled: Boolean,
    isCopied: Boolean,
  },
  emits: ["copy-requested", "save-requested", "delete-requested"],
  template: `
    <div>
      <button class="copy-btn" @click="$emit('copy-requested')">copy</button>
      <button class="save-btn" :disabled="isSaveDisabled" @click="$emit('save-requested')">
        save
      </button>
      <button class="delete-btn" @click="$emit('delete-requested')">delete</button>
    </div>
  `,
});

const MemoCardTagsStub = defineComponent({
  name: "MemoCardTags",
  props: {
    memoId: Number,
    tags: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["memo-tags-updated", "tag-deleted"],
  template: `
    <div>
      <button
        class="emit-tags"
        @click="$emit('memo-tags-updated', { memoId, tags: [{ id: 7, title: 'later' }] })"
      >
        tags
      </button>
      <button class="emit-tag-delete" @click="$emit('tag-deleted', 7)">delete-tag</button>
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
  memo_tags: [
    {
      memo_id: 1,
      tag_id: 1,
      tag: { id: 1, title: "work" },
    },
  ],
  ...overrides,
});

describe("MemoCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("enables save only after a valid draft change and emits the save payload", async () => {
    const wrapper = mount(MemoCard, {
      props: {
        memo: makeMemo(),
      },
      global: {
        stubs: {
          MemoCardActions: MemoCardActionsStub,
          MemoCardTags: MemoCardTagsStub,
        },
      },
    });

    await flushPromises();

    expect(wrapper.findComponent(MemoCardActionsStub).props("isSaveDisabled")).toBe(true);

    await wrapper.get("#title-1").setValue("Updated title");

    expect(wrapper.findComponent(MemoCardActionsStub).props("isSaveDisabled")).toBe(false);

    await wrapper.get(".save-btn").trigger("click");

    expect(wrapper.emitted("save-requested")?.[0]).toEqual([
      {
        memoId: 1,
        title: "Updated title",
        content: "First memo",
        width: 210,
        height: 64,
      },
    ]);
  });

  it("copies the memo content through the shared copy action", async () => {
    const writeText = vi.mocked(navigator.clipboard.writeText);
    const wrapper = mount(MemoCard, {
      props: {
        memo: makeMemo(),
      },
      global: {
        stubs: {
          MemoCardActions: MemoCardActionsStub,
          MemoCardTags: MemoCardTagsStub,
        },
      },
    });

    await wrapper.get(".copy-btn").trigger("click");
    await flushPromises();

    expect(writeText).toHaveBeenCalledWith("First memo");
    expect(wrapper.findComponent(MemoCardActionsStub).props("isCopied")).toBe(true);
  });

  it("submits edited content on Enter and keeps Shift+Enter for new lines", async () => {
    const wrapper = mount(MemoCard, {
      props: {
        memo: makeMemo(),
      },
      global: {
        stubs: {
          MemoCardActions: MemoCardActionsStub,
          MemoCardTags: MemoCardTagsStub,
        },
      },
    });

    await flushPromises();
    await wrapper.get("#content-1").setValue("Updated content");

    await wrapper.get("#content-1").trigger("keydown", {
      key: "Enter",
      shiftKey: true,
    });

    expect(wrapper.emitted("save-requested")).toBeUndefined();

    await wrapper.get("#content-1").trigger("keydown", { key: "Enter" });

    expect(wrapper.emitted("save-requested")?.[0]).toEqual([
      {
        memoId: 1,
        title: "Alpha",
        content: "Updated content",
        width: 210,
        height: 64,
      },
    ]);
  });

  it("syncs incoming memo props and relays delete/tag events", async () => {
    const wrapper = mount(MemoCard, {
      props: {
        memo: makeMemo(),
      },
      global: {
        stubs: {
          MemoCardActions: MemoCardActionsStub,
          MemoCardTags: MemoCardTagsStub,
        },
      },
    });

    await wrapper.setProps({
      memo: makeMemo({
        title: "Server title",
        content: "Server content",
        memo_tags: [],
      }),
    });
    await flushPromises();

    expect((wrapper.get("#title-1").element as HTMLTextAreaElement).value).toBe("Server title");
    expect((wrapper.get("#content-1").element as HTMLTextAreaElement).value).toBe("Server content");

    await wrapper.get(".emit-tags").trigger("click");
    await wrapper.get(".emit-tag-delete").trigger("click");
    await wrapper.get(".delete-btn").trigger("click");

    expect(wrapper.emitted("memo-tags-updated")?.[0]).toEqual([
      { memoId: 1, tags: [{ id: 7, title: "later" }] },
    ]);
    expect(wrapper.emitted("tag-deleted")?.[0]).toEqual([7]);
    expect(wrapper.emitted("delete-requested")?.[0]).toEqual([1]);
  });
});
