import { computed } from "vue";
import { useMemoStore } from "./useMemoStore";
import { useTagStore } from "../../tag/model/useTagStore";
import { useHistoryManager } from "../../../../../shared/history/useHistoryManager";
import { createMemoCommandHandlers } from "./memoCommandHandlers";
import { createTagCommandHandlers } from "./tagCommandHandlers";

export const useMemoHistoryCommands = () => {
  const memoStore = useMemoStore();
  const tagStore = useTagStore();
  const history = useHistoryManager();

  return {
    canUndo: computed(() => history.canUndo.value),
    canRedo: computed(() => history.canRedo.value),
    ...createMemoCommandHandlers({ memoStore, history }),
    ...createTagCommandHandlers({ memoStore, tagStore, history }),
    undo: history.undo,
    redo: history.redo,
    clearHistory: history.clear,
  };
};
