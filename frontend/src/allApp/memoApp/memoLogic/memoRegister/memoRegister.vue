<script setup>
import { reactive, ref } from 'vue'
import { MemoRegister } from './memoRegister.ts'
import inputBaseField from '../../../shared/inputBaseField.vue'
import buttonBaseField from '../../../shared/buttonBaseField.vue'
import tagSearch from '../../tagLogic/tagSearch/tagSearch.vue';

// defineEmits を使って、親に合図を送るための「emit」関数を定義します
const emit = defineEmits(['save-success'])

const { executeRegister } = MemoRegister();

// 新規登録用のデータを保持する「箱」
const newMemo = reactive({
  title: '',
  content: ''
})

const showTagSearch = ref(false);
const localTags = ref([]); // 作成予定のメモに紐づけるタグのリスト

const handleLocalTagAdded = (tagObj) => {
  // tagObj は { id, title } などを想定
  if (!localTags.value.find(t => t.title === tagObj.title)) {
    localTags.value.push(tagObj);
  }
};

const handleRemoveLocalTag = (index) => {
  localTags.value.splice(index, 1);
};

// 保存ボタンが押された時の処理
const handleSave = async () => {
  const success = await executeRegister({
    title: newMemo.title,
    content: newMemo.content,
    tags: localTags.value.map(t => t.title) // タグ名の配列を渡す
  });
  if (success) {
    // 【変更】ここで親（MemoScreen）に合図を送る
    emit('save-success'); 

    alert("メモを保存しました！");
    newMemo.title = '';
    newMemo.content = '';
    localTags.value = [];
    showTagSearch.value = false;
  }
};
</script>

<template>
  <div class="memo-register-wrapper" style="margin-bottom: 2rem;">
    <div style="display: flex; gap: 10px; align-items: flex-end; margin-bottom: 10px;">
      <div style="flex: 1;">
        <inputBaseField
          id="title"
          label=""
          v-model="newMemo.title"
          placeholder="タイトルを入力してください"
        />
      </div>
      
      <div class="tag-dropdown-wrapper" style="position: relative; padding-bottom: 0.5rem;">
        <button @click="showTagSearch = !showTagSearch" class="icon-btn" title="タグ設定" style="cursor: pointer; font-size: 1.5rem; border: none; background: none; padding: 5px;">⚙️</button>
        
        <tagSearch 
          v-if="showTagSearch" 
          @tag-added="handleLocalTagAdded" 
          @close="showTagSearch = false"
        />
      </div>
    </div>

    <!-- 既に選択されたタグを簡易表示しておく -->
    <div style="margin-bottom: 10px;" v-if="localTags.length > 0">
      <span v-for="(tag, index) in localTags" :key="'out-'+tag.title" class="tag-badge" style="display:inline-block; margin-right:5px; margin-bottom:5px; font-size:0.8rem; background:#4a90e2; color:white; padding:4px 8px; border-radius:4px;">
        #{{ tag.title }}
        <button @click.prevent="handleRemoveLocalTag(index)" style="background:none; border:none; color:white; cursor:pointer; margin-left:3px;">×</button>
      </span>
    </div>

    <inputBaseField
      id="content"
      label=""
      v-model="newMemo.content"
      placeholder="内容を入力してください"
      :multiline="true"
      :rows="6"
    />

    <buttonBaseField
      id="submit"
      label="保存"
      @click="handleSave">
    </buttonBaseField>
  </div>
</template>