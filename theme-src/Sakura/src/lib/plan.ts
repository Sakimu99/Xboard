import type { MessageKey } from '@/i18n'
import type { Order, PeriodKey, Plan } from '@/api/types'

export const PERIODS: { key: PeriodKey; label: MessageKey; months: number }[] = [
  { key: 'month_price', label: 'period.month', months: 1 },
  { key: 'quarter_price', label: 'period.quarter', months: 3 },
  { key: 'half_year_price', label: 'period.halfYear', months: 6 },
  { key: 'year_price', label: 'period.year', months: 12 },
  { key: 'two_year_price', label: 'period.twoYear', months: 24 },
  { key: 'three_year_price', label: 'period.threeYear', months: 36 },
  { key: 'onetime_price', label: 'period.onetime', months: 0 },
  { key: 'reset_price', label: 'period.reset', months: 0 },
]

export const periodLabel = (key: string): MessageKey => PERIODS.find((p) => p.key === key)?.label ?? 'period.month'

/** 可購買的週期（重置流量包僅在已有訂閱時於訂單頁使用） */
export function availablePeriods(plan: Plan, includeReset = false) {
  return PERIODS.filter((p) => plan[p.key] !== null && (includeReset || p.key !== 'reset_price'))
}

/** 卡片上顯示的「起」價：取最短週期的價格 */
export function startingPrice(plan: Plan): { price: number; period: (typeof PERIODS)[number] } | null {
  const list = availablePeriods(plan)
  if (!list.length) return null
  const first = list[0]
  return { price: plan[first.key] as number, period: first }
}

export type Feature = { text: string; ok: boolean }

/** 方案內容支援 JSON 功能清單、HTML 或純文字（每行一項） */
export function parseContent(content: string): { features: Feature[] } | { html: string } {
  const raw = (content ?? '').trim()
  try {
    const arr = JSON.parse(raw)
    if (Array.isArray(arr)) {
      return { features: arr.map((x) => ({ text: String(x.feature ?? x.text ?? x), ok: x.support !== false })) }
    }
  } catch {
    /* not json */
  }
  if (/<[a-z][\s\S]*>/i.test(raw)) return { html: raw }
  return {
    features: raw
      .split(/\r?\n/)
      .map((l) => l.replace(/^\s*[-*•]\s*/, '').trim())
      .filter(Boolean)
      .map((text) => ({ text, ok: true })),
  }
}

export const ORDER_STATUS: Record<Order['status'], { label: MessageKey; variant: 'warning' | 'default' | 'secondary' | 'success' }> = {
  0: { label: 'order.status.pending', variant: 'warning' },
  1: { label: 'order.status.processing', variant: 'default' },
  2: { label: 'order.status.cancelled', variant: 'secondary' },
  3: { label: 'order.status.completed', variant: 'success' },
  4: { label: 'order.status.discounted', variant: 'secondary' },
}

export const ORDER_TYPE: Record<Order['type'], MessageKey> = {
  1: 'order.type.new',
  2: 'order.type.renew',
  3: 'order.type.upgrade',
  4: 'order.type.reset',
}
