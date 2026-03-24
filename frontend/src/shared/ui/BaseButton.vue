<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
  }>(),
  {
    label: "",
    type: "button",
    disabled: false,
  }
);

defineEmits<{
  (e: "click"): void;
}>();
</script>

<template>
  <button :type="type" :disabled="disabled" class="custom-button" @click="$emit('click')">
    <template v-if="label">{{ label }}</template>
    <slot v-else />
  </button>
</template>
