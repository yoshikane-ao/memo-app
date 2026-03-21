<script setup >
defineProps({
  id: {
    type: String,
    required: true
  },
  label: {
    type: String,
    default: ''
  },
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  multiline: {
    type: Boolean,
    default: false
  },
  rows: {
    type: Number,
    default: 4
  }
})

const emit = defineEmits(['update:modelValue'])

const onInput = (event) => {
  emit('update:modelValue', event.target.value)
}
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>

<button class="custom-button">
    <slot>デフォルトテキスト</slot>
  </button>

    <!-- <button
      v-else
      :id="id"
      type="text"
      :value="modelValue"
      :placeholder="placeholder"
      @input="onInput"
    /> -->
  </div>
</template>