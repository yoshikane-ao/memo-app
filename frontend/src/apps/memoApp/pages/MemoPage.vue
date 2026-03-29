<script setup lang="ts">
import "../styles/index.css";
import FeedbackBanner from "../../../shared/feedback/FeedbackBanner.vue";
import {
  MemoComposerContainer,
  MemoListContainer,
  MemoScopeTabs,
  MemoToolbar,
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
  path を直書きしないことで、将来 route を変えても追従しやすくします。
*/
import { memoPaths } from "../routes";

const commands = useMemoHistoryCommands();
const { keyword, searchType, sortOrder, selectedTags, displayedMemos, canReorder } =
  useMemoPageSetup();

/*
  追加:
  router インスタンスを取得します。
*/
const router = useRouter();

/*
  修正:
  もともとは commands.switchMemoScope(scope) で
  ストア状態だけを切り替えていましたが、
  それでは URL が変わらず、ページ遷移も起きません。

  この画面は route ベースで active / trash を出し分けているため、
  タブ切り替え時は router.push() で遷移させます。
*/
const handleScopeChange = (scope: MemoViewScope) => {
  void router.push(scope === "trash" ? memoPaths.trash : memoPaths.active);
};
</script>

<template>
  <section class="memo-app-page">
    <FeedbackBanner />
    <MemoComposerContainer />
    <MemoScopeTabs scope="active" :disabled="commands.isHistoryBusy.value" @scope-change="handleScopeChange" />
    <MemoToolbar :keyword="keyword" :searchType="searchType" :sortOrder="sortOrder" :selectedTags="selectedTags"
      @update:keyword="keyword = $event" @update:searchType="searchType = $event" @update:sortOrder="sortOrder = $event"
      @update:selectedTags="selectedTags = $event" />
    <MemoListContainer :items="displayedMemos" :canReorder="canReorder" />
  </section>
</template>