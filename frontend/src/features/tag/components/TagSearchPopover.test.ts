import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import TagSearchPopover from "./TagSearchPopover.vue";

describe("TagSearchPopover", () => {
  it("renders tabs and applies tags from a source memo", async () => {
    const wrapper = mount(TagSearchPopover, {
      props: {
        tags: [
          { id: 1, title: "work" },
          { id: 2, title: "home" },
        ],
        selectedTagIds: [1],
        memoSources: [
          {
            memoId: 5,
            title: "Source memo",
            content: "Source body",
            tags: [{ id: 2, title: "home" }],
          },
        ],
      },
    });

    expect(wrapper.text()).toContain("Tags");
    expect(wrapper.text()).toContain("Memos");

    await wrapper.get(".tag-popup-tab:nth-child(2)").trigger("click");
    expect(wrapper.text()).toContain("Source memo");
    expect(wrapper.text()).toContain("#home");

    await wrapper.get(".memo-source-item").trigger("click");
    expect(wrapper.emitted("apply-tags-from-memo")?.[0]).toEqual([
      {
        memoId: 5,
        title: "Source memo",
        content: "Source body",
        tags: [{ id: 2, title: "home" }],
      },
    ]);
  });

  it("keeps the tag catalog flow intact", async () => {
    const wrapper = mount(TagSearchPopover, {
      attachTo: document.body,
      props: {
        tags: [
          { id: 1, title: "work" },
          { id: 2, title: "home" },
          { id: 3, title: "later" },
        ],
        selectedTagIds: [1],
      },
    });

    expect(wrapper.find(".tag-popup-tabs").exists()).toBe(false);

    await wrapper.get(".tag-popup-input").trigger("keydown", { key: "ArrowDown" });
    await flushPromises();
    expect(wrapper.emitted("toggle-tag")).toBeUndefined();
    expect(document.activeElement).toBe(wrapper.findAll(".tag-popup-select-btn")[1].element);

    await wrapper.findAll(".tag-popup-select-btn")[1].trigger("keydown", {
      key: "ArrowDown",
      shiftKey: true,
    });
    await flushPromises();
    expect(document.activeElement).toBe(wrapper.findAll(".tag-popup-select-btn")[2].element);
    expect(wrapper.emitted("toggle-tag")?.[0]).toEqual([{ id: 2, title: "home" }]);

    await wrapper.findAll(".tag-popup-select-btn")[2].trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("toggle-tag")?.[1]).toEqual([{ id: 3, title: "later" }]);

    await wrapper.findAll(".tag-popup-select-btn")[2].trigger("keydown", { key: "ArrowRight" });
    await flushPromises();
    expect(document.activeElement).toBe(wrapper.findAll(".tag-popup-danger-btn")[2].element);

    await wrapper.findAll(".tag-popup-danger-btn")[2].trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("tag-deleted")?.[0]).toEqual([{ id: 3, title: "later" }]);

    await wrapper.get(".tag-popup-input").element.focus();

    await wrapper.get(".tag-popup-input").setValue("new-tag");
    await wrapper.get(".tag-popup-input").trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("close")).toBeUndefined();
    expect(wrapper.emitted("create-tag")).toBeUndefined();

    await wrapper.get(".tag-popup-input").trigger("keydown", { key: "Enter", shiftKey: true });
    expect(wrapper.emitted("close")?.[0]).toEqual([]);

    await wrapper.get(".tag-popup-input").setValue("new-tag");
    await wrapper.get(".add-tag-button").trigger("click");
    expect(wrapper.emitted("create-tag")?.[0]).toEqual(["new-tag"]);

    await wrapper.get(".tag-popup-select-btn").trigger("click");
    expect(wrapper.emitted("toggle-tag")?.[2]).toEqual([{ id: 1, title: "work" }]);
    wrapper.unmount();
  });
});
