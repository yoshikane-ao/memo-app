import { defineStore } from "pinia";
import { ref } from "vue";
import type { MemoViewScope } from "./memoView.types";

export const useMemoViewStore = defineStore("memoView", () => {
  const currentScope = ref<MemoViewScope>("active");

  const setScope = (scope: MemoViewScope) => {
    currentScope.value = scope;
  };

  return {
    currentScope,
    setScope,
  };
});
