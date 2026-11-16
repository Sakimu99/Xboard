// 由 dashboard.blade.php 注入的站點與主題設定
export interface SiteSettings {
  title: string
  description: string
  logo: string | null
  version: string
  base_url: string
  default_language: string
  background_url: string
  banner_url: string
  sticker_url: string
  effects: 'full' | 'lite' | 'off'
  hero_title: string
}

declare global {
  interface Window {
    settings?: Partial<SiteSettings>
  }
}

export const settings: SiteSettings = {
  title: 'Xboard',
  description: '',
  logo: null,
  version: '',
  base_url: `/${(import.meta.env.VITE_BASE_PATH || '').replace(/^\/+|\/+$/g, '')}/`.replace(/\/+/g, '/'),
  default_language: 'zh-CN',
  background_url: '',
  banner_url: '',
  sticker_url: '',
  effects: 'full',
  hero_title: '',
  ...window.settings,
}
