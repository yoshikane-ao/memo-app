import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MemoComposerContainer from "./MemoComposerContainer.vue";
import { activateTestPinia } from "../../../../../../test/pinia";
import { useTagStore } from "../../../tag";

const storeMock = {
  createMemo: vi.fn(),
};

vi.mock("../../application/useMemoCommands", () => ({
  useMemoHistoryCommands: () => storeMock,
}));

const feedbackMock = {
  showError: vi.fn(),
};

vi.mock("../../../../../../shared/feedback/useFeedbackStore", () => ({
  useFeedbackStore: () => feedbackMock,
}));

const MemoComposerFormStub = defineComponent({
  name: "MemoComposerForm",
  props: {
    title: String,
    content: String,
    isSubmitDisabled: Boolean,
    selectedTags: {
      type: Array,
      default: () => [],
    },
    tagSelectionResetKey: Number,
    keepTags: Boolean,
  },
  emits: [
    "update:title",
    "update:content",
    "update:selectedTags",
    "update:keepTags",
    "submit",
    "tag-deleted",
  ],
  template: `
    <div>
      <button class="set-title" @click="$emit('update:title', 'Updated title')">title</button>
      <button class="set-content" @click="$emit('update:content', 'Updated content')">content</button>
      <button class="set-tags" @click="$emit('update:selectedTags', [{ id: 1, title: 'work' }, { id: 2, title: 'later' }])">tags</button>
      <button class="keep-tags" @click="$emit('update:keepTags', true)">keep-tags</button>
      <button class="submit" :disabled="isSubmitDisabled" @click="$emit('submit')">submit</button>
      <button class="tag-deleted" @click="$emit('tag-deleted', 8)">tag-deleted</button>
    </div>
  `,
});

describe("MemoComposerContainer", () => {
  beforeEach(() => {
    activateTestPinia();
    window.localStorage.clear();
    vi.clearAllMocks();
    useTagStore().setItems([
      { id: 1, title: "work" },
      { id: 2, title: "later" },
    ]);
  });

  it("submits the draft to the store and resets the form after success", async () => {
    storeMock.createMemo.mockResolvedValue({ ok: true, value: { id: 42 } });

    const wrapper = mount(MemoComposerContainer, {
      global: {
        stubs: {
          MemoComposerForm: MemoComposerFormStub,
        },
      },
    });

    const form = wrapper.findComponent(MemoComposerFormStub);
    expect(form.props("isSubmitDisabled")).toBe(true);

    await wrapper.get(".set-title").trigger("click");
    await wrapper.get(".set-content").trigger("click");
    await wrapper.get(".set-tags").trigger("click");

    expect(form.props("title")).toBe("Updated title");
    expect(form.props("content")).toBe("Updated content");
    expect(form.props("isSubmitDisabled")).toBe(false);

    const previousResetKey = form.props("tagSelectionResetKey");
    await wrapper.get(".submit").trigger("click");
    await flushPromises();

    expect(storeMock.createMemo).toHaveBeenCalledWith({
      title: "Updated title",
      content: "Updated content",
      tags: ["work", "later"],
    });
    expect(wrapper.emitted("memo-created")?.[0]).toEqual([42]);
    expect(form.props("title")).toBe("");
    expect(form.props("content")).toBe("");
    expect(form.props("selectedTags")).toEqual([]);
    expect(form.props("tagSelectionResetKey")).toBe(previousResetKey + 1);
  });

  it("keeps selected tags after submit when fixed tag mode is enabled", async () => {
    storeMock.createMemo.mockResolvedValue({ ok: true, value: { id: 84 } });

    const wrapper = mount(MemoComposerContainer, {
      global: {
        stubs: {
          MemoComposerForm: MemoComposerFormStub,
        },
      },
    });

    const form = wrapper.findComponent(MemoComposerFormStub);

    await wrapper.get(".set-title").trigger("click");
    await wrapper.get(".set-content").trigger("click");
    await wrapper.get(".set-tags").trigger("click");
    await wrapper.get(".keep-tags").trigger("click");
    await wrapper.get(".submit").trigger("click");
    await flushPromises();

    expect(form.props("selectedTags")).toEqual([
      { id: 1, title: "work" },
      { id: 2, title: "later" },
    ]);
    expect(JSON.parse(window.localStorage.getItem("memo-composer-defaults-v1") ?? "null")).toEqual({
      keepTags: true,
      fixedTagTitles: ["work", "later"],
    });
  });

  it("shows feedback on failure and relays tag deletion", async () => {
    storeMock.createMemo.mockResolvedValue({ ok: false, reason: "error" });

    const wrapper = mount(MemoComposerContainer, {
      global: {
        stubs: {
          MemoComposerForm: MemoComposerFormStub,
        },
      },
    });

    await wrapper.get(".set-title").trigger("click");
    await wrapper.get(".set-content").trigger("click");
    await wrapper.get(".submit").trigger("click");
    await flushPromises();

    expect(feedbackMock.showError).toHaveBeenCalledWith("Failed to create memo.");
    expect(wrapper.emitted("memo-created")).toBeUndefined();

    await wrapper.get(".tag-deleted").trigger("click");
    expect(wrapper.emitted("tag-deleted")?.[0]).toEqual([8]);
  });
});
