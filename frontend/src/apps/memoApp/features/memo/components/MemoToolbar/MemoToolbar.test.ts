import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { describe, expect, it } from "vitest";
import MemoToolbar from "./MemoToolbar.vue";

const TagFilterSelectStub = defineComponent({
  name: "TagFilterSelect",
  props: {
    selectedTags: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["update:selectedTags", "tag-deleted"],
  template: `
    <button
      class="tag-filter-stub"
      @click="$emit('update:selectedTags', [1, 2]); $emit('tag-deleted', 9)"
    >
      tags
    </button>
  `,
});

describe("MemoToolbar", () => {
  it("emits keyword and select changes", async () => {
    const wrapper = mount(MemoToolbar, {
      props: {
        keyword: "",
        searchType: "all",
        sortOrder: "custom",
        selectedTags: [],
      },
      global: {
        stubs: {
          TagFilterSelect: TagFilterSelectStub,
        },
      },
    });

    await wrapper.get("#memo-search-input").setValue("report");
    const selects = wrapper.findAll("select");
    await selects[0].setValue("content");
    await selects[1].setValue("newest");

    expect(wrapper.emitted("update:keyword")?.[0]).toEqual(["report"]);
    expect(wrapper.emitted("update:searchType")?.[0]).toEqual(["content"]);
    expect(wrapper.emitted("update:sortOrder")?.[0]).toEqual(["newest"]);
  });

  it("relays tag filter events from the child component", async () => {
    const wrapper = mount(MemoToolbar, {
      props: {
        keyword: "",
        searchType: "all",
        sortOrder: "custom",
        selectedTags: [],
      },
      global: {
        stubs: {
          TagFilterSelect: TagFilterSelectStub,
        },
      },
    });

    await wrapper.get(".tag-filter-stub").trigger("click");

    expect(wrapper.emitted("update:selectedTags")?.[0]).toEqual([[1, 2]]);
    expect(wrapper.emitted("tag-deleted")?.[0]).toEqual([9]);
  });
});
