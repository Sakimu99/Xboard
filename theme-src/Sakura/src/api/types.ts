export interface GuestConfig {
  tos_url: string | null
  is_email_verify: 0 | 1
  is_invite_force: 0 | 1
  email_whitelist_suffix: string[] | 0
  is_captcha: 0 | 1
  captcha_type: 'recaptcha' | 'recaptcha-v3' | 'turnstile'
  recaptcha_site_key: string | null
  recaptcha_v3_site_key: string | null
  turnstile_site_key: string | null
  app_description: string | null
  logo: string | null
}

export interface UserConfig {
  is_telegram: number
  telegram_discuss_link: string | null
  currency: string
  currency_symbol: string
  withdraw_close: number
  withdraw_methods: string[] | null
}

export interface AuthData {
  token: string
  auth_data: string
  is_admin: boolean | number
}

export interface UserInfo {
  email: string
  transfer_enable: number
  last_login_at: number | null
  created_at: number
  banned: number
  remind_expire: number
  remind_traffic: number
  expired_at: number | null
  balance: number
  commission_balance: number
  plan_id: number | null
  discount: number | null
  commission_rate: number | null
  telegram_id: number | null
  uuid: string
  avatar_url: string
}

export type PeriodKey =
  | 'month_price'
  | 'quarter_price'
  | 'half_year_price'
  | 'year_price'
  | 'two_year_price'
  | 'three_year_price'
  | 'onetime_price'
  | 'reset_price'

export type Plan = {
  id: number
  group_id: number | null
  name: string
  tags: string[] | null
  content: string
  capacity_limit: number | string | null
  transfer_enable: number
  speed_limit: number | null
  device_limit: number | null
  show: boolean
  sell: boolean
  renew: boolean
  reset_traffic_method: number | null
  sort: number
} & Record<PeriodKey, number | null>

export interface Subscribe {
  plan_id: number | null
  token: string
  expired_at: number | null
  u: number
  d: number
  transfer_enable: number
  email: string
  uuid: string
  device_limit: number | null
  speed_limit: number | null
  next_reset_at: number | null
  plan?: Plan
  subscribe_url: string
  reset_day: number | null
}

export interface Notice {
  id: number
  title: string
  content: string
  img_url: string | null
  tags: string[] | null
  created_at: number
}

export interface Order {
  id: number
  trade_no: string
  plan_id: number
  period: PeriodKey
  type: 1 | 2 | 3 | 4
  status: 0 | 1 | 2 | 3 | 4
  total_amount: number
  handling_amount: number | null
  balance_amount: number | null
  discount_amount: number | null
  surplus_amount: number | null
  refund_amount: number | null
  created_at: number
  updated_at: number
  plan?: Plan
  payment?: { id: number; name: string; payment: string; icon: string | null } | null
}

export interface PaymentMethod {
  id: number
  name: string
  payment: string
  icon: string | null
  handling_fee_fixed: number | null
  handling_fee_percent: number | null
}

export interface Coupon {
  id: number
  name: string
  code: string
  type: 1 | 2 // 1 固定金額(分) 2 百分比
  value: number
}

export interface CheckoutResult {
  type: -1 | 0 | 1 // -1 已完成 0 二維碼 1 跳轉
  data: string | boolean
}

export interface KnowledgeItem {
  id: number
  category: string
  title: string
  body?: string
  updated_at: number
}

export interface ServerNode {
  id: number
  type: string
  version?: string | null
  name: string
  rate: string | number
  tags: string[] | null
  is_online: number | boolean
  last_check_at: number | null
}

export interface InviteCode {
  code: string
  pv: number
  status: number
  created_at: number
}

export interface InviteInfo {
  codes: InviteCode[]
  /** [已注册人数, 累计佣金, 确认中佣金, 佣金比例, 可用佣金] */
  stat: [number, number, number, number, number]
}

export interface CommissionLog {
  id: number
  order_amount: number
  trade_no: string
  get_amount: number
  created_at: number
}

export interface TicketMessage {
  id: number
  ticket_id: number
  is_me: boolean | number
  message: string
  created_at: number
}

export interface Ticket {
  id: number
  level: 0 | 1 | 2
  reply_status: 0 | 1
  status: 0 | 1
  subject: string
  message: TicketMessage[] | null
  created_at: number
  updated_at: number
}

export interface TrafficLog {
  u: number
  d: number
  record_at: number
  server_rate: string | number
}
