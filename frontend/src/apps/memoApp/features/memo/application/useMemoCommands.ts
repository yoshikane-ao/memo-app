import { computed } from "vue";
import { useMemoStore } from "../model/useMemoStore";
import { createMemoViewCommandHandlers, useMemoViewStore } from "../../view";
import { useHistoryManager } from "../../../../../shared/history/useHistoryManager";
import { createMemoCommandHandlers } from "./memoCommandHandlers";

export const useMemoHistoryCommands = () => {
  const memoStore = useMemoStore();
  const viewStore = useMemoViewStore();
  const history = useHistoryManager();

  return {
    canUndo: computed(() => history.canUndo.value),
    canRedo: computed(() => history.canRedo.value),
    isHistoryBusy: computed(() => history.isRunning.value),
    ...createMemoCommandHandlers({ memoStore, viewStore, history }),
    ...createMemoViewCommandHandlers({ viewStore, history }),
    undo: history.undo,
    redo: history.redo,
    clearHistory: history.clear,
  };
};
