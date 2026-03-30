export type GuestLabel = 'プレイヤー1' | 'プレイヤー2'
export type PlayerSlot = 'p1' | 'p2'

export type PlayerIdentity =
  | { kind: 'guest'; label: GuestLabel }
  | { kind: 'profile'; profileId: string }
  | { kind: 'cpu'; label: 'CPU' }

export function createGuestIdentity(slot: PlayerSlot): PlayerIdentity {
  return {
    kind: 'guest',
    label: slot === 'p1' ? 'プレイヤー1' : 'プレイヤー2',
  }
}

export function createCpuIdentity(): PlayerIdentity {
  return {
    kind: 'cpu',
    label: 'CPU',
  }
}
