import { computed, ref, watch, type ComputedRef } from "vue";

interface ListboxOption {
  id: number;
}

const clampIndex = (index: number, maxIndex: number) => Math.min(Math.max(index, 0), maxIndex);

export const useListboxNavigation = <T extends ListboxOption>(
  options: ComputedRef<readonly T[]>,
  getPreferredActiveId: () => number | null = () => null
) => {
  const activeId = ref<number | null>(null);

  const activeIndex = computed(() =>
    options.value.findIndex((option) => option.id === activeId.value)
  );

  const activeOption = computed(() =>
    options.value.find((option) => option.id === activeId.value) ?? null
  );

  const setActiveId = (nextId: number | null) => {
    activeId.value = nextId;
  };

  const moveToIndex = (nextIndex: number) => {
    if (options.value.length === 0) {
      activeId.value = null;
      return null;
    }

    const boundedIndex = clampIndex(nextIndex, options.value.length - 1);
    const nextOption = options.value[boundedIndex] ?? null;
    activeId.value = nextOption?.id ?? null;
    return nextOption;
  };

  const moveNext = () =>
    moveToIndex(activeIndex.value < 0 ? 0 : activeIndex.value + 1);

  const movePrevious = () =>
    moveToIndex(activeIndex.value < 0 ? options.value.length - 1 : activeIndex.value - 1);

  const moveFirst = () => moveToIndex(0);

  const moveLast = () => moveToIndex(options.value.length - 1);

  watch(
    options,
    (nextOptions) => {
      if (nextOptions.length === 0) {
        activeId.value = null;
        return;
      }

      if (nextOptions.some((option) => option.id === activeId.value)) {
        return;
      }

      const preferredActiveId = getPreferredActiveId();
      activeId.value =
        preferredActiveId != null && nextOptions.some((option) => option.id === preferredActiveId)
          ? preferredActiveId
          : null;
    },
    { immediate: true }
  );

  return {
    activeId,
    activeIndex,
    activeOption,
    setActiveId,
    moveNext,
    movePrevious,
    moveFirst,
    moveLast,
  };
};
