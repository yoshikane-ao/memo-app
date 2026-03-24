import { mount } from "@vue/test-utils";
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
      props: {
        tags: [
          { id: 1, title: "work" },
          { id: 2, title: "home" },
        ],
        selectedTagIds: [1],
      },
    });

    expect(wrapper.find(".tag-popup-tabs").exists()).toBe(false);

    await wrapper.get(".tag-popup-input").setValue("new-tag");
    await wrapper.get(".add-tag-button").trigger("click");
    expect(wrapper.emitted("create-tag")?.[0]).toEqual(["new-tag"]);

    await wrapper.get(".tag-popup-select-btn").trigger("click");
    expect(wrapper.emitted("toggle-tag")?.[0]).toEqual([{ id: 1, title: "work" }]);
  });
});
