import { computed, ref } from "vue";
import { defineStore, getActivePinia } from "pinia";
import type { HistoryCommandResult, UndoableAction } from "./history.types";

const useHistoryStore = defineStore("history", () => {
  const undoStack = ref<UndoableAction[]>([]);
  const redoStack = ref<UndoableAction[]>([]);
  const isRunning = ref(false);

  const execute = async (action: UndoableAction): Promise<HistoryCommandResult> => {
    if (isRunning.value) {
      return {
        ok: false,
        reason: "busy",
      };
    }

    isRunning.value = true;

    try {
      await action.do();
      undoStack.value = [...undoStack.value, action];
      redoStack.value = [];
      return {
        ok: true,
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        reason: "error",
        error,
      };
    } finally {
      isRunning.value = false;
    }
  };

  const undo = async (): Promise<HistoryCommandResult> => {
    const action = undoStack.value.at(-1);
    if (!action || isRunning.value) {
      return {
        ok: false,
        reason: "busy",
      };
    }

    isRunning.value = true;

    try {
      await action.undo();
      undoStack.value = undoStack.value.slice(0, -1);
      redoStack.value = [...redoStack.value, action];
      return {
        ok: true,
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        reason: "error",
        error,
      };
    } finally {
      isRunning.value = false;
    }
  };

  const redo = async (): Promise<HistoryCommandResult> => {
    const action = redoStack.value.at(-1);
    if (!action || isRunning.value) {
      return {
        ok: false,
        reason: "busy",
      };
    }

    isRunning.value = true;

    try {
      if (action.redo) {
        await action.redo();
      } else {
        await action.do();
      }

      redoStack.value = redoStack.value.slice(0, -1);
      undoStack.value = [...undoStack.value, action];
      return {
        ok: true,
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        reason: "error",
        error,
      };
    } finally {
      isRunning.value = false;
    }
  };

  const clear = () => {
    undoStack.value = [];
    redoStack.value = [];
  };

  const reset = () => {
    clear();
    isRunning.value = false;
  };

  return {
    undoStack,
    redoStack,
    isRunning,
    execute,
    undo,
    redo,
    clear,
    reset,
  };
});

export const resetHistoryManager = () => {
  if (!getActivePinia()) {
    return;
  }

  useHistoryStore().reset();
};

export const useHistoryManager = () => {
  const store = useHistoryStore();

  return {
    canUndo: computed(() => store.undoStack.length > 0),
    canRedo: computed(() => store.redoStack.length > 0),
    isRunning: computed(() => store.isRunning),
    execute: store.execute,
    undo: store.undo,
    redo: store.redo,
    clear: store.clear,
  };
};
