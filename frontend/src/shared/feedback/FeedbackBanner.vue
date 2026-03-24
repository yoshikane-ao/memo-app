<script setup lang="ts">
import { useFeedbackStore } from "./useFeedbackStore";

const { kind, message } = useFeedbackStore();
</script>

<template>
  <div
    v-if="message"
    class="feedback-banner"
    :class="{
      'feedback-banner-error': kind === 'error',
      'feedback-banner-info': kind === 'info',
    }"
    role="status"
    aria-live="polite"
  >
    {{ message }}
  </div>
</template>
