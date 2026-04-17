import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import type { Memo } from "../../model/memo.types";
import MemoList from "./MemoList.vue";

const MemoCardStub = defineComponent({
  name: "MemoCard",
  props: {
    memo: {
      type: Object,
      required: true,
    },
  },
  emits: ["save-requested", "trash-requested", "memo-tags-updated", "tag-deleted"],
  template: `<article class="memo-card-stub">{{ memo.title }}</article>`,
});

const makeMemo = (overrides: Partial<Memo> = {}): Memo => ({
  id: 1,
  orderIndex: 0,
  width: 180,
  height: 48,
  title: "Alpha",
  content: "First memo",
  deletedAt: null,
  createdAt: "2026-03-20T10:00:00.000Z",
  updatedAt: "2026-03-20T10:00:00.000Z",
  memo_tags: [],
  ...overrides,
});

const getRenderedTitles = (wrapper: ReturnType<typeof mount>) =>
  wrapper.findAll(".memo-card-stub").map((node) => node.text());

describe("MemoList", () => {
  it("reorders memos with the keyboard handle and only emits on commit", async () => {
    const wrapper = mount(MemoList, {
      props: {
        canReorder: true,
        items: [
          makeMemo({ id: 1, orderIndex: 0, title: "Alpha" }),
          makeMemo({ id: 2, orderIndex: 1, title: "Beta" }),
          makeMemo({ id: 3, orderIndex: 2, title: "Gamma" }),
        ],
      },
      global: {
        stubs: {
          MemoCard: MemoCardStub,
        },
      },
    });

    const firstHandle = wrapper.get('[data-reorder-handle-id="1"]');
    await firstHandle.trigger("keydown", { key: "Enter" });
    await firstHandle.trigger("keydown", { key: "ArrowDown" });
    await flushPromises();

    expect(getRenderedTitles(wrapper)).toEqual(["Beta", "Alpha", "Gamma"]);
    expect(wrapper.emitted("reorder-requested")).toBeUndefined();

    const movedHandle = wrapper.get('[data-reorder-handle-id="1"]');
    await movedHandle.trigger("keydown", { key: "Enter" });

    const reorderPayload = wrapper.emitted("reorder-requested")?.[0]?.[0] as Memo[] | undefined;
    expect(reorderPayload?.map((memo) => memo.id)).toEqual([2, 1, 3]);
  });

  it("cancels keyboard reordering on escape", async () => {
    const wrapper = mount(MemoList, {
      props: {
        canReorder: true,
        items: [
          makeMemo({ id: 1, orderIndex: 0, title: "Alpha" }),
          makeMemo({ id: 2, orderIndex: 1, title: "Beta" }),
        ],
      },
      global: {
        stubs: {
          MemoCard: MemoCardStub,
        },
      },
    });

    const firstHandle = wrapper.get('[data-reorder-handle-id="1"]');
    await firstHandle.trigger("keydown", { key: "Enter" });
    await firstHandle.trigger("keydown", { key: "ArrowDown" });
    await firstHandle.trigger("keydown", { key: "Escape" });
    await flushPromises();

    expect(getRenderedTitles(wrapper)).toEqual(["Alpha", "Beta"]);
    expect(wrapper.emitted("reorder-requested")).toBeUndefined();
  });
});
