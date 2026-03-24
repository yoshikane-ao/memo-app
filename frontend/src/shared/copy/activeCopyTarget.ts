import { computed, ref } from "vue";

export interface CopyTarget {
  id: number;
  getRoot: () => HTMLElement | null;
  copy: () => Promise<boolean> | boolean;
}

const activeTarget = ref<CopyTarget | null>(null);

export const setActiveCopyTarget = (target: CopyTarget) => {
  activeTarget.value = target;
};

export const clearActiveCopyTarget = (id?: number) => {
  if (id == null || activeTarget.value?.id === id) {
    activeTarget.value = null;
  }
};

export const resetActiveCopyTarget = () => {
  activeTarget.value = null;
};

export const useActiveCopyTarget = () => ({
  activeTarget: computed(() => activeTarget.value),
  setActiveTarget: setActiveCopyTarget,
  clearActiveTarget: clearActiveCopyTarget,
});
