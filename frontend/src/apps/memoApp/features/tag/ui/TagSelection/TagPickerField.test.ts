import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import TagPickerField from "./TagPickerField.vue";

const TagSearchPopoverStub = defineComponent({
  name: "TagSearchPopover",
  emits: ["tag-deleted", "close"],
  template: `
    <div class="tag-search-popover-stub">
      <button class="emit-tag-deleted" @click="$emit('tag-deleted', { id: 3, title: 'later' })">
        emit-tag-deleted
      </button>
      <button class="emit-close" @click="$emit('close')">emit-close</button>
    </div>
  `,
});

describe("TagPickerField", () => {
  it("relays tag deletion from the popover", async () => {
    const wrapper = mount(TagPickerField, {
      props: {
        selectedTags: [],
        availableTags: [{ id: 1, title: "work" }],
      },
      global: {
        stubs: {
          TagSearchPopover: TagSearchPopoverStub,
        },
      },
    });

    await wrapper.get(".tag-add-btn").trigger("click");
    await wrapper.get(".emit-tag-deleted").trigger("click");

    expect(wrapper.emitted("delete-tag")?.[0]).toEqual([{ id: 3, title: "later" }]);
  });
});
