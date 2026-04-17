<script setup lang="ts">
type PipelineItem = {
  id: number;
  personA: string;
  personB: string;
  status: string;
  updatedAt: string;
};

type PipelineColumn = {
  title: string;
  status: string;
  isDone: boolean;
};

const props = defineProps<{
  columns: PipelineColumn[];
  items: PipelineItem[];
}>();

const getColumnItems = (status: string) => props.items.filter((item) => item.status === status);
</script>

<template>
  <div class="test-pipeline">
    <header class="test-pipeline__header">
      <h2 class="test-pipeline__title">Test Pipeline</h2>
      <p class="test-pipeline__subtitle">A small board used to verify app-shell and feature boundaries.</p>
    </header>

    <div class="test-pipeline__columns">
      <section
        v-for="column in columns"
        :key="column.status"
        class="test-pipeline__column"
        :class="{ 'test-pipeline__column--done': column.isDone }"
      >
        <header class="test-pipeline__column-header">
          <h3>{{ column.title }}</h3>
          <span>{{ getColumnItems(column.status).length }}</span>
        </header>

        <div class="test-pipeline__cards">
          <article
            v-for="item in getColumnItems(column.status)"
            :key="item.id"
            class="test-pipeline__card"
          >
            <p class="test-pipeline__timestamp">{{ item.updatedAt }}</p>
            <p class="test-pipeline__pair">{{ item.personA }} / {{ item.personB }}</p>
          </article>

          <div
            v-if="getColumnItems(column.status).length === 0"
            class="test-pipeline__empty"
          >
            No items
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.test-pipeline {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.test-pipeline__header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.test-pipeline__title {
  margin: 0;
  font-size: 1.8rem;
}

.test-pipeline__subtitle {
  margin: 0;
  color: #64748b;
}

.test-pipeline__columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.test-pipeline__column {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  background: #e2e8f0;
}

.test-pipeline__column--done {
  background: #dcfce7;
}

.test-pipeline__column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.test-pipeline__column-header h3,
.test-pipeline__column-header span {
  margin: 0;
}

.test-pipeline__cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 220px;
}

.test-pipeline__card,
.test-pipeline__empty {
  padding: 12px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.test-pipeline__timestamp {
  margin: 0 0 8px;
  font-size: 0.8rem;
  color: #64748b;
}

.test-pipeline__pair {
  margin: 0;
  font-weight: 700;
  color: #0f172a;
}

.test-pipeline__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  border-style: dashed;
}
</style>
