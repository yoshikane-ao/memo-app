<script setup lang="ts">
import axios from "axios";
import { ref, onMounted } from 'vue';
// import accordion from "./accordion.vue";

const active = ref(false);

const onClickTitle = () => {
    active.value = !active.value;
};

onMounted(() => {
    quiz_list();
})

type quiz_lists = { id: number; word: string; mean: string; quizTagsRelations: [quizTag: { id: number; tagName: string }] };

const lists = ref<quiz_lists[]>([]);
// const selected = ref([]);

const quiz_list = async () => {
    try {
        const response = await axios.get("/quiz/list");
        console.log(response.data[33].quizTagsRelations[0]);
        lists.value = response.data;

    } catch (error) {
        console.error("APIエラー:", error);
    }
}
console.log(quiz_list);


</script>
<template>
    <div>
        <h1>クイズ一覧</h1>

        <tr v-for="all_list in lists" :key="all_list.id">
            <!-- {{ all_list.word, all_list.mean }} -->
            <!-- <div v-for="tag_list in all_list.quizTagsRelations">
                {{ tag_list.tagName }}
            </div> -->
        <tr>
            <th>単語</th>
            <td><input type="text" :value="all_list.word"></td>
            <th>意味</th>
            <td><input type="text" :value="all_list.mean"></td>
            <th>タグ</th>
            <td v-for="(tag_list, index) in all_list.quizTagsRelations" :key="index">
                {{ tag_list.tagName }}
            </td>
        </tr>
        <tr>
        </tr>
        </tr>
    </div>
    <div id="app">
        <div class="title" @click="onClickTitle()">title</div>
        <transition name="accordion">
            <div class="content" v-show="active">
                <!-- <th v-for="all_list in lists" :key="all_list.id">
                    {{ tag_lists.tagName }}</th> -->
            </div>
        </transition>
    </div>
</template>

<style>
.content {
    height: 40px;
    overflow: hidden;
}

.accordion-enter-active,
.accordion-leave-active {
    transition: height .3s;
}

.accordion-enter,
.accordion-leave-to {
    height: 0;
}

.title:hover {
    opacity: 0.5;
}
</style>