import { http, type Envelope } from './client'
import type {
  AuthData,
  CheckoutResult,
  CommissionLog,
  Coupon,
  InviteInfo,
  KnowledgeItem,
  ServerNode,
  Ticket,
  TrafficLog,
  GuestConfig,
  Notice,
  Order,
  PaymentMethod,
  PeriodKey,
  Plan,
  Subscribe,
  UserConfig,
  UserInfo,
} from './types'

const data = <T>(p: Promise<Envelope<T>>) => p.then((r) => r.data)

export const api = {
  // 訪客 / 登入
  guestConfig: () => data(http.get<Envelope<GuestConfig>>('/guest/comm/config')),
  login: (body: { email: string; password: string }) => data(http.post<Envelope<AuthData>>('/passport/auth/login', body)),
  register: (body: Record<string, string>) => data(http.post<Envelope<AuthData>>('/passport/auth/register', body)),
  forget: (body: { email: string; password: string; email_code: string }) => data(http.post<Envelope<boolean>>('/passport/auth/forget', body)),
  sendEmailCode: (body: Record<string, string>) => data(http.post<Envelope<boolean>>('/passport/comm/sendEmailVerify', body)),
  token2Login: (verify: string) => data(http.get<Envelope<AuthData>>('/passport/auth/token2Login', { verify })),

  // 用戶
  userConfig: () => data(http.get<Envelope<UserConfig>>('/user/comm/config')),
  info: () => data(http.get<Envelope<UserInfo>>('/user/info')),
  stat: () => data(http.get<Envelope<[number, number, number]>>('/user/getStat')),
  subscribe: () => data(http.get<Envelope<Subscribe>>('/user/getSubscribe')),
  resetSecurity: () => data(http.get<Envelope<string>>('/user/resetSecurity')),
  changePassword: (body: { old_password: string; new_password: string }) => data(http.post<Envelope<boolean>>('/user/changePassword', body)),
  updateUser: (body: { remind_expire?: number; remind_traffic?: number }) => data(http.post<Envelope<boolean>>('/user/update', body)),
  notices: () => http.get<{ data: Notice[]; total: number }>('/user/notice/fetch', { current: 1 }),

  // 方案 / 訂單
  plans: () => data(http.get<Envelope<Plan[]>>('/user/plan/fetch')),
  plan: (id: number) => data(http.get<Envelope<Plan>>('/user/plan/fetch', { id })),
  checkCoupon: (body: { code: string; plan_id: number; period: PeriodKey }) => data(http.post<Envelope<Coupon>>('/user/coupon/check', body)),
  orders: () => data(http.get<Envelope<Order[]>>('/user/order/fetch')),
  order: (trade_no: string) => data(http.get<Envelope<Order>>('/user/order/detail', { trade_no })),
  saveOrder: (body: { plan_id: number; period: PeriodKey; coupon_code?: string }) => data(http.post<Envelope<string>>('/user/order/save', body)),
  paymentMethods: () => data(http.get<Envelope<PaymentMethod[]>>('/user/order/getPaymentMethod')),
  checkout: (body: { trade_no: string; method: number }) => http.post<CheckoutResult>('/user/order/checkout', body),
  checkOrder: (trade_no: string) => data(http.get<Envelope<number>>('/user/order/check', { trade_no })),
  cancelOrder: (trade_no: string) => data(http.post<Envelope<boolean>>('/user/order/cancel', { trade_no })),

  // 文檔 / 節點 / 流量
  knowledge: (language: string, keyword?: string) =>
    data(http.get<Envelope<Record<string, KnowledgeItem[]> | []>>('/user/knowledge/fetch', { language, keyword })),
  article: (id: number) => data(http.get<Envelope<KnowledgeItem>>('/user/knowledge/fetch', { id })),
  servers: () => http.get<{ data: ServerNode[] }>('/user/server/fetch').then((r) => r.data),
  trafficLog: () => data(http.get<Envelope<TrafficLog[]>>('/user/stat/getTrafficLog')),

  // 邀請 / 佣金
  invite: () => data(http.get<Envelope<InviteInfo>>('/user/invite/fetch')),
  createInviteCode: () => data(http.get<Envelope<boolean>>('/user/invite/save')),
  commissionLogs: (current: number) => http.get<{ data: CommissionLog[]; total: number }>('/user/invite/details', { current, page_size: 10 }),
  transfer: (transfer_amount: number) => data(http.post<Envelope<boolean>>('/user/transfer', { transfer_amount })),
  withdraw: (body: { withdraw_method: string; withdraw_account: string }) => data(http.post<Envelope<boolean>>('/user/ticket/withdraw', body)),

  // 工單
  tickets: () => data(http.get<Envelope<Ticket[]>>('/user/ticket/fetch')),
  ticket: (id: number) => data(http.get<Envelope<Ticket>>('/user/ticket/fetch', { id })),
  createTicket: (body: { subject: string; level: number; message: string }) => data(http.post<Envelope<boolean>>('/user/ticket/save', body)),
  replyTicket: (body: { id: number; message: string }) => data(http.post<Envelope<boolean>>('/user/ticket/reply', body)),
  closeTicket: (id: number) => data(http.post<Envelope<boolean>>('/user/ticket/close', { id })),
}
