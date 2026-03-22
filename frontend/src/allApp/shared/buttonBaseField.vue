<script setup>
defineProps({
  // 表示名称を受け取る設定を追加
  label: {
    type: String,
    default: '' // 指定がない場合は空
  },
  type: {
    type: String,
    default: 'button'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])
</script>

<template>
  <button 
    :type="type" 
    :disabled="disabled"
    class="custom-button"
    @click="$emit('click')"
  >
    <template v-if="label">{{ label }}</template>
    <slot v-else></slot> 
  </button>
</template>

<!-- <style scoped>
/* デザインはそのまま */
.custom-button {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  background-color: #4caf50; /* サンプルの色 */
  color: white;
  font-weight: bold;
  transition: opacity 0.2s;
}
.custom-button:hover {
  opacity: 0.8;
}
.custom-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style> -->