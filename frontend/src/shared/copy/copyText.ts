const canRestoreTextSelection = (
  element: Element | null
): element is HTMLInputElement | HTMLTextAreaElement =>
  element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;

const fallbackCopyText = (text: string) => {
  if (typeof document === "undefined" || typeof document.execCommand !== "function") {
    throw new Error("Clipboard API is unavailable.");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.setAttribute("aria-hidden", "true");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";

  const activeElement = document.activeElement;
  const textSelection = canRestoreTextSelection(activeElement)
    ? {
        start: activeElement.selectionStart,
        end: activeElement.selectionEnd,
        direction: activeElement.selectionDirection,
      }
    : null;
  const selection = document.getSelection();
  const range =
    selection != null && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;

  document.body.appendChild(textarea);

  try {
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    if (!document.execCommand("copy")) {
      throw new Error("Fallback copy failed.");
    }
  } finally {
    textarea.remove();

    if (selection) {
      selection.removeAllRanges();
      if (range) {
        selection.addRange(range);
      }
    }

    if (activeElement instanceof HTMLElement) {
      activeElement.focus();
    }

    if (textSelection && canRestoreTextSelection(activeElement)) {
      try {
        activeElement.setSelectionRange(
          textSelection.start,
          textSelection.end,
          textSelection.direction ?? undefined
        );
      } catch {
        // Some input types do not support restoring selection ranges.
      }
    }
  }
};

export const copyText = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  fallbackCopyText(text);
};
