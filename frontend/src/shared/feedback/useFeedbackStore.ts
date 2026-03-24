import { computed, ref } from "vue";

type FeedbackKind = "error" | "info";

const message = ref<string | null>(null);
const kind = ref<FeedbackKind>("info");

let clearTimer: ReturnType<typeof setTimeout> | null = null;

const scheduleClear = (timeoutMs: number) => {
  if (clearTimer) {
    clearTimeout(clearTimer);
  }

  clearTimer = setTimeout(() => {
    message.value = null;
    clearTimer = null;
  }, timeoutMs);
};

export const useFeedbackStore = () => {
  const show = (nextMessage: string, nextKind: FeedbackKind, timeoutMs = 4000) => {
    message.value = nextMessage;
    kind.value = nextKind;
    scheduleClear(timeoutMs);
  };

  const clear = () => {
    if (clearTimer) {
      clearTimeout(clearTimer);
      clearTimer = null;
    }

    message.value = null;
  };

  return {
    message: computed(() => message.value),
    kind: computed(() => kind.value),
    showError: (nextMessage: string, timeoutMs?: number) => show(nextMessage, "error", timeoutMs),
    showInfo: (nextMessage: string, timeoutMs?: number) => show(nextMessage, "info", timeoutMs),
    clear,
  };
};
