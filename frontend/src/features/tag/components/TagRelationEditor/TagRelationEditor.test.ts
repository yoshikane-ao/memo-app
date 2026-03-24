import { defineComponent } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TagItem } from "../../model/tag.types";
import { useTagStore } from "../../model/useTagStore";
import TagRelationEditor from "./TagRelationEditor.vue";

const commandsMock = {
  addTagToMemo: vi.fn(),
  createTag: vi.fn(),
  deleteTag: vi.fn(),
  removeTagFromMemo: vi.fn(),
};

vi.mock("../../../memo/model/useMemoHistoryCommands", () => ({
  useMemoHistoryCommands: () => commandsMock,
}));

const feedbackMock = {
  showError: vi.fn(),
};

vi.mock("../../../../shared/feedback/useFeedbackStore", () => ({
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
  },
  emits: ["toggle-tag", "remove-tag", "create-tag", "delete-tag"],
  template: `
    <div class="tag-picker-stub">
      <button class="remove-tag" @click="$emit('remove-tag', { id: 1, title: 'work' })">remove</button>
      <button class="toggle-tag" @click="$emit('toggle-tag', { id: 3, title: 'later' })">toggle</button>
      <button class="delete-tag" @click="$emit('delete-tag', { id: 1, title: 'work' })">delete</button>
    </div>
  `,
});

const makeTag = (overrides: Partial<TagItem> = {}): TagItem => ({
  id: 1,
  title: "work",
  ...overrides,
});

describe("TagRelationEditor", () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
    useTagStore().setItems([makeTag(), makeTag({ id: 2, title: "home" }), makeTag({ id: 3, title: "later" })]);
  });

  it("reflects existing memo tags and unlinks a selected tag", async () => {
    commandsMock.removeTagFromMemo.mockResolvedValue({ ok: true, value: undefined });

    const wrapper = mount(TagRelationEditor, {
      props: {
        memoId: 8,
        tags: [makeTag(), makeTag({ id: 2, title: "home" })],
      },
      global: {
        plugins: [pinia],
        stubs: {
          TagPickerField: TagPickerFieldStub,
        },
      },
    });

    expect(wrapper.getComponent(TagPickerFieldStub).props("selectedTags")).toEqual([
      makeTag(),
      makeTag({ id: 2, title: "home" }),
    ]);

    await wrapper.get(".remove-tag").trigger("click");
    await flushPromises();

    expect(commandsMock.removeTagFromMemo).toHaveBeenCalledWith(8, { id: 1, title: "work" });
    expect(wrapper.emitted("memo-tags-updated")?.[0]).toEqual([
      {
        memoId: 8,
        tags: [{ id: 2, title: "home" }],
      },
    ]);
  });

  it("adds a tag from the picker and emits the expanded tag list", async () => {
    commandsMock.addTagToMemo.mockResolvedValue({ ok: true, value: undefined });

    const wrapper = mount(TagRelationEditor, {
      props: {
        memoId: 8,
        tags: [makeTag()],
      },
      global: {
        plugins: [pinia],
        stubs: {
          TagPickerField: TagPickerFieldStub,
        },
      },
    });

    await wrapper.get(".toggle-tag").trigger("click");
    await flushPromises();

    expect(wrapper.emitted("memo-tags-updated")?.[0]).toEqual([
      {
        memoId: 8,
        tags: [
          { id: 1, title: "work" },
          { id: 3, title: "later" },
        ],
      },
    ]);
    expect(commandsMock.addTagToMemo).toHaveBeenCalledWith(8, { id: 3, title: "later" });
  });

  it("relays system tag deletion and removes the local tag", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    commandsMock.deleteTag.mockResolvedValue({ ok: true, value: undefined });

    const wrapper = mount(TagRelationEditor, {
      props: {
        memoId: 8,
        tags: [makeTag()],
      },
      global: {
        plugins: [pinia],
        stubs: {
          TagPickerField: TagPickerFieldStub,
        },
      },
    });

    await wrapper.get(".delete-tag").trigger("click");
    await flushPromises();

    expect(wrapper.emitted("tag-deleted")?.[0]).toEqual([1]);
    expect(wrapper.emitted("memo-tags-updated")?.[0]).toEqual([
      {
        memoId: 8,
        tags: [],
      },
    ]);
  });
});
