<template>
  <header class="start-header">
    <div class="headline">
      <p class="eyebrow">TURN-BASED STOCK BATTLE</p>
      <h1>トレーディングバトル</h1>
      <p class="subtitle">開始条件を一画面で設定し、そのまま対戦へ進みます。</p>
    </div>

    <div class="header-notes">
      <span class="note-pill">純資産 = 初期現金</span>
      <span class="note-pill">市場CPUは別枠</span>
    </div>
  </header>
</template>

<style scoped>
.start-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(8, 15, 29, 0.88);
  backdrop-filter: blur(14px);
  box-sizing: border-box;
}

.headline {
  min-width: 0;
}

.eyebrow {
  margin: 0 0 1px;
  font-size: 9px;
  letter-spacing: 0.16em;
  color: #9fb5ff;
}

h1 {
  margin: 0;
  font-size: 22px;
  line-height: 1;
}

.subtitle {
  margin: 2px 0 0;
  color: #b5c2df;
  font-size: 11px;
  line-height: 1.35;
}

.header-notes {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.note-pill {
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #dce6ff;
  font-size: 11px;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .start-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
  }

  .header-notes {
    justify-content: flex-start;
  }
}
</style>
