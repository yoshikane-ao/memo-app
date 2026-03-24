import { onBeforeUnmount, onMounted } from "vue";
import { useActiveCopyTarget } from "./activeCopyTarget";

const isCopyShortcut = (event: KeyboardEvent) =>
  event.key.toLowerCase() === "c" &&
  !event.altKey &&
  (event.ctrlKey || event.metaKey);

const hasTextInputSelection = (target: EventTarget | null) => {
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
    return false;
  }

  return (target.selectionStart ?? 0) !== (target.selectionEnd ?? 0);
};

const hasDomSelection = () => {
  const selection = window.getSelection();
  return selection != null && selection.toString().length > 0;
};

const isWithinTargetRoot = (target: EventTarget | null, root: HTMLElement | null) =>
  target instanceof Node && root != null && root.contains(target);

export const useCopyShortcuts = () => {
  const { activeTarget, clearActiveTarget } = useActiveCopyTarget();

  const handlePointerDown = (event: PointerEvent) => {
    const currentTarget = activeTarget.value;
    const root = currentTarget?.getRoot() ?? null;

    if (!currentTarget || !root) {
      return;
    }

    if (!isWithinTargetRoot(event.target, root)) {
      clearActiveTarget(currentTarget.id);
    }
  };

  const handleKeydown = async (event: KeyboardEvent) => {
    const selectionTarget = document.activeElement ?? event.target;

    if (
      event.defaultPrevented ||
      !isCopyShortcut(event) ||
      hasTextInputSelection(selectionTarget)
    ) {
      return;
    }

    if (hasDomSelection()) {
      return;
    }

    const currentTarget = activeTarget.value;
    const root = currentTarget?.getRoot() ?? null;
    if (!currentTarget || !root) {
      return;
    }

    const activeElement = document.activeElement;
    if (
      activeElement != null &&
      activeElement !== document.body &&
      !root.contains(activeElement)
    ) {
      return;
    }

    event.preventDefault();
    await currentTarget.copy();
  };

  onMounted(() => {
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("pointerdown", handlePointerDown, true);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("keydown", handleKeydown);
    window.removeEventListener("pointerdown", handlePointerDown, true);
  });
};
