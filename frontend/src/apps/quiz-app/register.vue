<script setup lang="ts">
import { ref } from 'vue';
import axios from "axios";
import BaseButton from '../../shared/ui/BaseButton.vue';
import list from "./list.vue"

const api = axios.create();
const new_word = ref("");
const new_mean = ref("");
const new_tag = ref();

async function quizregister() {
  try {
    const new_tag_list: string[] = []
    new_tag_list.push(new_tag.value)
    await api.post("/quiz/register", { word: new_word.value.trim(), mean: new_mean.value.trim(), tag: new_tag_list });
    new_word.value = "";
    new_mean.value = "";
    new_tag.value = [];
  } catch (error) {

  }
}

</script>

<template>
  <input v-model="new_word" type="text" placeholder="単語">
  <input v-model="new_mean" type="text" placeholder="意味">
  <input v-model="new_tag" type="text" placeholder="タグ">

  <BaseButton class="register-btn" label="登録" @click="quizregister" />

  <list />
</template>