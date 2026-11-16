import { settings } from './settings'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
export const effectsOn = () => settings.effects !== 'off' && !reducedMotion()
export const petalsOn = () => settings.effects === 'full' && !reducedMotion()

const SPARKS = ['✦', '✧', '♡', '★', '✿']

/** 全域互動特效：卡片光斑跟隨滑鼠、點擊迸出星星 */
export function installEffects() {
  if (!effectsOn()) return

  document.addEventListener(
    'pointermove',
    (e) => {
      const el = (e.target as Element | null)?.closest?.<HTMLElement>('.spotlight')
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    },
    { passive: true },
  )

  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch' && e.isPrimary === false) return
    for (let i = 0; i < 6; i++) {
      const s = document.createElement('span')
      s.className = 'click-spark'
      s.textContent = SPARKS[Math.floor(Math.random() * SPARKS.length)]
      const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.6
      const dist = 26 + Math.random() * 22
      s.style.left = `${e.clientX}px`
      s.style.top = `${e.clientY}px`
      s.style.setProperty('--dx', `${Math.cos(angle) * dist}px`)
      s.style.setProperty('--dy', `${Math.sin(angle) * dist}px`)
      s.style.setProperty('--rot', `${Math.random() * 180 - 90}deg`)
      s.style.fontSize = `${10 + Math.random() * 8}px`
      document.body.appendChild(s)
      s.addEventListener('animationend', () => s.remove())
    }
  })
}
