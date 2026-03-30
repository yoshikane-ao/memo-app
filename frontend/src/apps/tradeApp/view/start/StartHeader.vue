<template>
  <header class="start-header">
    <div class="headline">
      <p class="eyebrow">TURN-BASED STOCK BATTLE</p>
      <h1>トレーディングバトル</h1>
      <p class="subtitle">開始条件を一画面で設定し、そのまま対戦へ進みます。</p>
    </div>

    <div class="header-notes">
      <span class="note-pill blue">純資産 = 初期現金</span>
      <span class="note-pill red">市場CPUは別枠</span>
    </div>
  </header>
</template>

<style scoped>
.start-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(7, 14, 28, 0.92), rgba(7, 13, 24, 0.88)),
    linear-gradient(90deg, rgba(92, 133, 255, 0.08), transparent 48%, rgba(255, 98, 118, 0.08));
  backdrop-filter: blur(14px);
  box-sizing: border-box;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
}

.headline {
  min-width: 0;
}

.eyebrow {
  margin: 0 0 1px;
  font-size: 9px;
  letter-spacing: 0.18em;
  color: #8fb2ff;
}

h1 {
  margin: 0;
  font-size: 22px;
  line-height: 1;
  letter-spacing: 0.03em;
  text-shadow: 0 0 18px rgba(96, 137, 255, 0.18);
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
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 11px;
  white-space: nowrap;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
}

.note-pill.blue {
  background: linear-gradient(180deg, rgba(25, 47, 88, 0.84), rgba(11, 20, 39, 0.94));
  color: #dce9ff;
  border-color: rgba(108, 154, 255, 0.22);
}

.note-pill.red {
  background: linear-gradient(180deg, rgba(82, 22, 36, 0.8), rgba(35, 11, 19, 0.94));
  color: #ffe0e4;
  border-color: rgba(255, 115, 137, 0.2);
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
