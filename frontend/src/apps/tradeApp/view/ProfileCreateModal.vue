<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import profileCreateBackgroundUrl from '../assets/profile-create-background.png'
import type {
  CreateTradeProfileInput,
  TradeProfileIcon,
  TradeProfileTheme,
} from '../store/useTradeProfileStore'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'create', payload: CreateTradeProfileInput): void
}>()

const form = reactive<CreateTradeProfileInput>({
  name: '',
  icon: 'bull',
  theme: 'blue',
  tagline: '',
})

const iconOptions: Array<{ value: TradeProfileIcon; label: string; glyph: string }> = [
  { value: 'bull', label: '牛', glyph: '🐂' },
  { value: 'bear', label: '熊', glyph: '🐻' },
  { value: 'wolf', label: '狼', glyph: '🐺' },
  { value: 'eagle', label: '鷲', glyph: '🦅' },
  { value: 'lightning', label: '稲妻', glyph: '⚡' },
  { value: 'crown', label: '王冠', glyph: '👑' },
  { value: 'flame', label: '炎', glyph: '🔥' },
  { value: 'shield', label: '盾', glyph: '🛡️' },
]

const themeOptions: Array<{ value: TradeProfileTheme; label: string }> = [
  { value: 'blue', label: '青' },
  { value: 'red', label: '赤' },
  { value: 'gold', label: '金' },
  { value: 'violet', label: '紫' },
]

const canSave = computed(() => form.name.trim().length >= 1)

watch(
  () => props.modelValue,
  (opened) => {
    if (!opened) {
      return
    }
    form.name = ''
    form.icon = 'bull'
    form.theme = 'blue'
    form.tagline = ''
  },
)

function close(): void {
  emit('update:modelValue', false)
}

function handleSubmit(): void {
  if (!canSave.value) {
    return
  }

  emit('create', {
    name: form.name,
    icon: form.icon,
    theme: form.theme,
    tagline: form.tagline,
  })
  close()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="profile-modal">
      <div class="profile-modal__backdrop" @click="close" />
      <section class="profile-modal__dialog" :style="{ '--profile-create-bg': `url(${profileCreateBackgroundUrl})` }" role="dialog" aria-modal="true" aria-label="キャラクター作成">
        <header class="profile-modal__header">
          <div>
            <h2>キャラクター作成</h2>
            <p>戦績を保存するプレイヤーを作成します。</p>
          </div>
          <button class="profile-modal__close" type="button" @click="close">×</button>
        </header>

        <div class="profile-modal__content">
          <aside class="profile-modal__preview" :class="`theme-${form.theme}`">
            <div class="profile-modal__preview-icon">
              {{ iconOptions.find((option) => option.value === form.icon)?.glyph }}
            </div>
            <strong>{{ form.name || 'プレイヤー名' }}</strong>
            <span>{{ form.tagline || '一言コメント' }}</span>
          </aside>

          <div class="profile-modal__fields">
            <label>
              <span>キャラクター名</span>
              <input v-model="form.name" type="text" maxlength="20" placeholder="例: レオ" />
            </label>

            <label>
              <span>一言コメント</span>
              <input v-model="form.tagline" type="text" maxlength="40" placeholder="例: 買いで押し切る" />
            </label>

            <div>
              <span class="profile-modal__label">アイコン</span>
              <div class="profile-modal__icon-grid">
                <button
                  v-for="option in iconOptions"
                  :key="option.value"
                  type="button"
                  class="profile-modal__icon-button"
                  :class="{ 'is-active': form.icon === option.value }"
                  @click="form.icon = option.value"
                >
                  <span>{{ option.glyph }}</span>
                  <small>{{ option.label }}</small>
                </button>
              </div>
            </div>

            <div>
              <span class="profile-modal__label">テーマカラー</span>
              <div class="profile-modal__theme-grid">
                <button
                  v-for="option in themeOptions"
                  :key="option.value"
                  type="button"
                  class="profile-modal__theme-button"
                  :class="[option.value, { 'is-active': form.theme === option.value }]"
                  @click="form.theme = option.value"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer class="profile-modal__footer">
          <button type="button" class="ghost" @click="close">キャンセル</button>
          <button type="button" class="primary" :disabled="!canSave" @click="handleSubmit">保存して開始</button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.profile-modal {
  position: fixed;
  inset: 0;
  z-index: 3000;
}

.profile-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(2, 5, 10, 0.76);
  backdrop-filter: blur(10px);
}

