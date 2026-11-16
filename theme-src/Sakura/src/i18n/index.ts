import { useCallback, useSyncExternalStore } from 'react'
import { settings } from '@/lib/settings'
import { storage } from '@/lib/storage'
import zhTW from './zh-TW'
import zhCN from './zh-CN'
import enUS from './en-US'

export type MessageKey = keyof typeof zhCN
export type Messages = Record<MessageKey, string>

const dicts: Record<string, Messages> = { 'zh-TW': zhTW, 'zh-CN': zhCN, 'en-US': enUS }

export const languages = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'en-US', label: 'English' },
] as const

const KEY = 'xb_language'
const listeners = new Set<() => void>()

function detect(): string {
  const nav = navigator.language || ''
  if (/^zh-(TW|HK|MO|Hant)/i.test(nav)) return 'zh-TW'
  if (/^zh/i.test(nav)) return 'zh-CN'
  if (/^en/i.test(nav)) return 'en-US'
  return ''
}

export function getLanguage(): string {
  const lang = storage.get(KEY) || settings.default_language || detect()
  return dicts[lang] ? lang : 'zh-CN'
}

export function setLanguage(code: string) {
  storage.set(KEY, code)
  document.documentElement.lang = code
  listeners.forEach((l) => l())
}

export function translate(key: MessageKey, vars?: Record<string, string | number>): string {
  let text = dicts[getLanguage()][key] ?? zhCN[key] ?? key
  if (vars) Object.entries(vars).forEach(([k, v]) => (text = text.replaceAll(`{${k}}`, String(v))))
  return text
}

export function useLanguage() {
  return useSyncExternalStore((l) => {
    listeners.add(l)
    return () => listeners.delete(l)
  }, getLanguage)
}

export function useT() {
  const lang = useLanguage()
  // 語言切換時回傳新的函式引用，讓依賴 t 的 memo 失效
  return useCallback((key: MessageKey, vars?: Record<string, string | number>) => translate(key, vars), [lang])
}
