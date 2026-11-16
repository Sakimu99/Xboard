// 本地開發用的 Xboard V1 API 模擬服務（僅覆蓋本主題用到的介面）
// 用法：node scripts/mock-server.mjs，再以 VITE_API_TARGET=http://127.0.0.1:7001 啟動 vite
import { createServer } from 'node:http'

const now = () => Math.floor(Date.now() / 1000)
const GB = 1073741824
const plans = [
  {
    id: 1, group_id: 1, name: '基础入门', tags: ['热门'], transfer_enable: 200, speed_limit: null, device_limit: 3,
    content: JSON.stringify([{ feature: '每月 200 GB 流量', support: true }, { feature: '3 台裝置同時在線', support: true }, { feature: '全球 20+ 地區節點', support: true }, { feature: '專屬客服', support: false }]),
    month_price: 1500, quarter_price: 4200, half_year_price: null, year_price: 15000, two_year_price: null, three_year_price: null, onetime_price: null, reset_price: 1000,
    capacity_limit: null, show: true, sell: true, renew: true, reset_traffic_method: 1, sort: 1,
  },
  {
    id: 2, group_id: 1, name: '标准畅享', tags: null, transfer_enable: 1000, speed_limit: 1000, device_limit: 10,
    content: '每月 1000 GB 流量\n10 台裝置同時在線\n全球 40+ 地區節點\n專屬客服',
    month_price: 4500, quarter_price: 12900, half_year_price: 24900, year_price: 45000, two_year_price: null, three_year_price: null, onetime_price: null, reset_price: null,
    capacity_limit: null, show: true, sell: true, renew: true, reset_traffic_method: 1, sort: 2,
  },
  {
    id: 3, group_id: 1, name: '旗舰专线', tags: ['IPLC'], transfer_enable: 3000, speed_limit: null, device_limit: null,
    content: '<ul><li>每月 3000 GB 流量</li><li>裝置不限</li><li>IPLC 專線</li></ul>',
    month_price: 12000, quarter_price: null, half_year_price: null, year_price: 120000, two_year_price: null, three_year_price: null, onetime_price: null, reset_price: null,
    capacity_limit: 'Sold out', show: true, sell: true, renew: true, reset_traffic_method: 1, sort: 3,
  },
]
const orders = [
  { id: 2, trade_no: '2026111612000012345', plan_id: 1, period: 'year_price', type: 2, status: 0, total_amount: 14000, handling_amount: null, balance_amount: 0, discount_amount: 1000, surplus_amount: 0, refund_amount: null, created_at: now() - 600, updated_at: now() - 600 },
  { id: 1, trade_no: '2026101009300098765', plan_id: 1, period: 'month_price', type: 1, status: 3, total_amount: 1500, handling_amount: null, balance_amount: 0, discount_amount: 0, surplus_amount: 0, refund_amount: null, created_at: now() - 86400 * 37, updated_at: now() - 86400 * 37 },
]
const withPlan = (o) => ({ ...o, plan: plans.find((p) => p.id === o.plan_id) })

