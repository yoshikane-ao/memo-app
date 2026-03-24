import { createRouter, createWebHistory } from "vue-router";
import MemoPage from "../pages/memo/MemoPage.vue";

const routes = [
  {
    path: "/",
    component: MemoPage,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
