<script setup>
import { reactive, ref, computed } from 'vue'
import { MemoRegister } from './memoRegister.ts'
import buttonBaseField from '../../../shared/buttonBaseField.vue'
import tagSearch from '../../tagLogic/tagSearch/tagSearch.vue';
import TagBadgeList from '../../tagLogic/tagBadgeList/tagBadgeList.vue';

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

// タグ追加（トグルの「追加」側）
const handleLocalTagAdded = (tagObj) => {
  if (!localTags.value.find(t => t.id === tagObj.id)) {
    localTags.value.push(tagObj);
  }
};

// タグ解除（トグルの「解除」側）
const handleLocalTagRemoved = (tagObj) => {
  localTags.value = localTags.value.filter(t => t.id !== tagObj.id);
};

// TagBadgeListからの削除
const handleBadgeRemove = (tag) => {
  localTags.value = localTags.value.filter(t => t.id !== tag.id);
};

// 選択中タグのID配列（tagSearchに渡してハイライトさせる）
const linkedTagIds = computed(() => localTags.value.map(t => t.id));

// 保存ボタンが押された時の処理
const handleSave = async () => {
  const success = await executeRegister({
    title: newMemo.title,
    content: newMemo.content,
    tags: localTags.value.map(t => t.title)
  });
  if (success) {
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
  <div class="memo-register-wrapper">
    <!-- タイトルとコンテンツを横並び -->
    <div class="register-row">
      <div class="title-cell">
        <textarea
          id="reg-title"
          v-model="newMemo.title"
          placeholder="タイトル"
          rows="1"
          class="title-input"
        />
      </div>
      <div class="content-cell">
        <textarea
          id="reg-content"
          v-model="newMemo.content"
          placeholder="内容を入力してください"
          rows="2"
          class="content-input"
        />
      </div>
    </div>

    <!-- 選択タグ＋ボタン行 -->
    <div class="register-bottom-row">
      <buttonBaseField
        id="submit"
        label="保存"
        @click="handleSave">
      </buttonBaseField>
      
      <div class="tag-dropdown-wrapper">
        <button @click.stop="showTagSearch = !showTagSearch" class="tag-add-btn" title="タグ設定">
          ⚙️ タグ
        </button>
        <tagSearch 
          v-if="showTagSearch"
          :linkedTagIds="linkedTagIds"
          @tag-added="handleLocalTagAdded"
          @tag-removed="handleLocalTagRemoved"
          @close="showTagSearch = false"
        />
      </div>

      <TagBadgeList
        :tags="localTags"
        @remove="handleBadgeRemove"
      />
    </div>
  </div>
</template>