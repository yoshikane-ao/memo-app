import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TagItem } from "../../model/tag.types";
import { useMemoStore } from "../../../memo";
import { useTagStore } from "../../model/useTagStore";
import TagSelectionSelect from "./TagSelectionSelect.vue";
import { activateTestPinia } from "../../../../../../test/pinia";

const commandsMock = {
  createTag: vi.fn(),
  deleteTag: vi.fn(),
};

vi.mock("../../application/useTagCommands", () => ({
  useTagCommands: () => commandsMock,
}));

const feedbackMock = {
  showError: vi.fn(),
};

vi.mock("../../../../../../shared/feedback/useFeedbackStore", () => ({
  useFeedbackStore: () => feedbackMock,
}));

const TagPickerFieldStub = defineComponent({
  name: "TagPickerField",
  props: {
    selectedTags: {
      type: Array,
      default: () => [],
    },
    availableTags: {
      type: Array,
      default: () => [],
    },
    memoSources: {
      type: Array,
      default: () => [],
    },
    resetKey: Number,
  },
  emits: ["toggle-tag", "remove-tag", "create-tag", "delete-tag", "apply-tags-from-memo"],
  template: `
    <div class="tag-picker-stub">
      <button class="toggle-home" @click="$emit('toggle-tag', { id: 2, title: 'home' })">toggle-home</button>
      <button class="remove-work" @click="$emit('remove-tag', { id: 1, title: 'work' })">remove-work</button>
      <button class="create-later" @click="$emit('create-tag', 'later')">create-later</button>
      <button class="apply-from-memo" @click="$emit('apply-tags-from-memo', { memoId: 8, title: 'Source memo', content: 'Source content', tags: [{ id: 2, title: 'home' }] })">apply-from-memo</button>
    </div>
  `,
});

const makeTag = (overrides: Partial<TagItem> = {}): TagItem => ({
  id: 1,
  title: "work",
  ...overrides,
});

describe("TagSelectionSelect", () => {
  beforeEach(() => {
    activateTestPinia();
    vi.clearAllMocks();
    useTagStore().setItems([makeTag(), makeTag({ id: 2, title: "home" })]);
    useMemoStore().setItems([
      {
        id: 8,
        orderIndex: 0,
        width: 180,
        height: 48,
        title: "Source memo",
        content: "Source content",
        deletedAt: null,
        createdAt: "2026-03-20T10:00:00.000Z",
        updatedAt: "2026-03-20T10:00:00.000Z",
        memo_tags: [{ memo_id: 8, tag_id: 2, tag: makeTag({ id: 2, title: "home" }) }],
      },
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reflects selected tags and emits controlled updates", async () => {
    const wrapper = mount(TagSelectionSelect, {
      props: {
        selectedTags: [makeTag()],
        resetKey: 0,
      },
      global: {
        stubs: {
          TagPickerField: TagPickerFieldStub,
        },
      },
    });

    const picker = wrapper.getComponent(TagPickerFieldStub);
    expect(picker.props("selectedTags")).toEqual([makeTag()]);
    expect(picker.props("availableTags")).toEqual([makeTag(), makeTag({ id: 2, title: "home" })]);

    await wrapper.get(".toggle-home").trigger("click");
    expect(wrapper.emitted("update:selectedTags")?.[0]).toEqual([
      [makeTag(), makeTag({ id: 2, title: "home" })],
    ]);

    await wrapper.get(".remove-work").trigger("click");
    expect(wrapper.emitted("update:selectedTags")?.[1]).toEqual([[]]);
  });

  it("creates a new tag through the command layer and appends it to the selection", async () => {
    commandsMock.createTag.mockResolvedValue({ ok: true, value: { id: 3, title: "later" } });

    const wrapper = mount(TagSelectionSelect, {
      props: {
        selectedTags: [makeTag()],
        resetKey: 0,
      },
      global: {
        stubs: {
          TagPickerField: TagPickerFieldStub,
        },
      },
    });

    await wrapper.get(".create-later").trigger("click");
    await flushPromises();

    expect(commandsMock.createTag).toHaveBeenCalledWith({ title: "later" });
    expect(wrapper.emitted("update:selectedTags")?.[0]).toEqual([
      [makeTag(), { id: 3, title: "later" }],
    ]);
  });

  it("replaces the current selection with tags from the selected memo", async () => {
    const wrapper = mount(TagSelectionSelect, {
      props: {
        selectedTags: [makeTag()],
        resetKey: 0,
      },
      global: {
        stubs: {
          TagPickerField: TagPickerFieldStub,
        },
      },
    });

    await wrapper.get(".apply-from-memo").trigger("click");

    expect(wrapper.emitted("update:selectedTags")?.[0]).toEqual([
      [{ id: 2, title: "home" }],
    ]);
  });

  it("shows the memo tab from the create flow and applies source tags", async () => {
    const wrapper = mount(TagSelectionSelect, {
      props: {
        selectedTags: [],
        resetKey: 0,
      },
    });

    await wrapper.get(".tag-add-btn").trigger("click");
    expect(wrapper.text()).toContain("Tags");
    expect(wrapper.text()).toContain("Memos");

    await wrapper.get(".tag-popup-tab:nth-child(2)").trigger("click");
    expect(wrapper.text()).toContain("Source memo");
    expect(wrapper.text()).toContain("#home");

    await wrapper.get(".memo-source-item").trigger("click");
    expect(wrapper.emitted("update:selectedTags")?.[0]).toEqual([
      [{ id: 2, title: "home" }],
    ]);
  });

  it("closes the tag popup when the trigger is clicked again", async () => {
    vi.useFakeTimers();

    const wrapper = mount(TagSelectionSelect, {
      attachTo: document.body,
      props: {
        selectedTags: [],
        resetKey: 0,
      },
    });

    await wrapper.get(".tag-add-btn").trigger("click");
    expect(wrapper.find(".tag-popup").exists()).toBe(true);

    vi.advanceTimersByTime(150);
    await wrapper.get(".tag-add-btn").trigger("click");
    await flushPromises();

    expect(wrapper.find(".tag-popup").exists()).toBe(false);
    wrapper.unmount();
  });

  it("moves focus into the popup so Shift+Enter can close it", async () => {
    const wrapper = mount(TagSelectionSelect, {
      attachTo: document.body,
      props: {
        selectedTags: [],
        resetKey: 0,
      },
    });

    const trigger = wrapper.get(".tag-add-btn");
    await trigger.trigger("click");
    await flushPromises();

    expect(document.activeElement).toBe(wrapper.get(".tag-popup-input").element);

    document.activeElement?.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        shiftKey: true,
        bubbles: true,
      })
    );
    await flushPromises();

    expect(wrapper.find(".tag-popup").exists()).toBe(false);
    wrapper.unmount();
  });
});
