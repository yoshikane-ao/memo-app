import { beforeEach, describe, expect, it } from "vitest";
import { activateTestPinia } from "../../../../../test/pinia";
import { useMemoComposerDefaultsStore } from "./useMemoComposerDefaultsStore";

describe("useMemoComposerDefaultsStore", () => {
  beforeEach(() => {
    activateTestPinia();
    window.localStorage.clear();
  });

  it("hydrates persisted fixed tags from localStorage", () => {
    window.localStorage.setItem(
      "memo-composer-defaults-v1",
      JSON.stringify({
        keepTags: true,
        fixedTagTitles: [" work ", "work", "review"],
      })
    );

    const store = useMemoComposerDefaultsStore();

    expect(store.keepTags).toBe(true);
    expect(store.fixedTagTitles).toEqual(["work", "review"]);
  });

  it("stores normalized fixed tags when keep mode is enabled", () => {
    const store = useMemoComposerDefaultsStore();

    store.setKeepTags(true, [" work ", "work", "review"]);

    expect(store.keepTags).toBe(true);
    expect(store.fixedTagTitles).toEqual(["work", "review"]);
    expect(JSON.parse(window.localStorage.getItem("memo-composer-defaults-v1") ?? "null")).toEqual({
      keepTags: true,
      fixedTagTitles: ["work", "review"],
    });
  });

  it("updates persisted fixed tags while keep mode is active", () => {
    const store = useMemoComposerDefaultsStore();

    store.setKeepTags(true, ["work"]);
    store.setFixedTagTitles(["focus", "focus", "review"]);

    expect(store.fixedTagTitles).toEqual(["focus", "review"]);
  });
});
