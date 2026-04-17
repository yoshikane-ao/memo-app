import { computed, ref } from "vue";
import { defineStore } from "pinia";

type PersistedMemoComposerDefaults = {
  keepTags: boolean;
  fixedTagTitles: string[];
};

const STORAGE_KEY = "memo-composer-defaults-v1";

const normalizeTagTitles = (titles: string[]) => {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const title of titles) {
    const trimmed = title.trim();
    if (trimmed === "" || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
};

const readPersistedDefaults = (): PersistedMemoComposerDefaults => {
  if (typeof window === "undefined") {
    return {
      keepTags: false,
      fixedTagTitles: [],
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        keepTags: false,
        fixedTagTitles: [],
      };
    }

    const parsed = JSON.parse(raw) as Partial<PersistedMemoComposerDefaults>;
    return {
      keepTags: parsed.keepTags === true,
      fixedTagTitles: Array.isArray(parsed.fixedTagTitles)
        ? normalizeTagTitles(parsed.fixedTagTitles)
        : [],
    };
  } catch {
    return {
      keepTags: false,
      fixedTagTitles: [],
    };
  }
};

export const useMemoComposerDefaultsStore = defineStore("memoComposerDefaults", () => {
  const initialState = readPersistedDefaults();

  const keepTags = ref(initialState.keepTags);
  const fixedTagTitles = ref(initialState.fixedTagTitles);

  const persist = () => {
    if (typeof window === "undefined") {
      return;
    }

    const payload: PersistedMemoComposerDefaults = {
      keepTags: keepTags.value,
      fixedTagTitles: fixedTagTitles.value,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  };

  const setFixedTagTitles = (titles: string[]) => {
    fixedTagTitles.value = normalizeTagTitles(titles);
    persist();
  };

  const setKeepTags = (enabled: boolean, currentTitles: string[] = fixedTagTitles.value) => {
    keepTags.value = enabled;
    if (enabled) {
      fixedTagTitles.value = normalizeTagTitles(currentTitles);
    }
    persist();
  };

  return {
    keepTags: computed(() => keepTags.value),
    fixedTagTitles: computed(() => fixedTagTitles.value),
    setKeepTags,
    setFixedTagTitles,
  };
});
