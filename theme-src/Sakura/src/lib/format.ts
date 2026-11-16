const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

export function formatBytes(bytes: number | null | undefined, digits = 2): string {
  const n = Number(bytes) || 0
  if (n <= 0) return '0 B'
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), UNITS.length - 1)
  return `${(n / 1024 ** i).toFixed(i === 0 ? 0 : digits)} ${UNITS[i]}`
}

/** 金額欄位以「分」為單位 */
export function formatMoney(cents: number | null | undefined, symbol = '¥'): string {
  const n = (Number(cents) || 0) / 100
  return `${symbol}${n.toFixed(2)}`
}

/** Xboard 的時間欄位多為 Unix 秒 */
export function toDate(value: number | string | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (!Number.isNaN(n)) return new Date(n < 1e12 ? n * 1000 : n)
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatDate(value: number | string | null | undefined, withTime = false): string {
  const d = toDate(value)
  if (!d) return '-'
  const pad = (x: number) => String(x).padStart(2, '0')
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return withTime ? `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}` : date
}

export function daysUntil(value: number | null | undefined): number | null {
  const d = toDate(value)
  if (!d) return null
  return Math.ceil((d.getTime() - Date.now()) / 86400000)
}
