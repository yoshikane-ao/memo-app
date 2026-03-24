import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import MemoComposerFields from "./MemoComposerFields.vue";

vi.mock("../../../../shared/composables/textareaAutosize", () => ({
  applyAutoWidth: vi.fn(() => 210),
  applyAutoHeight: vi.fn(() => 64),
}));

describe("MemoComposerFields", () => {
  it("submits the draft when Enter is pressed in the title field", async () => {
    const wrapper = mount(MemoComposerFields, {
      props: {
        title: "Alpha",
        content: "First memo",
      },
    });

    await wrapper.get("#memo-compose-title").trigger("keydown", { key: "Enter" });

    expect(wrapper.emitted("submit-requested")).toHaveLength(1);
  });

  it("submits the draft when Enter is pressed in the content field", async () => {
    const wrapper = mount(MemoComposerFields, {
      props: {
        title: "Alpha",
        content: "First memo",
      },
    });

    await wrapper.get("#memo-compose-content").trigger("keydown", { key: "Enter" });

    expect(wrapper.emitted("submit-requested")).toHaveLength(1);
  });

  it("keeps Shift+Enter in the content field as a newline shortcut", async () => {
    const wrapper = mount(MemoComposerFields, {
      props: {
        title: "Alpha",
        content: "First memo",
      },
    });

    await wrapper.get("#memo-compose-content").trigger("keydown", {
      key: "Enter",
      shiftKey: true,
    });

    expect(wrapper.emitted("submit-requested")).toBeUndefined();
  });

  it("does not submit when the draft is incomplete", async () => {
    const wrapper = mount(MemoComposerFields, {
      props: {
        title: "Alpha",
        content: "",
      },
    });

    await wrapper.get("#memo-compose-content").trigger("keydown", { key: "Enter" });

    expect(wrapper.emitted("submit-requested")).toBeUndefined();
  });
});
