<script setup lang="ts">
import "../styles/index.css";
import FeedbackBanner from "../../../shared/feedback/FeedbackBanner.vue";
import {
  MemoScopeTabs,
  MemoToolbar,
  MemoTrashActionsContainer,
  MemoTrashListContainer,
} from "../features/memo";
import { useMemoHistoryCommands } from "../features/memo/model/useMemoHistoryCommands";
import type { MemoViewScope } from "../features/view/model/memoView.types";
import { useMemoPageSetup } from "./useMemoPageSetup";

/*
  追加:
  タブ切り替え時に実際のページ遷移を行うため、Vue Router を使います。
*/
import { useRouter } from "vue-router";

/*
  追加:
  既存の route 定義をそのまま使います。
*/
import { memoPaths } from "../routes";

const commands = useMemoHistoryCommands();
const { keyword, searchType, sortOrder, selectedTags, displayedMemos } = useMemoPageSetup({
  scope: "trash",
  listView: {
    allowManualReorder: false,
    defaultSortOrder: "newest",
    sortTimestamp: "deletedAt",
  },
});

/*
  追加:
  router インスタンスを取得します。
*/
const router = useRouter();

/*
  修正:
  ごみ箱画面でも、タブ切り替え時は store 切り替えではなく
  route 遷移を行います。
*/
const handleScopeChange = (scope: MemoViewScope) => {
  void router.push(scope === "trash" ? memoPaths.trash : memoPaths.active);
};
</script>

<template>
  <section class="memo-app-page">
    <FeedbackBanner />
    <MemoScopeTabs scope="trash" :disabled="commands.isHistoryBusy.value" @scope-change="handleScopeChange" />
    <MemoTrashActionsContainer />
    <MemoToolbar :keyword="keyword" :searchType="searchType" :sortOrder="sortOrder" :selectedTags="selectedTags"
      :showSortOrder="false" @update:keyword="keyword = $event" @update:searchType="searchType = $event"
      @update:sortOrder="sortOrder = $event" @update:selectedTags="selectedTags = $event" />
    <MemoTrashListContainer :items="displayedMemos" />
  </section>
</template>