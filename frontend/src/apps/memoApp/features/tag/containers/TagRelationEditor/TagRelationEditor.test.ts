import { defineComponent } from "vue";
import type { Pinia } from "pinia";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TagItem } from "../../model/tag.types";
import { useMemoStore } from "../../../memo";
import { useTagStore } from "../../model/useTagStore";
import TagRelationEditor from "./TagRelationEditor.vue";
import { activateTestPinia } from "../../../../../../test/pinia";

const commandsMock = {
  addTagToMemo: vi.fn(),
  createTag: vi.fn(),
  deleteTag: vi.fn(),
  replaceMemoTags: vi.fn(),
  removeTagFromMemo: vi.fn(),
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
  },
  emits: ["toggle-tag", "remove-tag", "create-tag", "delete-tag", "apply-tags-from-memo"],
  template: `
    <div class="tag-picker-stub">
      <button class="remove-tag" @click="$emit('remove-tag', { id: 1, title: 'work' })">remove</button>
      <button class="toggle-tag" @click="$emit('toggle-tag', { id: 3, title: 'later' })">toggle</button>
      <button class="create-tag" @click="$emit('create-tag', 'urgent')">create</button>
      <button class="delete-tag" @click="$emit('delete-tag', { id: 1, title: 'work' })">delete</button>
      <button class="apply-from-memo" @click="$emit('apply-tags-from-memo', { memoId: 5, title: 'Source', content: 'Source body', tags: [{ id: 2, title: 'home' }] })">apply-from-memo</button>
    </div>
  `,
});

const makeTag = (overrides: Partial<TagItem> = {}): TagItem => ({
  id: 1,
  title: "work",
  ...overrides,
});

describe("TagRelationEditor", () => {
  let pinia: Pinia;

  beforeEach(() => {
    pinia = activateTestPinia();
    vi.clearAllMocks();
    useTagStore().setItems([makeTag(), makeTag({ id: 2, title: "home" }), makeTag({ id: 3, title: "later" })]);
    useMemoStore().setItems([
      {
        id: 8,
        orderIndex: 0,
        width: 180,
        height: 48,
        title: "Current",
        content: "Current body",
        deletedAt: null,
        createdAt: "2026-03-20T10:00:00.000Z",
        updatedAt: "2026-03-20T10:00:00.000Z",
        memo_tags: [{ memo_id: 8, tag_id: 1, tag: makeTag() }],
      },
      {
        id: 5,
        orderIndex: 1,
        width: 180,
        height: 48,
        title: "Source",
        content: "Source body",
        deletedAt: null,
        createdAt: "2026-03-19T10:00:00.000Z",
        updatedAt: "2026-03-19T10:00:00.000Z",
        memo_tags: [{ memo_id: 5, tag_id: 2, tag: makeTag({ id: 2, title: "home" }) }],
      },
    ]);
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

  it("keeps a newly added tag single even if props update during the add command", async () => {
    let wrapper: ReturnType<typeof mount>;
    const addedTag = makeTag({ id: 3, title: "later" });

    commandsMock.addTagToMemo.mockImplementation(async () => {
      await wrapper.setProps({
        tags: [makeTag(), addedTag],
      });

      return { ok: true, value: undefined };
    });

    wrapper = mount(TagRelationEditor, {
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

    expect(wrapper.getComponent(TagPickerFieldStub).props("selectedTags")).toEqual([
      makeTag(),
      addedTag,
    ]);
    expect(wrapper.emitted("memo-tags-updated")?.[0]).toEqual([
      {
        memoId: 8,
        tags: [
          { id: 1, title: "work" },
          addedTag,
        ],
      },
    ]);
    expect(commandsMock.addTagToMemo).toHaveBeenCalledWith(8, addedTag);
  });

  it("keeps a newly created tag single even if props update during creation", async () => {
    let wrapper: ReturnType<typeof mount>;
    const createdTag = makeTag({ id: 4, title: "urgent" });

    commandsMock.createTag.mockImplementation(async () => {
      await wrapper.setProps({
        tags: [makeTag(), createdTag],
      });

      return { ok: true, value: createdTag };
    });

    wrapper = mount(TagRelationEditor, {
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

    await wrapper.get(".create-tag").trigger("click");
    await flushPromises();

    expect(wrapper.getComponent(TagPickerFieldStub).props("selectedTags")).toEqual([
      makeTag(),
      createdTag,
    ]);
    expect(wrapper.emitted("memo-tags-updated")?.[0]).toEqual([
      {
        memoId: 8,
        tags: [
          { id: 1, title: "work" },
          createdTag,
        ],
      },
    ]);
  });

  it("replaces tags with the selected memo's tag set in one action", async () => {
    commandsMock.replaceMemoTags.mockResolvedValue({ ok: true, value: undefined });

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

    await wrapper.get(".apply-from-memo").trigger("click");
    await flushPromises();

    expect(commandsMock.replaceMemoTags).toHaveBeenCalledWith(8, [{ id: 2, title: "home" }]);
    expect(wrapper.emitted("memo-tags-updated")?.[0]).toEqual([
      {
        memoId: 8,
        tags: [{ id: 2, title: "home" }],
      },
    ]);
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
