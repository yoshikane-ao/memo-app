import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetHistoryManager, useHistoryManager } from "./useHistoryManager";
import { activateTestPinia } from "../../test/pinia";

describe("useHistoryManager", () => {
  beforeEach(() => {
    activateTestPinia();
    resetHistoryManager();
    vi.restoreAllMocks();
  });

  it("executes, undoes, and redoes actions in order", async () => {
    const history = useHistoryManager();
    const calls: string[] = [];

    const success = await history.execute({
      label: "demo",
      do: () => {
        calls.push("do");
      },
      undo: () => {
        calls.push("undo");
      },
      redo: () => {
        calls.push("redo");
      },
    });

    expect(success).toEqual({ ok: true });
    expect(history.canUndo.value).toBe(true);
    expect(history.canRedo.value).toBe(false);
    expect(history.lastTransition.value).toEqual({
      actionLabel: "demo",
      navigationTarget: undefined,
      phase: "do",
    });

    await history.undo();
    expect(history.lastTransition.value).toEqual({
      actionLabel: "demo",
      navigationTarget: undefined,
      phase: "undo",
    });
    await history.redo();
    expect(history.lastTransition.value).toEqual({
      actionLabel: "demo",
      navigationTarget: undefined,
      phase: "redo",
    });

    expect(calls).toEqual(["do", "undo", "redo"]);
    expect(history.canUndo.value).toBe(true);
    expect(history.canRedo.value).toBe(false);
  });

  it("does not record failed actions", async () => {
    const history = useHistoryManager();
    vi.spyOn(console, "error").mockImplementation(() => {});

    const success = await history.execute({
      label: "broken",
      do: () => {
        throw new Error("boom");
      },
      undo: () => undefined,
    });

    expect(success.ok).toBe(false);
    expect(history.canUndo.value).toBe(false);
    expect(history.canRedo.value).toBe(false);
    expect(history.lastTransition.value).toBeNull();
  });
});
