import { createRouter, createWebHistory } from "vue-router";
// import MemoItem from "../components/MemoItem.vue";
import MemoRow from "../components/MemoRow.vue";
// import MenuScreen from "../sanpo/MenuScreen.vue";

const routes = [
    // {
    //     path: "/top",
    //     component: MenuScreen,
    // },
    {
        path: "/",
        component: MemoRow,
    },
    // {
    //     path: "/",
    //     component: MemoRow,
    // },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});


export default router;