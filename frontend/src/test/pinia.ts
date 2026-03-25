import { createPinia, setActivePinia, type Pinia } from "pinia";

export const activateTestPinia = (): Pinia => {
  const pinia = createPinia();
  setActivePinia(pinia);
  return pinia;
};
