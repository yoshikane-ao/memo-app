import type { RouteRecordRaw } from "vue-router";
import type { MenuAppDefinition } from "../../app/router/menuApp.types";
import { workspaceSection } from "../../app/router/menuSections";

const quizEntry = {
  id: "quiz",
  slug: "quiz",
  name: "クイズ",
  summary: "クイズを作成して、保存した単語を復習できます。",
  ctaLabel: "ひらく",
  section: workspaceSection,
  keywords: ["クイズ", "単語", "意味", "タグ"],
};

const loadQuizAppShell: NonNullable<RouteRecordRaw["component"]> = () =>
  import("./pages/QuizAppShell.vue");
const loadQuizStartPage: NonNullable<RouteRecordRaw["component"]> = () =>
  import("./pages/QuizStartPage.vue");
const loadQuizCreatePage: NonNullable<RouteRecordRaw["component"]> = () =>
  import("./pages/QuizCreatePage.vue");
const loadQuizAnswerPage: NonNullable<RouteRecordRaw["component"]> = () =>
  import("./pages/QuizAnswerPage.vue");

const quizBasePath = `${quizEntry.section.slug}/${quizEntry.slug}`;
const quizMeta = {
  menuAppId: quizEntry.id,
  menuSectionSlug: quizEntry.section.slug,
};

export const quizAppDefinition: MenuAppDefinition = {
  entry: quizEntry,
  createRoutes: () => [
    {
      path: quizBasePath,
      component: loadQuizAppShell,
      children: [
        {
          path: "",
          name: `menu-${quizEntry.section.slug}-${quizEntry.slug}`,
          redirect: { name: "quiz-start" },
          meta: {
            pageTitle: `${quizEntry.name} | アプリ一覧`,
            ...quizMeta,
          },
        },
        {
          path: "start",
          name: "quiz-start",
          component: loadQuizStartPage,
          meta: {
            pageTitle: `スタート | ${quizEntry.name}`,
            ...quizMeta,
          },
        },
        {
          path: "create",
          name: "quiz-create",
          component: loadQuizCreatePage,
          meta: {
            pageTitle: `作成 | ${quizEntry.name}`,
            ...quizMeta,
          },
        },
        {
          path: "answer",
          name: "quiz-answer",
          component: loadQuizAnswerPage,
          meta: {
            pageTitle: `回答 | ${quizEntry.name}`,
            ...quizMeta,
          },
        },
      ],
    },
  ],
};
