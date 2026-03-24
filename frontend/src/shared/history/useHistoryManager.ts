import { computed, ref } from "vue";
import type { HistoryCommandResult, UndoableAction } from "./history.types";

const undoStack = ref<UndoableAction[]>([]);
const redoStack = ref<UndoableAction[]>([]);
const isRunning = ref(false);

const executeAction = async (action: UndoableAction): Promise<HistoryCommandResult> => {
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

export const resetHistoryManager = () => {
  clear();
  isRunning.value = false;
};

export const useHistoryManager = () => ({
  canUndo: computed(() => undoStack.value.length > 0),
  canRedo: computed(() => redoStack.value.length > 0),
  isRunning: computed(() => isRunning.value),
  execute: executeAction,
  undo,
  redo,
  clear,
});
