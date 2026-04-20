import { defineStore } from 'pinia';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'app.theme.mode';
const DEFAULT_MODE: ThemeMode = 'light';

const readStoredMode = (): ThemeMode => {
  if (typeof window === 'undefined') return DEFAULT_MODE;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === 'light' || value === 'dark' ? value : DEFAULT_MODE;
};

const applyMode = (mode: ThemeMode) => {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = mode;
};

export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: readStoredMode() as ThemeMode,
  }),
  actions: {
    setMode(mode: ThemeMode) {
      this.mode = mode;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, mode);
      }
      applyMode(mode);
    },
    toggle() {
      this.setMode(this.mode === 'light' ? 'dark' : 'light');
    },
    init() {
      applyMode(this.mode);
    },
  },
});

export const initThemeBeforeMount = () => {
  applyMode(readStoredMode());
};
