<script setup lang="ts">
import { useTagRegister } from './tagRegister';

const props = defineProps<{
  memoId?: number;
  inputTitle: string;
}>();

const emit = defineEmits(['tag-registered']);
const { registerTag } = useTagRegister();

const handleAddTag = async () => {
  const newTag = await registerTag(props.memoId, props.inputTitle);

  if (newTag) {
    emit('tag-registered', newTag);
    return;
  }

  alert('タグの作成に失敗しました。');
};
</script>

<template>
  <div v-if="inputTitle.trim()" class="tag-register-container">
    <button class="add-tag-button" @click="handleAddTag">
      <span class="plus-icon">+</span>
      「{{ inputTitle }}」を新規追加する
    </button>
  </div>
</template>

<style scoped>
.tag-register-container {
  border-top: 1px solid #eee;
  padding-top: 8px;
  margin-top: 8px;
}

.add-tag-button {
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  background: none;
  border: none;
  color: #1a73e8;
  cursor: pointer;
  font-size: 0.9rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.add-tag-button:hover {
  background-color: #f1f3f4;
}

.plus-icon {
  margin-right: 8px;
  font-weight: bold;
}
</style>
