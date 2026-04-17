import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MemoScopeTabs from "./MemoScopeTabs.vue";

describe("MemoScopeTabs", () => {
  it("emits scope changes only when selecting a different scope", async () => {
    const wrapper = mount(MemoScopeTabs, {
      props: {
        scope: "active",
      },
    });

    await wrapper.get('[data-memo-scope="trash"]').trigger("click");
    await wrapper.get('[data-memo-scope="active"]').trigger("click");

    expect(wrapper.emitted("scope-change")).toEqual([["trash"]]);
  });

  it("does not emit when disabled", async () => {
    const wrapper = mount(MemoScopeTabs, {
      props: {
        scope: "active",
        disabled: true,
      },
    });

    await wrapper.get('[data-memo-scope="trash"]').trigger("click");

    expect(wrapper.emitted("scope-change")).toBeUndefined();
  });
});
