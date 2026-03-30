import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type TradeProfileId = string

export type TradeProfileTheme = 'blue' | 'red' | 'gold' | 'violet'

export type TradeProfileStyle =
  | 'buy-aggressive'
  | 'short-pressure'
  | 'balanced'
  | 'defensive'
  | 'comeback'

export type TradeProfileIcon =
  | 'bull'
  | 'bear'
  | 'wolf'
  | 'eagle'
  | 'lightning'
  | 'crown'
  | 'flame'
  | 'shield'

export type TradeProfileStats = {
  totalBattles: number
  wins: number
  losses: number
  winRate: number
  totalEarnedAmount: number
  currentAssets: number
  maxTotalAssets: number
  averageFinalAssets: number
  maxWinStreak: number
  currentWinStreak: number
  buyCount: number
  sellCount: number
  shortSellCount: number
  companyActionCount: number
  waitCount: number
  style: TradeProfileStyle
}

export type TradeProfile = {
  id: TradeProfileId
  name: string
  icon: TradeProfileIcon
  theme: TradeProfileTheme
  tagline: string
  title: string
  createdAt: string
  updatedAt: string
  stats: TradeProfileStats
}

export type CreateTradeProfileInput = {
  name: string
  icon: TradeProfileIcon
  theme: TradeProfileTheme
  tagline: string
}

export type RecordBattleInput = {
  profileId: TradeProfileId
  didWin: boolean
  finalAssets: number
  startAssets?: number
  earnedAmount?: number
  buyCount?: number
  sellCount?: number
  shortSellCount?: number
  companyActionCount?: number
  waitCount?: number
}

const STORAGE_KEY = 'trade-app-profiles-v2'
const ACTIVE_STORAGE_KEY = 'trade-app-active-profile-v2'

const defaultStats = (): TradeProfileStats => ({
  totalBattles: 0,
  wins: 0,
  losses: 0,
  winRate: 0,
  totalEarnedAmount: 0,
  currentAssets: 0,
  maxTotalAssets: 0,
  averageFinalAssets: 0,
  maxWinStreak: 0,
  currentWinStreak: 0,
  buyCount: 0,
  sellCount: 0,
  shortSellCount: 0,
  companyActionCount: 0,
  waitCount: 0,
  style: 'balanced',
})

const iconLabels: Record<TradeProfileIcon, string> = {
  bull: '牛',
  bear: '熊',
  wolf: '狼',
  eagle: '鷲',
  lightning: '稲妻',
  crown: '王冠',
  flame: '炎',
  shield: '盾',
}

const titleByStyle: Record<TradeProfileStyle, string> = {
  'buy-aggressive': '強気の買い手',
  'short-pressure': '空売りの圧力者',
  balanced: '均衡の読み手',
  defensive: '慎重な防衛者',
  comeback: '逆転の投機家',
}

function safeNowIso(): string {
  return new Date().toISOString()
}

function generateId(): TradeProfileId {
  const randomPart = Math.random().toString(36).slice(2, 10)
  return `tp_${Date.now()}_${randomPart}`
}

function calculateWinRate(wins: number, totalBattles: number): number {
  if (totalBattles <= 0) {
    return 0
  }
  return Math.round((wins / totalBattles) * 100)
}

function normalizeStats(stats: Partial<TradeProfileStats> | undefined): TradeProfileStats {
  const merged = {
    ...defaultStats(),
    ...stats,
  }

  if (typeof merged.currentAssets !== 'number') {
    merged.currentAssets = typeof merged.totalEarnedAmount === 'number' ? merged.totalEarnedAmount : 0
  }

  return merged
}

