import { beforeEach, describe, expect, it } from "vitest";
import { activateTestPinia } from "../../../../../test/pinia";
import { useQuizRegistrationDefaultsStore } from "./useQuizRegistrationDefaultsStore";

describe("useQuizRegistrationDefaultsStore", () => {
  beforeEach(() => {
    activateTestPinia();
    window.localStorage.clear();
  });

  it("hydrates persisted defaults from localStorage", () => {
    window.localStorage.setItem(
      "quiz-registration-defaults-v1",
      JSON.stringify({
        keepTags: true,
        keepGroups: true,
        fixedTags: [" work ", "work", "review"],
        fixedGroups: ["daily"],
      })
    );

    const store = useQuizRegistrationDefaultsStore();

    expect(store.keepTags).toBe(true);
    expect(store.keepGroups).toBe(true);
    expect(store.fixedTags).toEqual(["work", "review"]);
    expect(store.fixedGroups).toEqual(["daily"]);
  });

  it("stores current selections when keep mode is enabled", () => {
    const store = useQuizRegistrationDefaultsStore();

    store.setKeepTags(true, [" work ", "work", "review"]);
    store.setKeepGroups(true, ["daily", "daily", "weekly"]);

    expect(store.keepTags).toBe(true);
    expect(store.keepGroups).toBe(true);
    expect(store.fixedTags).toEqual(["work", "review"]);
    expect(store.fixedGroups).toEqual(["daily", "weekly"]);

    expect(JSON.parse(window.localStorage.getItem("quiz-registration-defaults-v1") ?? "null")).toEqual({
      keepTags: true,
      keepGroups: true,
      fixedTags: ["work", "review"],
      fixedGroups: ["daily", "weekly"],
    });
  });

  it("updates persisted fixed values while keep mode is active", () => {
    const store = useQuizRegistrationDefaultsStore();
    store.setKeepTags(true, ["work"]);
    store.setKeepGroups(true, ["daily"]);

    store.setFixedTags(["focus", "focus"]);
    store.setFixedGroups(["weekly", "monthly"]);

    expect(store.fixedTags).toEqual(["focus"]);
    expect(store.fixedGroups).toEqual(["weekly", "monthly"]);
  });
});
