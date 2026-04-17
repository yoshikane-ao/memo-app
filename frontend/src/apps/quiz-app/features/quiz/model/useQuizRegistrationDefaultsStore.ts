import { computed, ref } from "vue";
import { defineStore } from "pinia";

type PersistedRegistrationDefaults = {
  keepTags: boolean;
  keepGroups: boolean;
  fixedTags: string[];
  fixedGroups: string[];
};

const STORAGE_KEY = "quiz-registration-defaults-v1";

const normalizeSelection = (values: string[]) => {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed === "" || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
};

const readPersistedDefaults = (): PersistedRegistrationDefaults => {
  if (typeof window === "undefined") {
    return {
      keepTags: false,
      keepGroups: false,
      fixedTags: [],
      fixedGroups: [],
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        keepTags: false,
        keepGroups: false,
        fixedTags: [],
        fixedGroups: [],
      };
    }

    const parsed = JSON.parse(raw) as Partial<PersistedRegistrationDefaults>;

    return {
      keepTags: parsed.keepTags === true,
      keepGroups: parsed.keepGroups === true,
      fixedTags: Array.isArray(parsed.fixedTags) ? normalizeSelection(parsed.fixedTags) : [],
      fixedGroups: Array.isArray(parsed.fixedGroups) ? normalizeSelection(parsed.fixedGroups) : [],
    };
  } catch {
    return {
      keepTags: false,
      keepGroups: false,
      fixedTags: [],
      fixedGroups: [],
    };
  }
};

export const useQuizRegistrationDefaultsStore = defineStore("quizRegistrationDefaults", () => {
  const initialState = readPersistedDefaults();

  const keepTags = ref(initialState.keepTags);
  const keepGroups = ref(initialState.keepGroups);
  const fixedTags = ref(initialState.fixedTags);
  const fixedGroups = ref(initialState.fixedGroups);

  const persist = () => {
    if (typeof window === "undefined") {
      return;
    }

    const payload: PersistedRegistrationDefaults = {
      keepTags: keepTags.value,
      keepGroups: keepGroups.value,
      fixedTags: fixedTags.value,
      fixedGroups: fixedGroups.value,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  };

  const setFixedTags = (nextTags: string[]) => {
    fixedTags.value = normalizeSelection(nextTags);
    persist();
  };

  const setFixedGroups = (nextGroups: string[]) => {
    fixedGroups.value = normalizeSelection(nextGroups);
    persist();
  };

  const setKeepTags = (enabled: boolean, currentSelection: string[] = fixedTags.value) => {
    keepTags.value = enabled;
    if (enabled) {
      fixedTags.value = normalizeSelection(currentSelection);
    }
    persist();
  };

  const setKeepGroups = (enabled: boolean, currentSelection: string[] = fixedGroups.value) => {
    keepGroups.value = enabled;
    if (enabled) {
      fixedGroups.value = normalizeSelection(currentSelection);
    }
    persist();
  };

  return {
    keepTags: computed(() => keepTags.value),
    keepGroups: computed(() => keepGroups.value),
    fixedTags: computed(() => fixedTags.value),
    fixedGroups: computed(() => fixedGroups.value),
    setKeepTags,
    setKeepGroups,
    setFixedTags,
    setFixedGroups,
  };
});
