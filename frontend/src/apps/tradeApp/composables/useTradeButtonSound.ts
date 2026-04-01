import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import buttonClickSe from '../assets/trade-button-click.mp3'

export function useTradeButtonSound(rootRef: Ref<HTMLElement | null>): void {
  let audio: HTMLAudioElement | null = null

  const ensureAudio = (): HTMLAudioElement | null => {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') {
      return null
    }

    if (audio) {
      return audio
    }

    audio = new Audio(buttonClickSe)
    audio.preload = 'auto'
    return audio
  }

  const handleClick = (event: Event): void => {
    const root = rootRef.value
    if (!root) {
      return
    }

    const target = event.target
    if (!(target instanceof Element)) {
      return
    }

    const button = target.closest('button')
    if (!(button instanceof HTMLButtonElement) || !root.contains(button) || button.disabled) {
      return
    }

    const sound = ensureAudio()
    if (!sound) {
      return
    }

    try {
      sound.pause()
      sound.currentTime = 0
      const playback = sound.play()
      if (playback && typeof playback.catch === 'function') {
        playback.catch(() => undefined)
      }
    } catch {
      // Browser autoplay policy can block the sound. The UI should still respond normally.
    }
  }

  onMounted(() => {
    const root = rootRef.value
    if (!root) {
      return
    }

    ensureAudio()
    root.addEventListener('click', handleClick, true)
  })

  onBeforeUnmount(() => {
    const root = rootRef.value
    if (root) {
      root.removeEventListener('click', handleClick, true)
    }

    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  })
}