.profile-modal__dialog {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: min(980px, calc(100vw - 28px));
  max-height: calc(100vh - 28px);
  margin: 14px auto;
  padding: 24px;
  overflow: auto;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(5, 8, 15, 0.84), rgba(5, 8, 15, 0.94)),
    var(--profile-create-bg) center/cover no-repeat;
  color: #eef4ff;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
}

.profile-modal__dialog::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(41, 117, 255, 0.14), rgba(255, 77, 77, 0.14));
  pointer-events: none;
}

.profile-modal__header,
.profile-modal__content,
.profile-modal__footer {
  position: relative;
  z-index: 1;
}

.profile-modal__header,
.profile-modal__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.profile-modal__header h2 {
  margin: 0 0 6px;
  font-size: 1.3rem;
}

.profile-modal__header p {
  margin: 0;
  color: rgba(221, 229, 248, 0.72);
  font-size: 0.85rem;
}

.profile-modal__close,
.profile-modal__footer button,
.profile-modal__icon-button,
.profile-modal__theme-button {
  cursor: pointer;
}

.profile-modal__close {
  width: 42px;
  height: 42px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  background: rgba(4, 8, 18, 0.58);
  backdrop-filter: blur(8px);
  color: #fff;
  font-size: 1.2rem;
}

.profile-modal__content {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 20px;
}

.profile-modal__preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 280px;
  padding: 24px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(4, 8, 18, 0.58);
  backdrop-filter: blur(8px);
  text-align: center;
}

.profile-modal__preview.theme-blue { box-shadow: inset 0 0 0 1px rgba(101, 180, 255, 0.16); }
.profile-modal__preview.theme-red { box-shadow: inset 0 0 0 1px rgba(255, 116, 116, 0.16); }
.profile-modal__preview.theme-gold { box-shadow: inset 0 0 0 1px rgba(255, 208, 122, 0.16); }
.profile-modal__preview.theme-violet { box-shadow: inset 0 0 0 1px rgba(198, 144, 255, 0.16); }

.profile-modal__preview-icon {
  display: grid;
  place-items: center;
  width: 92px;
  height: 92px;
  border-radius: 26px;
  background: rgba(5, 12, 24, 0.62);
  font-size: 2.4rem;
}

.profile-modal__fields {
  display: grid;
  gap: 16px;
  padding: 18px;
  border-radius: 24px;
  background: rgba(4, 8, 18, 0.56);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.profile-modal__fields label {
  display: grid;
  gap: 8px;
}

.profile-modal__fields span,
.profile-modal__label {
  color: rgba(216, 226, 246, 0.88);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.profile-modal__fields input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.profile-modal__icon-grid,
.profile-modal__theme-grid {
  display: grid;
  gap: 10px;
}

.profile-modal__icon-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.profile-modal__theme-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.profile-modal__icon-button,
.profile-modal__theme-button {
  padding: 12px 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  background: rgba(4, 8, 18, 0.58);
  backdrop-filter: blur(8px);
  color: #f3f6ff;
}

.profile-modal__icon-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.profile-modal__icon-button span {
  font-size: 1.4rem;
}

.profile-modal__icon-button small {
  color: rgba(215, 224, 244, 0.8);
}

.profile-modal__icon-button.is-active,
.profile-modal__theme-button.is-active {
  border-color: rgba(117, 184, 255, 0.6);
  box-shadow: 0 0 0 1px rgba(117, 184, 255, 0.16);
}

.profile-modal__theme-button.blue.is-active { background: rgba(63, 126, 234, 0.25); }
.profile-modal__theme-button.red.is-active { background: rgba(225, 70, 70, 0.25); }
.profile-modal__theme-button.gold.is-active { background: rgba(226, 161, 54, 0.24); }
.profile-modal__theme-button.violet.is-active { background: rgba(152, 84, 227, 0.24); }

.profile-modal__footer {
  justify-content: flex-end;
}

.profile-modal__footer button {
  padding: 12px 18px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.profile-modal__footer .ghost {
  background: rgba(4, 8, 18, 0.58);
  backdrop-filter: blur(8px);
  color: #eef4ff;
}

.profile-modal__footer .primary {
  background: linear-gradient(135deg, rgba(61, 133, 255, 0.95), rgba(25, 101, 214, 0.95));
  color: #fff;
}

.profile-modal__footer .primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 820px) {
  .profile-modal__content {
    grid-template-columns: 1fr;
  }

  .profile-modal__icon-grid,
  .profile-modal__theme-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
