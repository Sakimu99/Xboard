import { settings } from './settings'

/**
 * 為同一張隨機圖 API 的不同位置加上 slot 參數，
 * 避免瀏覽器快取讓整頁出現同一張圖
 */
function slotted(url: string, slot: string) {
  if (!url) return ''
  return `${url}${url.includes('?') ? '&' : '?'}slot=${slot}`
}

export const images = {
  /** 白底橫圖立繪（角色在右側） */
  standee: (slot = 'bg') => slotted(settings.background_url, slot),
  /** 萌系橫幅 */
  banner: (slot = 'banner') => slotted(settings.banner_url, slot),
  /** 白底 Q 版貼圖 */
  sticker: (slot: string) => slotted(settings.sticker_url, slot),
}
