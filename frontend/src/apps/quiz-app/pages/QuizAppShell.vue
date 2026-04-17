<template>
  <div class="quiz-app">
    <nav class="quiz-nav">
      <RouterLink class="quiz-nav__link" :to="{ name: 'quiz-start' }">トップ</RouterLink>
      <RouterLink class="quiz-nav__link" :to="{ name: 'quiz-create' }">問題作成</RouterLink>
      <RouterLink class="quiz-nav__link" :to="{ name: 'quiz-answer' }">解答</RouterLink>
    </nav>
    <main class="quiz-main">
      <RouterView />
    </main>
  </div>
</template>

<style>
@import "../styles/quiz-theme.css";
</style>

<style scoped>
.quiz-nav {
  display: flex;
  gap: 8px;
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--quiz-border);
  animation: quiz-fade-up 0.4s ease both;
}

.quiz-nav__link {
  display: inline-flex;
  align-items: center;
  padding: 7px 14px;
  border-radius: var(--quiz-radius-pill);
  border: 1px solid var(--quiz-border);
  background: rgba(255, 255, 255, 0.03);
  color: var(--quiz-text-soft);
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 600;
  transition:
    background var(--quiz-transition),
    border-color var(--quiz-transition),
    color var(--quiz-transition),
    transform var(--quiz-transition);
}

.quiz-nav__link:hover {
  color: var(--quiz-accent-strong);
  border-color: rgba(200, 106, 56, 0.24);
  background: rgba(200, 106, 56, 0.08);
  transform: translateY(-1px);
}

.quiz-nav__link.router-link-active {
  border-color: var(--quiz-border-focus);
  background: var(--quiz-accent-soft);
  color: var(--quiz-accent-strong);
}

.quiz-main {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  min-height: 0;
}
</style>
