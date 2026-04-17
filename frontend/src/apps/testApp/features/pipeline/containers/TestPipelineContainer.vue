<script setup lang="ts">
import TestPipelineBoard from "../ui/TestPipelineBoard.vue";

const items = [
  { id: 201, personA: "Taro", personB: "Hanako", status: "draft", updatedAt: "Today 10:30" },
  { id: 202, personA: "Ken", personB: "Mika", status: "waiting_a", updatedAt: "Yesterday 15:00" },
  { id: 203, personA: "Sora", personB: "Aoi", status: "scheduling", updatedAt: "3 days ago" },
  { id: 204, personA: "Rin", personB: "Kai", status: "completed", updatedAt: "1 week ago" },
];

const columns = [
  { title: "Draft", status: "draft", isDone: false },
  { title: "Waiting A", status: "waiting_a", isDone: false },
  { title: "Waiting B", status: "waiting_b", isDone: false },
  { title: "Scheduling", status: "scheduling", isDone: false },
  { title: "Completed", status: "completed", isDone: true },
];
</script>

<template>
  <TestPipelineBoard :columns="columns" :items="items" />
</template>
