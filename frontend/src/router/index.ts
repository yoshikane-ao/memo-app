import { createRouter, createWebHistory } from "vue-router";
// import MemoItem from "../components/MemoItem.vue";
import MemoRow from "../components/MemoRow.vue";
import MenuScreen from "../components/sanpo/MenuScreen.vue";
import GameScreen from "../components/sanpo/GameScreen.vue";

const routes = [
    {
        path: "/top",
        component: MenuScreen,
    },
    {
        path: "/top/login",
        component: GameScreen,
    },
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