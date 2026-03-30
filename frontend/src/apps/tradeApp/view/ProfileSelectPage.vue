<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ProfileCard from './profile/ProfileCard.vue'
import ProfileCreateModal from './profile/ProfileCreateModal.vue'
import { useTradeProfileStore } from '../store/useTradeProfileStore'

const router = useRouter()
const profileStore = useTradeProfileStore()
const isCreateModalOpen = ref(false)

onMounted(() => {
  profileStore.seedIfEmpty()
})

const selectedProfileId = ref<string | null>(profileStore.activeProfileId ?? null)

const selectedProfile = computed(() => {
  return profileStore.sortedProfiles.find((profile) => profile.id === selectedProfileId.value) ?? null
})

function handleSelect(profileId: string): void {
  selectedProfileId.value = profileId
}

function handleCreate(payload: {
  name: string
  icon: Parameters<typeof profileStore.createProfile>[0]['icon']
  theme: Parameters<typeof profileStore.createProfile>[0]['theme']
  tagline: string
}): void {
  const created = profileStore.createProfile(payload)
  selectedProfileId.value = created.id
}

function handleStart(): void {
  if (!selectedProfile.value) {
    return
  }

  profileStore.selectProfile(selectedProfile.value.id)
  router.push({ name: 'menu-workspace-trade' })
}

function handleViewStats(): void {
  if (!selectedProfile.value) {
    return
  }

  router.push({
    name: 'menu-workspace-trade-profile-stats',
    params: { profileId: selectedProfile.value.id },
  })
}
</script>

<template>
  <main class="profile-select-page">
    <section class="profile-hero">
      <div>
        <p class="profile-hero__eyebrow">TRADE PROFILE</p>
        <h1>プレイヤープロフィール</h1>
        <p>
          成績を保存するキャラクターを選択します。まず器を選び、その後で相場の地獄に入る。
          順番としては珍しく正しいです。
        </p>
      </div>
      <button type="button" class="profile-hero__create" @click="isCreateModalOpen = true">
        + 新規作成
      </button>
    </section>

    <section class="profile-grid">
      <button class="profile-create-card" type="button" @click="isCreateModalOpen = true">
        <span>+</span>
        <strong>新規作成</strong>
        <small>新しいキャラクターを作る</small>
      </button>

      <ProfileCard
        v-for="profile in profileStore.sortedProfiles"
        :key="profile.id"
        :profile="profile"
        :selected="profile.id === selectedProfileId"
        @select="handleSelect"
      />
    </section>

    <section v-if="selectedProfile" class="profile-footer-panel">
      <div class="profile-footer-panel__summary">
        <strong>{{ selectedProfile.name }}</strong>
        <span>{{ selectedProfile.title }}</span>
        <p>{{ selectedProfile.tagline }}</p>
      </div>

      <div class="profile-footer-panel__actions">
        <button type="button" class="ghost" @click="handleViewStats">成績を見る</button>
        <button type="button" class="primary" @click="handleStart">このキャラで開始</button>
      </div>
    </section>

    <ProfileCreateModal v-model="isCreateModalOpen" @create="handleCreate" />
  </main>
</template>

<style scoped>
.profile-select-page {
  min-height: 100%;
  padding: 28px;
  background:
    radial-gradient(circle at top left, rgba(35, 80, 160, 0.24), transparent 28%),
    radial-gradient(circle at top right, rgba(165, 39, 39, 0.22), transparent 26%),
    linear-gradient(180deg, #090d16, #05070b);
  color: #f0f5ff;
}

.profile-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  background: rgba(10, 14, 23, 0.72);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(14px);
}

.profile-hero__eyebrow {
  margin: 0 0 8px;
  color: rgba(155, 186, 255, 0.84);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.profile-hero h1 {
  margin: 0 0 12px;
  font-size: clamp(1.7rem, 2.4vw, 2.5rem);
}

.profile-hero p {
  margin: 0;
  max-width: 720px;
  color: rgba(219, 228, 247, 0.8);
  line-height: 1.75;
}

.profile-hero__create,
.profile-footer-panel__actions button,
.profile-create-card {
  cursor: pointer;
}

.profile-hero__create,
.profile-footer-panel__actions .primary,
.profile-footer-panel__actions .ghost {
  padding: 12px 18px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.profile-hero__create,
.profile-footer-panel__actions .primary {
  background: linear-gradient(135deg, rgba(48, 122, 255, 0.96), rgba(19, 93, 200, 0.96));
  color: #fff;
}

.profile-footer-panel__actions .ghost {
  background: rgba(255, 255, 255, 0.05);
  color: #f0f5ff;
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.profile-create-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  min-height: 220px;
  border: 1px dashed rgba(120, 175, 255, 0.38);
  border-radius: 22px;
  background: rgba(30, 53, 100, 0.16);
  color: #eef4ff;
}

.profile-create-card span {
  font-size: 2rem;
  line-height: 1;
}

.profile-create-card strong {
  font-size: 1rem;
}

.profile-create-card small {
  color: rgba(214, 224, 246, 0.76);
}

.profile-footer-panel {
  position: sticky;
  bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 24px;
  padding: 18px 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  background: rgba(9, 12, 19, 0.86);
  box-shadow: 0 24px 54px rgba(0, 0, 0, 0.38);
  backdrop-filter: blur(16px);
}

.profile-footer-panel__summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-footer-panel__summary strong {
  font-size: 1rem;
}

.profile-footer-panel__summary span {
  color: rgba(217, 226, 248, 0.78);
  font-size: 0.76rem;
}

.profile-footer-panel__summary p {
  margin: 4px 0 0;
  color: rgba(217, 226, 248, 0.76);
  font-size: 0.82rem;
}

.profile-footer-panel__actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 1280px) {
  .profile-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .profile-select-page {
    padding: 18px;
  }

  .profile-hero,
  .profile-footer-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .profile-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
