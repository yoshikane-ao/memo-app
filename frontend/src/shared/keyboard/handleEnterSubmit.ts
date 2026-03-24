export const isSubmitEnter = (event: KeyboardEvent) =>
  event.key === "Enter" &&
  !event.ctrlKey &&
  !event.metaKey &&
  !event.altKey &&
  !event.isComposing;

export const handleSingleLineEnterSubmit = (
  event: KeyboardEvent,
  onSubmit: () => void,
  canSubmit: () => boolean
) => {
  if (!isSubmitEnter(event) || event.shiftKey) {
    return;
  }

  event.preventDefault();

  if (canSubmit()) {
    onSubmit();
  }
};

export const handleMultilineEnterSubmit = (
  event: KeyboardEvent,
  onSubmit: () => void,
  canSubmit: () => boolean
) => {
  if (!isSubmitEnter(event)) {
    return;
  }

  if (event.shiftKey) {
    return;
  }

  event.preventDefault();

  if (canSubmit()) {
    onSubmit();
  }
};
