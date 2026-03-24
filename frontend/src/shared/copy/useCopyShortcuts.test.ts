import { defineComponent, onBeforeUnmount, onMounted, ref } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  resetActiveCopyTarget,
  useActiveCopyTarget,
} from "./activeCopyTarget";
import { useCopyShortcuts } from "./useCopyShortcuts";

const copyMock = vi.fn();

const ShortcutHarness = defineComponent({
  setup() {
    const rootRef = ref<HTMLElement | null>(null);
    const { setActiveTarget, clearActiveTarget } = useActiveCopyTarget();

    useCopyShortcuts();

    onMounted(() => {
      setActiveTarget({
        id: 1,
        getRoot: () => rootRef.value,
        copy: copyMock,
      });
    });

    onBeforeUnmount(() => {
      clearActiveTarget(1);
    });

    return {
      rootRef,
    };
  },
  template: `
    <div>
      <div ref="rootRef" class="memo-root">
        <textarea class="memo-input">Alpha</textarea>
      </div>
      <input class="outside-input" value="Outside" />
    </div>
  `,
});

describe("useCopyShortcuts", () => {
  beforeEach(() => {
    copyMock.mockReset();
    copyMock.mockResolvedValue(true);
    resetActiveCopyTarget();
  });

  it("copies the active memo when ctrl+c is pressed without a selection", async () => {
    const wrapper = mount(ShortcutHarness, {
      attachTo: document.body,
    });
    await flushPromises();

    const textarea = wrapper.get(".memo-input").element as HTMLTextAreaElement;
    textarea.focus();

    const event = new KeyboardEvent("keydown", {
      key: "c",
      ctrlKey: true,
      cancelable: true,
    });

    window.dispatchEvent(event);
    await flushPromises();

    expect(copyMock).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    wrapper.unmount();
  });

  it("keeps the native copy behavior when text is selected", async () => {
    const wrapper = mount(ShortcutHarness, {
      attachTo: document.body,
    });
    await flushPromises();

    const textarea = wrapper.get(".memo-input").element as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange(0, 2);

    const event = new KeyboardEvent("keydown", {
      key: "c",
      ctrlKey: true,
      cancelable: true,
    });

    window.dispatchEvent(event);
    await flushPromises();

    expect(copyMock).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    wrapper.unmount();
  });

  it("does not copy after the user interacts outside the active memo", async () => {
    const wrapper = mount(ShortcutHarness, {
      attachTo: document.body,
    });
    await flushPromises();

    const outsideInput = wrapper.get(".outside-input").element as HTMLInputElement;
    outsideInput.focus();
    await wrapper.get(".outside-input").trigger("pointerdown");

    const event = new KeyboardEvent("keydown", {
      key: "c",
      ctrlKey: true,
      cancelable: true,
    });

    window.dispatchEvent(event);
    await flushPromises();

    expect(copyMock).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    wrapper.unmount();
  });
});
