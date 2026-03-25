import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTagStore } from "../../model/useTagStore";
import TagFilterSelect from "./TagFilterSelect.vue";
import { activateTestPinia } from "../../../../../../test/pinia";

const commandsMock = {
  createTag: vi.fn(),
  deleteTag: vi.fn(),
};

vi.mock("../../../memo/model/useMemoHistoryCommands", () => ({
  useMemoHistoryCommands: () => commandsMock,
}));

const feedbackMock = {
  showError: vi.fn(),
};

vi.mock("../../../../../../shared/feedback/useFeedbackStore", () => ({
  useFeedbackStore: () => feedbackMock,
}));

describe("TagFilterSelect", () => {
  beforeEach(() => {
    activateTestPinia();
    vi.clearAllMocks();
    useTagStore().setItems([
      { id: 1, title: "work" },
      { id: 2, title: "home" },
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("closes the filter popup when the trigger is clicked again", async () => {
    vi.useFakeTimers();

    const wrapper = mount(TagFilterSelect, {
      attachTo: document.body,
      props: {
        selectedTags: [],
      },
    });

    await wrapper.get(".dropdown-toggle").trigger("click");
    expect(wrapper.find(".tag-popup").exists()).toBe(true);

    vi.advanceTimersByTime(150);
    await wrapper.get(".dropdown-toggle").trigger("click");
    await flushPromises();

    expect(wrapper.find(".tag-popup").exists()).toBe(false);
    wrapper.unmount();
  });

  it("removes a selected filter tag from the preview without reopening the popup", async () => {
    const wrapper = mount(TagFilterSelect, {
      props: {
        selectedTags: [1, 2],
      },
    });

    const removeButtons = wrapper.findAll(".tag-filter-selected-preview .tag-remove-btn");
    expect(removeButtons).toHaveLength(2);

    await removeButtons[0].trigger("click");

    expect(wrapper.emitted("update:selectedTags")?.[0]).toEqual([[2]]);
  });
});