function detectStyle(stats: TradeProfileStats): TradeProfileStyle {
  const {
    buyCount,
    sellCount,
    shortSellCount,
    companyActionCount,
    waitCount,
    wins,
    losses,
  } = stats

  const totalActions = buyCount + sellCount + shortSellCount + companyActionCount + waitCount
  const totalBattles = wins + losses

  if (shortSellCount > buyCount && shortSellCount >= Math.max(sellCount, companyActionCount)) {
    return 'short-pressure'
  }

  if (waitCount > 0 && totalActions > 0 && waitCount / totalActions >= 0.34) {
    return 'defensive'
  }

  if (buyCount > 0 && totalActions > 0 && buyCount / totalActions >= 0.36) {
    return 'buy-aggressive'
  }

  if (totalBattles >= 6 && wins > losses && stats.currentWinStreak >= 2) {
    return 'comeback'
  }

  return 'balanced'
}

function buildProfile(input: CreateTradeProfileInput): TradeProfile {
  const createdAt = safeNowIso()
  return {
    id: generateId(),
    name: input.name.trim(),
    icon: input.icon,
    theme: input.theme,
    tagline: input.tagline.trim(),
    title: '新人投機家',
    createdAt,
    updatedAt: createdAt,
    stats: defaultStats(),
  }
}

function parseProfiles(raw: string | null): TradeProfile[] {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as TradeProfile[]
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.map((profile) => ({
      ...profile,
      stats: normalizeStats(profile.stats),
    }))
  } catch {
    return []
  }
}

