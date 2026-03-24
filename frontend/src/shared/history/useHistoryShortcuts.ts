import { onBeforeUnmount, onMounted } from "vue";
import { useHistoryManager } from "./useHistoryManager";

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
};

const isUndoShortcut = (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();
  return key === "z" && !event.shiftKey && !event.altKey && (event.ctrlKey || event.metaKey);
};

const isRedoShortcut = (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();

  if (event.altKey || !(event.ctrlKey || event.metaKey)) {
    return false;
  }

  return key === "y" || (key === "z" && event.shiftKey);
};

export const useHistoryShortcuts = () => {
  const history = useHistoryManager();

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || isEditableTarget(event.target)) {
      return;
    }

    if (isUndoShortcut(event) && history.canUndo.value) {
      event.preventDefault();
      void history.undo();
      return;
    }

    if (isRedoShortcut(event) && history.canRedo.value) {
      event.preventDefault();
      void history.redo();
    }
  };

  onMounted(() => {
    window.addEventListener("keydown", handleKeydown);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("keydown", handleKeydown);
  });
};