const ok = (data) => ({ status: 'success', message: '操作成功', data, error: null })
const routes = {
  'GET /guest/comm/config': () => ok({ tos_url: 'https://example.com/tos', is_email_verify: 1, is_invite_force: 0, email_whitelist_suffix: 0, is_captcha: 0, captcha_type: 'turnstile', app_description: 'Xboard', logo: null }),
  'POST /passport/auth/login': (b) => (b.password === 'password' ? ok({ token: 't', auth_data: 'Bearer mock', is_admin: false }) : [400, { status: 'fail', message: '邮箱或密码错误', data: null }]),
  'POST /passport/auth/register': () => ok({ token: 't', auth_data: 'Bearer mock', is_admin: false }),
  'POST /passport/comm/sendEmailVerify': () => ok(true),
  'POST /passport/auth/forget': () => ok(true),
  'GET /user/comm/config': () => ok({ is_telegram: 0, currency: 'CNY', currency_symbol: '¥', withdraw_close: 0, withdraw_methods: ['支付宝', 'USDT'] }),
  'GET /user/info': () => ok({ email: 'demo@company.com', transfer_enable: 200 * GB, last_login_at: now() - 3600, created_at: now() - 86400 * 120, banned: 0, remind_expire: 1, remind_traffic: 0, expired_at: now() + 86400 * 23, balance: 2350, commission_balance: 880, plan_id: 1, discount: null, commission_rate: null, telegram_id: null, uuid: 'uuid', avatar_url: 'https://cdn.v2ex.com/gravatar/0?s=64&d=identicon' }),
  'GET /user/getStat': () => ok([1, 0, 4]),
  'GET /user/getSubscribe': () => ok({ plan_id: 1, token: 'abc', expired_at: now() + 86400 * 23, u: 12.4 * GB, d: 131.7 * GB, transfer_enable: 200 * GB, email: 'demo@company.com', uuid: 'uuid', device_limit: 3, speed_limit: null, next_reset_at: now() + 86400 * 9, plan: plans[0], subscribe_url: 'https://sub.example.com/s/3f9c2a7b1e8d4c6f', reset_day: 9 }),
  'GET /user/resetSecurity': () => ok('https://sub.example.com/s/new'),
  'POST /user/update': () => ok(true),
  'POST /user/changePassword': () => ok(true),
  'GET /user/notice/fetch': () => ({ data: [
    { id: 2, title: '11 月節點維護通知', content: '本週六 02:00–04:00 將對香港節點進行例行維護，期間可能短暫中斷。', img_url: null, created_at: now() - 86400 * 2 },
    { id: 1, title: '新增東京、新加坡專線節點', content: '<p>即日起所有方案均可使用新節點。</p>', img_url: null, created_at: now() - 86400 * 12 },
  ], total: 2 }),
  'GET /user/plan/fetch': (_, q) => ok(q.get('id') ? plans.find((p) => p.id === Number(q.get('id'))) : plans),
  'POST /user/coupon/check': (b) => (b.code === 'VIP10' ? ok({ id: 1, name: '九折优惠', code: 'VIP10', type: 2, value: 10 }) : [400, { message: '优惠券无效' }]),
  'GET /user/order/fetch': () => ok(orders.map(withPlan)),
  'GET /user/order/detail': (_, q) => ok(withPlan(orders.find((o) => o.trade_no === q.get('trade_no')) ?? orders[0])),
  'POST /user/order/save': () => ok(orders[0].trade_no),
  'GET /user/order/getPaymentMethod': () => ok([
    { id: 1, name: '支付宝', payment: 'AlipayF2F', icon: null, handling_fee_fixed: null, handling_fee_percent: null },
    { id: 2, name: '信用卡', payment: 'Stripe', icon: null, handling_fee_fixed: 100, handling_fee_percent: 2 },
  ]),
  'POST /user/order/checkout': () => ({ type: 0, data: 'https://qr.alipay.com/mock' }),
  'GET /user/order/check': () => ok(0),
  'POST /user/order/cancel': () => ok(true),
  'GET /user/knowledge/fetch': (_, q) => q.get('id')
    ? ok({ id: 1, category: '客户端教程', title: 'Clash Verge 使用教程', updated_at: now() - 86400, body: '## 下载客户端\n\n前往 [GitHub](https://github.com) 下载最新版本。\n\n## 导入订阅\n\n1. 复制订阅链接\n2. 打开 **配置** 页面粘贴\n\n```\n{{subscribeUrl}}\n```\n\n> 遇到问题请提交工单。' })
    : ok({ '客户端教程': [{ id: 1, category: '客户端教程', title: 'Clash Verge 使用教程', updated_at: now() - 86400 }, { id: 2, category: '客户端教程', title: 'Shadowrocket 使用教程', updated_at: now() - 86400 * 3 }], '常见问题': [{ id: 3, category: '常见问题', title: '为什么连不上？', updated_at: now() - 86400 * 9 }] }),
  'GET /user/server/fetch': () => ({ data: [
    { id: 1, type: 'vless', name: '🇭🇰 香港 01', rate: '1', tags: ['IPLC'], is_online: 1, last_check_at: now() },
    { id: 2, type: 'hysteria', name: '🇯🇵 东京 01', rate: '1.5', tags: ['原生IP', '解锁'], is_online: 1, last_check_at: now() },
    { id: 3, type: 'trojan', name: '🇸🇬 新加坡 01', rate: '1', tags: null, is_online: 0, last_check_at: now() - 900 },
    { id: 4, type: 'shadowsocks', name: '🇺🇸 洛杉矶 01', rate: '0.5', tags: ['低倍率'], is_online: 1, last_check_at: now() },
  ] }),
  'GET /user/stat/getTrafficLog': () => ok(Array.from({ length: 14 }, (_, i) => ({ u: Math.random() * 0.4 * GB, d: (1 + Math.random() * 6) * GB, record_at: now() - 86400 * i, server_rate: i % 3 ? '1' : '1.5' }))),
  'GET /user/invite/fetch': () => ok({ codes: [{ code: 'Sakura42', pv: 12, status: 0, created_at: now() - 86400 * 20 }], stat: [4, 3260, 450, 10, 880] }),
  'GET /user/invite/save': () => ok(true),
  'GET /user/invite/details': () => ({ data: [{ id: 1, order_amount: 4500, trade_no: '2026110812000011111', get_amount: 450, created_at: now() - 86400 * 8 }], total: 1 }),
  'POST /user/transfer': () => ok(true),
  'POST /user/ticket/withdraw': () => ok(true),
  'GET /user/ticket/fetch': (_, q) => q.get('id')
    ? ok({ id: 1, level: 1, reply_status: 1, status: 0, subject: '东京节点晚高峰速度慢', created_at: now() - 7200, updated_at: now() - 3600, message: [
        { id: 1, ticket_id: 1, is_me: true, message: '晚上 9 点左右东京节点只有 2Mbps，麻烦看一下～', created_at: now() - 7200 },
        { id: 2, ticket_id: 1, is_me: false, message: '您好，已经为东京线路扩容，请再测试一下哦。', created_at: now() - 3600 },
      ] })
    : ok([{ id: 1, level: 1, reply_status: 1, status: 0, subject: '东京节点晚高峰速度慢', created_at: now() - 7200, updated_at: now() - 3600, message: null }]),
  'POST /user/ticket/save': () => ok(true),
  'POST /user/ticket/reply': () => ok(true),
  'POST /user/ticket/close': () => ok(true),
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')
  const key = `${req.method} ${url.pathname.replace(/^\/api\/v1/, '')}`
  let body = ''
  for await (const chunk of req) body += chunk
  const handler = routes[key]
  if (key.includes(' /user/') && !req.headers.authorization) return send(res, 403, { message: '未登录或登陆已过期' })
  if (!handler) return send(res, 404, { message: `mock: ${key} not found` })
  const out = handler(body ? JSON.parse(body) : {}, url.searchParams)
  Array.isArray(out) ? send(res, out[0], out[1]) : send(res, 200, out)
}).listen(7001, () => console.log('mock api on http://127.0.0.1:7001'))

function send(res, status, json) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(json))
}
