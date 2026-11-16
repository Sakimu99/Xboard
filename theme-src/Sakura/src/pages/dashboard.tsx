import { useState } from 'react'
import { Link } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangleIcon,
  BellIcon,
  BookOpenIcon,
  LifeBuoyIcon,
  ServerIcon,
  ShoppingBagIcon,
  CalendarClockIcon,
  ChevronDownIcon,
  CopyIcon,
  DownloadIcon,
  GaugeIcon,
  QrCodeIcon,
  ReceiptTextIcon,
  RefreshCwIcon,
  WalletIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { WelcomeBanner } from '@/components/welcome-banner'
import { QrDialog } from '@/components/qr-dialog'
import { EmptyState, QueryError } from '@/components/query-state'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/api/endpoints'
import { keys, useCurrency, useStat, useSubscribe, useUserInfo } from '@/api/queries'
import type { Notice, Subscribe } from '@/api/types'
import { useT, type MessageKey } from '@/i18n'
import { copyText } from '@/lib/clipboard'
import { daysUntil, formatBytes, formatDate, formatMoney } from '@/lib/format'
import { settings } from '@/lib/settings'
import { cn } from '@/lib/utils'

function StatCard({ icon, label, value, hint, tone }: { icon: React.ReactNode; label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: 'warning' }) {
  return (
    <Card className="gap-3">
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <span className="[&_svg]:size-4">{icon}</span>
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={cn('text-xl font-semibold tabular-nums tracking-tight sm:text-2xl', tone === 'warning' && 'text-warning')}>{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

/** 常見客戶端的一鍵匯入連結 */
function importLinks(url: string) {
  const name = encodeURIComponent(settings.title)
  const u = encodeURIComponent(url)
  return [
    { label: 'Clash / Mihomo', href: `clash://install-config?url=${u}&name=${name}` },
    { label: 'Stash', href: `stash://install-config?url=${u}` },
    { label: 'Shadowrocket', href: `shadowrocket://add/sub://${btoa(url).replace(/=+$/, '')}?remark=${name}` },
    { label: 'sing-box', href: `sing-box://import-remote-profile?url=${u}#${name}` },
    { label: 'Hiddify', href: `hiddify://import/${url}#${name}` },
  ]
}

function SubscriptionCard({ sub }: { sub: Subscribe }) {
  const t = useT()
  const qc = useQueryClient()
  const [qrOpen, setQrOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const reset = useMutation({
    mutationFn: api.resetSecurity,
    onSuccess: () => {
      toast.success(t('dashboard.resetDone'))
      setResetOpen(false)
      qc.invalidateQueries({ queryKey: keys.subscribe })
    },
    onError: (e) => toast.error(e.message),
  })

  const used = (sub.u || 0) + (sub.d || 0)
  const total = sub.transfer_enable || 0
  const percent = total ? Math.min(100, (used / total) * 100) : 0
  const days = daysUntil(sub.expired_at)
  const copy = async () => {
    if (await copyText(sub.subscribe_url)) toast.success(t('common.copied'))
    else toast.error(t('common.copyFailed'))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {sub.plan?.name}
          {days !== null && days < 0 ? <Badge variant="destructive">{t('dashboard.expired')}</Badge> : <Badge variant="success">{t('dashboard.active')}</Badge>}
        </CardTitle>
        <CardDescription>
          {sub.expired_at ? t('dashboard.expiresOn', { date: formatDate(sub.expired_at) }) : t('dashboard.neverExpire')}
          {sub.reset_day != null && ` · ${t('dashboard.resetIn', { days: sub.reset_day })}`}
        </CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/plans/${sub.plan_id}`}>{t('dashboard.renew')}</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">{t('dashboard.trafficUsed')}</span>
            <span className="tabular-nums">
              <span className="font-medium">{formatBytes(used)}</span>
              <span className="text-muted-foreground"> / {formatBytes(total)}</span>
            </span>
          </div>
          <Progress value={percent} indicatorClassName={percent >= 90 ? 'bg-destructive' : percent >= 75 ? 'bg-warning' : undefined} />
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>↑ {formatBytes(sub.u)}</span>
            <span>↓ {formatBytes(sub.d)}</span>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">{t('dashboard.deviceLimit')}</dt>
            <dd className="mt-1 font-medium">{sub.device_limit ?? t('common.unlimited')}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('dashboard.speedLimit')}</dt>
            <dd className="mt-1 font-medium">{sub.speed_limit ? `${sub.speed_limit} Mbps` : t('common.unlimited')}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('dashboard.nextReset')}</dt>
            <dd className="mt-1 font-medium">{formatDate(sub.next_reset_at)}</dd>
          </div>
        </dl>
        <Separator />
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('dashboard.subscribeUrl')}</p>
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
            <code className="flex-1 truncate font-mono text-xs text-muted-foreground">{sub.subscribe_url}</code>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" onClick={copy}>
              <CopyIcon />
              {t('dashboard.copyUrl')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setQrOpen(true)}>
              <QrCodeIcon />
              {t('dashboard.qrcode')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <DownloadIcon />
                  {t('dashboard.import')}
                  <ChevronDownIcon className="opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {importLinks(sub.subscribe_url).map((l) => (
                  <DropdownMenuItem key={l.label} asChild>
                    <a href={l.href}>{l.label}</a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setResetOpen(true)}>
              <RefreshCwIcon />
              {t('dashboard.resetUrl')}
            </Button>
          </div>
        </div>
      </CardContent>
      <QrDialog open={qrOpen} onOpenChange={setQrOpen} value={sub.subscribe_url} title={t('dashboard.qrcode')} description={t('dashboard.qrcodeDesc')} />
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dashboard.resetUrl')}</DialogTitle>
            <DialogDescription>{t('dashboard.resetConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" disabled={reset.isPending} onClick={() => reset.mutate()}>
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function NoticeCard() {
  const t = useT()
  const { data, isLoading } = useQuery({ queryKey: ['user', 'notices'], queryFn: api.notices })
  const [active, setActive] = useState<Notice | null>(null)
  const list = data?.data ?? []
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.notices')}</CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        {isLoading ? (
          <div className="space-y-3 px-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : list.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">{t('dashboard.noNotices')}</p>
        ) : (
          <ul>
            {list.map((n) => (
              <li key={n.id}>
                <button className="w-full rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent" onClick={() => setActive(n)}>
                  <p className="truncate text-sm font-medium">{n.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{active?.title}</DialogTitle>
            <DialogDescription>{formatDate(active?.created_at, true)}</DialogDescription>
          </DialogHeader>
          {active?.img_url && <img src={active.img_url} alt="" className="max-h-56 w-full rounded-md object-cover" />}
          {/* 公告內容由管理員維護，允許 HTML */}
          <div className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: active?.content ?? '' }} />
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export function DashboardPage() {
  const t = useT()
  const currency = useCurrency()
  const info = useUserInfo()
  const sub = useSubscribe()
  const stat = useStat()

  if (sub.error) return <QueryError error={sub.error} onRetry={() => sub.refetch()} />

  const s = sub.data
  const remaining = s ? Math.max(0, s.transfer_enable - s.u - s.d) : 0
  const days = daysUntil(s?.expired_at)
  const [pendingOrders = 0] = stat.data ?? []
  const loading = sub.isLoading || info.isLoading

  return (
    <>
      <WelcomeBanner title={t('dashboard.greeting', { time: t(greetingKey()) })} subtitle={info.data ? t('dashboard.welcome', { email: info.data.email }) : undefined}>
        <Button size="sm" asChild>
          <Link to="/knowledge">
            <BookOpenIcon />
            {t('shortcut.docs')}
          </Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link to="/plans">
            <ShoppingBagIcon />
            {t('nav.plans')}
          </Link>
        </Button>
      </WelcomeBanner>

      {pendingOrders > 0 && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangleIcon />
          <AlertTitle>{t('dashboard.pendingOrderTitle')}</AlertTitle>
          <AlertDescription>
            <span>{t('dashboard.pendingOrderDesc')}</span>
            <Link to="/orders" className="font-medium text-foreground underline underline-offset-4">
              {t('dashboard.viewOrders')}
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[118px] rounded-xl" />)
        ) : (
          <>
            <StatCard icon={<WalletIcon />} label={t('dashboard.balance')} value={formatMoney(info.data?.balance, currency)} hint={t('dashboard.commission', { amount: formatMoney(info.data?.commission_balance, currency) })} />
            <StatCard icon={<GaugeIcon />} label={t('dashboard.remaining')} value={s?.plan_id ? formatBytes(remaining) : '-'} hint={s?.plan_id ? t('dashboard.ofTotal', { total: formatBytes(s.transfer_enable) }) : undefined} />
            <StatCard
              icon={<CalendarClockIcon />}
              label={t('dashboard.daysLeft')}
              value={!s?.plan_id ? '-' : days === null ? '∞' : Math.max(0, days)}
              hint={s?.expired_at ? formatDate(s.expired_at) : undefined}
              tone={days !== null && days <= 7 ? 'warning' : undefined}
            />
            <StatCard icon={<ReceiptTextIcon />} label={t('dashboard.pendingOrders')} value={pendingOrders} hint={t('dashboard.invited', { count: stat.data?.[2] ?? 0 })} />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {loading ? (
            <Skeleton className="h-96 rounded-xl" />
          ) : s?.plan_id && s.plan ? (
            <SubscriptionCard sub={s} />
          ) : (
            <EmptyState
              icon={<BellIcon />}
              title={t('dashboard.noPlan')}
              description={t('dashboard.noPlanDesc')}
              action={
                <Button asChild>
                  <Link to="/plans">{t('dashboard.browsePlans')}</Link>
                </Button>
              }
            />
          )}
        </div>
        <NoticeCard />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {SHORTCUTS.map(({ to, icon: Icon, title, desc }) => (
          <Link key={to} to={to} className="group">
            <Card className="h-full gap-2 py-4 transition-all group-hover:-translate-y-1 group-hover:border-primary/40">
              <CardContent className="flex items-start gap-3 px-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-[0_6px_18px_-6px_var(--primary)] transition-transform group-hover:rotate-6">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{t(title)}</span>
                  <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{t(desc)}</span>
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  )
}

/** 依時段問候 */
function greetingKey(): MessageKey {
  const h = new Date().getHours()
  if (h < 6) return 'greeting.night'
  if (h < 11) return 'greeting.morning'
  if (h < 14) return 'greeting.noon'
  if (h < 18) return 'greeting.afternoon'
  return 'greeting.evening'
}

const SHORTCUTS: { to: string; icon: typeof BookOpenIcon; title: MessageKey; desc: MessageKey }[] = [
  { to: '/knowledge', icon: BookOpenIcon, title: 'shortcut.docs', desc: 'shortcut.docsDesc' },
  { to: '/nodes', icon: ServerIcon, title: 'shortcut.nodes', desc: 'shortcut.nodesDesc' },
  { to: '/plans', icon: ShoppingBagIcon, title: 'shortcut.renew', desc: 'shortcut.renewDesc' },
  { to: '/tickets', icon: LifeBuoyIcon, title: 'shortcut.help', desc: 'shortcut.helpDesc' },
]
