import { computed } from "vue";
import { useMemoStore } from "./useMemoStore";
import { useTagStore } from "../../tag/model/useTagStore";
import { useMemoViewStore } from "../../view/model/useMemoViewStore";
import { useHistoryManager } from "../../../../../shared/history/useHistoryManager";
import { createMemoCommandHandlers } from "./memoCommandHandlers";
import { createTagCommandHandlers } from "./tagCommandHandlers";
import { createMemoViewCommandHandlers } from "../../view/model/memoViewCommandHandlers";

export const useMemoHistoryCommands = () => {
  const memoStore = useMemoStore();
  const tagStore = useTagStore();
  const viewStore = useMemoViewStore();
  const history = useHistoryManager();

  return {
    canUndo: computed(() => history.canUndo.value),
    canRedo: computed(() => history.canRedo.value),
    isHistoryBusy: computed(() => history.isRunning.value),
    ...createMemoCommandHandlers({ memoStore, viewStore, history }),
    ...createMemoViewCommandHandlers({ viewStore, history }),
    ...createTagCommandHandlers({ memoStore, tagStore, history }),
    undo: history.undo,
    redo: history.redo,
    clearHistory: history.clear,
  };
};
