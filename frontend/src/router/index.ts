import { createRouter, createWebHistory } from "vue-router";
// import MemoItem from "../components/MemoItem.vue";
// import MemoRow from "../components/memo-app/MemoRow.vue";
// import MenuScreen from "../components/sanpo/MenuScreen.vue";
// import GameScreen from "../components/sanpo/GameScreen.vue";
// import MemoList from "../components/memo-app/memo/MemoList.vue";
// import MemoRow from "../allApp/memoApp/MemoRow.vue";
import MemoScreen from "../allApp/memoApp/mainView/memoScreen.vue";

const routes = [
    // {
    //     path: "/top",
    //     component: MenuScreen,
    // },
    // {
    //     path: "/top/login",
    //     component: GameScreen,
    // },
    {
        path: "/",
        component: MemoScreen,
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