export const useTradeProfileStore = defineStore('tradeProfile', () => {
  const profiles = ref<TradeProfile[]>(parseProfiles(typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null))
  const activeProfileId = ref<TradeProfileId | null>(typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_STORAGE_KEY) : null)

  const activeProfile = computed(() => {
    return profiles.value.find((profile) => profile.id === activeProfileId.value) ?? null
  })

  const sortedProfiles = computed(() => {
    return [...profiles.value].sort((left, right) => {
      if (right.stats.totalBattles !== left.stats.totalBattles) {
        return right.stats.totalBattles - left.stats.totalBattles
      }
      return right.updatedAt.localeCompare(left.updatedAt)
    })
  })

  function persist(): void {
    if (typeof window === 'undefined') {
      return
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles.value))

    if (activeProfileId.value) {
      localStorage.setItem(ACTIVE_STORAGE_KEY, activeProfileId.value)
    } else {
      localStorage.removeItem(ACTIVE_STORAGE_KEY)
    }
  }

  function createProfile(input: CreateTradeProfileInput): TradeProfile {
    const created = buildProfile(input)
    profiles.value.unshift(created)
    activeProfileId.value = created.id
    persist()
    return created
  }

  function selectProfile(profileId: TradeProfileId): void {
    const exists = profiles.value.some((profile) => profile.id === profileId)
    if (!exists) {
      return
    }
    activeProfileId.value = profileId
    persist()
  }

  function updateProfile(profileId: TradeProfileId, patch: Partial<CreateTradeProfileInput>): void {
    const target = profiles.value.find((profile) => profile.id === profileId)
    if (!target) {
      return
    }

    if (typeof patch.name === 'string') {
      target.name = patch.name.trim()
    }
    if (typeof patch.icon === 'string') {
      target.icon = patch.icon
    }
    if (typeof patch.theme === 'string') {
      target.theme = patch.theme
    }
    if (typeof patch.tagline === 'string') {
      target.tagline = patch.tagline.trim()
    }

    target.updatedAt = safeNowIso()
    persist()
  }

  function recordBattleResult(input: RecordBattleInput): void {
    const target = profiles.value.find((profile) => profile.id === input.profileId)
    if (!target) {
      return
    }

    const nextStats = { ...normalizeStats(target.stats) }
    nextStats.totalBattles += 1

    if (input.didWin) {
      nextStats.wins += 1
      nextStats.currentWinStreak += 1
      nextStats.maxWinStreak = Math.max(nextStats.maxWinStreak, nextStats.currentWinStreak)
    } else {
      nextStats.losses += 1
      nextStats.currentWinStreak = 0
    }

    nextStats.buyCount += input.buyCount ?? 0
    nextStats.sellCount += input.sellCount ?? 0
    nextStats.shortSellCount += input.shortSellCount ?? 0
    nextStats.companyActionCount += input.companyActionCount ?? 0
    nextStats.waitCount += input.waitCount ?? 0

    const delta = typeof input.earnedAmount === 'number'
      ? input.earnedAmount
      : typeof input.startAssets === 'number'
        ? input.finalAssets - input.startAssets
        : 0

    if (delta > 0) {
      nextStats.totalEarnedAmount += delta
    }

    nextStats.currentAssets += delta
    nextStats.maxTotalAssets = Math.max(nextStats.maxTotalAssets, input.finalAssets)
    nextStats.averageFinalAssets = Math.round(
      ((target.stats.averageFinalAssets * target.stats.totalBattles) + input.finalAssets) / nextStats.totalBattles,
    )
    nextStats.winRate = calculateWinRate(nextStats.wins, nextStats.totalBattles)
    nextStats.style = detectStyle(nextStats)

    target.stats = nextStats
    target.title = titleByStyle[nextStats.style]
    target.updatedAt = safeNowIso()
    persist()
  }

  function removeProfile(profileId: TradeProfileId): void {
    const nextProfiles = profiles.value.filter((profile) => profile.id !== profileId)
    profiles.value = nextProfiles
    if (activeProfileId.value === profileId) {
      activeProfileId.value = nextProfiles[0]?.id ?? null
    }
    persist()
  }

  function seedIfEmpty(): void {
    if (profiles.value.length > 0) {
      return
    }

    const seededProfiles: TradeProfile[] = [
      {
        id: generateId(),
        name: 'レオ',
        icon: 'bull',
        theme: 'blue',
        tagline: '買いで押し切る',
        title: '強気の買い手',
        createdAt: safeNowIso(),
        updatedAt: safeNowIso(),
        stats: normalizeStats({
          totalBattles: 18,
          wins: 11,
          losses: 7,
          winRate: 61,
          totalEarnedAmount: 124500,
          currentAssets: 84500,
          maxTotalAssets: 38400,
          averageFinalAssets: 24100,
          maxWinStreak: 4,
          currentWinStreak: 2,
          buyCount: 36,
          sellCount: 11,
          shortSellCount: 4,
          companyActionCount: 7,
          waitCount: 8,
          style: 'buy-aggressive',
        }),
      },
      {
        id: generateId(),
        name: 'ノヴァ',
        icon: 'bear',
        theme: 'red',
        tagline: '相手を崩して勝つ',
        title: '空売りの圧力者',
        createdAt: safeNowIso(),
        updatedAt: safeNowIso(),
        stats: normalizeStats({
          totalBattles: 12,
          wins: 7,
          losses: 5,
          winRate: 58,
          totalEarnedAmount: 68300,
          currentAssets: 41300,
          maxTotalAssets: 30100,
          averageFinalAssets: 21600,
          maxWinStreak: 3,
          currentWinStreak: 1,
          buyCount: 10,
          sellCount: 19,
          shortSellCount: 24,
          companyActionCount: 5,
          waitCount: 4,
          style: 'short-pressure',
        }),
      },
      {
        id: generateId(),
        name: 'カイ',
        icon: 'shield',
        theme: 'gold',
        tagline: '危険な相場は見送る',
        title: '慎重な防衛者',
        createdAt: safeNowIso(),
        updatedAt: safeNowIso(),
        stats: normalizeStats({
          totalBattles: 9,
          wins: 4,
          losses: 5,
          winRate: 44,
          totalEarnedAmount: 19400,
          currentAssets: -3800,
          maxTotalAssets: 22800,
          averageFinalAssets: 19800,
          maxWinStreak: 2,
          currentWinStreak: 0,
          buyCount: 8,
          sellCount: 7,
          shortSellCount: 6,
          companyActionCount: 5,
          waitCount: 14,
          style: 'defensive',
        }),
      },
    ]

    profiles.value = seededProfiles
    activeProfileId.value = seededProfiles[0]?.id ?? null
    persist()
  }

  return {
    activeProfileId,
    activeProfile,
    profiles,
    sortedProfiles,
    iconLabels,
    createProfile,
    selectProfile,
    updateProfile,
    recordBattleResult,
    removeProfile,
    seedIfEmpty,
  }
})
