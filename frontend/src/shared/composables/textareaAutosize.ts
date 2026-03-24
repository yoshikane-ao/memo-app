const DEFAULT_WIDTH_PADDING = 4;

export function applyAutoWidth(
  textarea: HTMLTextAreaElement,
  options?: {
    min?: number;
    max?: number;
    padding?: number;
  }
) {
  const min = options?.min ?? 80;
  const max = options?.max ?? 500;
  const padding = options?.padding ?? DEFAULT_WIDTH_PADDING;

  textarea.style.width = "0px";
  const nextWidth = Math.min(Math.max(textarea.scrollWidth + padding, min), max);
  textarea.style.width = `${nextWidth}px`;
  return nextWidth;
}

export function applyAutoHeight(
  textarea: HTMLTextAreaElement,
  options?: {
    min?: number;
  }
) {
  const min = options?.min ?? 32;

  textarea.style.height = "0px";
  const nextHeight = Math.max(textarea.scrollHeight, min);
  textarea.style.height = `${nextHeight}px`;
  return nextHeight;
}
