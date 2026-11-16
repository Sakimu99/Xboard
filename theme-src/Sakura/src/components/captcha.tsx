import { useCallback, useEffect, useRef, useState } from 'react'
import type { GuestConfig } from '@/api/types'

// 支援後台三種人機驗證：reCAPTCHA v2 / v3、Cloudflare Turnstile
type Widget = { render: (el: HTMLElement, opts: object) => string | number; reset: (id?: string | number) => void }
declare global {
  interface Window {
    grecaptcha?: Widget & { ready: (cb: () => void) => void; execute: (key: string, opts: object) => Promise<string> }
    turnstile?: Widget
  }
}

const loaded = new Map<string, Promise<void>>()
function loadScript(src: string) {
  if (!loaded.has(src)) {
    loaded.set(
      src,
      new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = src
        s.async = true
        s.onload = () => resolve()
        s.onerror = () => {
          loaded.delete(src)
          reject(new Error('captcha script failed'))
        }
        document.head.appendChild(s)
      }),
    )
  }
  return loaded.get(src)!
}

const waitFor = <T,>(get: () => T | undefined) =>
  new Promise<T>((resolve) => {
    const tick = () => {
      const v = get()
      if (v) resolve(v)
      else setTimeout(tick, 50)
    }
    tick()
  })

export function useCaptcha(config?: GuestConfig) {
  const enabled = !!config?.is_captcha
  const type = config?.captcha_type
  const ref = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | number | undefined>(undefined)
  const [token, setToken] = useState('')

  useEffect(() => {
    if (!enabled || !ref.current || type === 'recaptcha-v3') return
    const el = ref.current
    let cancelled = false
    const opts = { callback: setToken, 'expired-callback': () => setToken('') }
    if (type === 'turnstile' && config?.turnstile_site_key) {
      loadScript('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit')
        .then(() => waitFor(() => window.turnstile))
        .then((ts) => {
          if (!cancelled) widgetId.current = ts.render(el, { sitekey: config.turnstile_site_key, ...opts })
        })
    } else if (type === 'recaptcha' && config?.recaptcha_site_key) {
      loadScript('https://www.recaptcha.net/recaptcha/api.js?render=explicit')
        .then(() => waitFor(() => (window.grecaptcha?.render ? window.grecaptcha : undefined)))
        .then((g) => g.ready(() => {
          if (!cancelled) widgetId.current = g.render(el, { sitekey: config.recaptcha_site_key, ...opts })
        }))
    }
    return () => {
      cancelled = true
      el.innerHTML = ''
    }
  }, [enabled, type, config?.turnstile_site_key, config?.recaptcha_site_key])

  useEffect(() => {
    if (enabled && type === 'recaptcha-v3' && config?.recaptcha_v3_site_key) {
      loadScript(`https://www.recaptcha.net/recaptcha/api.js?render=${config.recaptcha_v3_site_key}`)
    }
  }, [enabled, type, config?.recaptcha_v3_site_key])

  /** 送出前取得驗證參數；v2/Turnstile 未完成時回傳 null */
  const getParams = useCallback(async (): Promise<Record<string, string> | null> => {
    if (!enabled) return {}
    if (type === 'recaptcha-v3') {
      const key = config!.recaptcha_v3_site_key!
      const g = await waitFor(() => (window.grecaptcha?.execute ? window.grecaptcha : undefined))
      const v3 = await new Promise<string>((resolve) => g.ready(() => g.execute(key, { action: 'submit' }).then(resolve)))
      return { recaptcha_v3_token: v3 }
    }
    if (!token) return null
    return type === 'turnstile' ? { turnstile_token: token } : { recaptcha_data: token }
  }, [enabled, type, token, config])

  const reset = useCallback(() => {
    setToken('')
    if (type === 'turnstile') window.turnstile?.reset(widgetId.current)
    else if (type === 'recaptcha') window.grecaptcha?.reset(widgetId.current)
  }, [type])

  const element = enabled && type !== 'recaptcha-v3' ? <div ref={ref} className="min-h-[65px]" /> : null
  return { element, getParams, reset }
}
