<script setup lang="ts">
withDefaults(
  defineProps<{
    imageUrl: string;
    brand?: string;
    vsLabel?: string;
    suffix?: string;
    tagline?: string;
    fill?: boolean;
  }>(),
  {
    brand: 'CLASH',
    vsLabel: 'VS',
    suffix: 'CAPITAL',
    tagline: '2-PLAYER TRADING SHOWDOWN',
    fill: false,
  },
);
</script>

<template>
  <header class="hero-banner" :class="{ 'hero-banner--fill': fill }">
    <img class="hero-banner__art" :src="imageUrl" alt="" aria-hidden="true" />
    <div class="hero-banner__glow-bull" aria-hidden="true"></div>
    <div class="hero-banner__glow-bear" aria-hidden="true"></div>
    <div class="hero-banner__scanline" aria-hidden="true"></div>
    <div class="hero-banner__shade" aria-hidden="true"></div>
    <div class="hero-banner__title">
      <p class="hero-banner__eyebrow">{{ tagline }}</p>
      <h1 class="hero-banner__brand">
        {{ brand }}
        <span class="hero-banner__brand-vs">{{ vsLabel }}</span>
        {{ suffix }}
      </h1>
    </div>
  </header>
</template>

<style scoped>
.hero-banner {
  position: relative;
  width: 100%;
  height: clamp(220px, 32vh, 320px);
  border-radius: 28px;
  overflow: hidden;
  isolation: isolate;
  background: var(--trade-start-stage-bg);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 40px 80px rgba(0, 0, 0, 0.45);
}

.hero-banner.hero-banner--fill {
  position: absolute;
  inset: 0;
  width: auto;
  height: auto;
  border-radius: inherit;
  box-shadow: none;
}

.hero-banner--fill .hero-banner__title {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.hero-banner__art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 35%;
  user-select: none;
  pointer-events: none;
  z-index: 0;
}

.hero-banner__glow-bull,
.hero-banner__glow-bear {
  position: absolute;
  inset: 0;
  pointer-events: none;
  mix-blend-mode: screen;
  z-index: 1;
}

.hero-banner__glow-bull {
  background: radial-gradient(circle at 18% 55%, rgba(80, 150, 255, 0.55), transparent 55%);
}

.hero-banner__glow-bear {
  background: radial-gradient(circle at 82% 55%, rgba(255, 80, 80, 0.55), transparent 55%);
}

.hero-banner__scanline {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.03) 0 1px,
    transparent 1px 3px
  );
  z-index: 2;
  opacity: 0.55;
}

.hero-banner__shade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse at center 30%, rgba(0, 0, 0, 0.2) 0%, transparent 55%),
    linear-gradient(
      180deg,
      rgba(3, 6, 10, 0.12) 0%,
      rgba(3, 6, 10, 0.05) 35%,
      rgba(3, 6, 10, 0.22) 65%,
      rgba(2, 4, 8, 0.5) 100%
    );
  z-index: 3;
}

.hero-banner__title {
  position: absolute;
  inset-inline: 0;
  inset-block-end: 10%;
  z-index: 4;
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 0 24px;
  text-align: center;
}

.hero-banner__eyebrow {
  margin: 0;
  font-size: clamp(0.68rem, 0.9vw, 0.82rem);
  font-weight: 700;
  letter-spacing: 0.36em;
  color: rgba(221, 232, 255, 0.85);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
}

.hero-banner__brand {
  margin: 0;
  font-family: Impact, 'Oswald', 'Arial Black', 'Yu Gothic', sans-serif;
  font-size: clamp(1.8rem, 4.5vw, 3.4rem);
  font-weight: 900;
  letter-spacing: 0.12em;
  line-height: 1;
  color: var(--text-main);
  text-shadow:
    0 4px 24px rgba(0, 0, 0, 0.75),
    0 0 32px rgba(80, 150, 255, 0.22);
}

.hero-banner__brand-vs {
  display: inline-block;
  margin: 0 0.2em;
  padding: 0 0.15em;
  background: linear-gradient(135deg, #5ba0ff 0%, #ff6060 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 12px rgba(255, 80, 80, 0.45));
}

@media (max-width: 1240px) {
  .hero-banner {
    border-radius: 24px;
    height: clamp(200px, 28vh, 260px);
  }

  .hero-banner.hero-banner--fill {
    height: auto;
    border-radius: inherit;
  }
}

@media (max-width: 980px) {
  .hero-banner {
    border-radius: 20px;
    height: clamp(180px, 26vh, 220px);
  }

  .hero-banner.hero-banner--fill {
    height: auto;
    border-radius: inherit;
  }

  .hero-banner__brand {
    font-size: clamp(1.5rem, 6vw, 2.2rem);
  }
}
</style>
