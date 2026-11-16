import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, CheckCircle2Icon, CreditCardIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { QrDialog } from '@/components/qr-dialog'
import { QueryError } from '@/components/query-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/api/endpoints'
import { keys, useCurrency } from '@/api/queries'
import type { Order, PaymentMethod } from '@/api/types'
import { useT } from '@/i18n'
import { formatDate, formatMoney } from '@/lib/format'
import { ORDER_STATUS, ORDER_TYPE, periodLabel } from '@/lib/plan'
import { cn } from '@/lib/utils'

function feeOf(m: PaymentMethod | undefined, amount: number) {
  if (!m || (!m.handling_fee_fixed && !m.handling_fee_percent)) return 0
  return Math.round(amount * ((m.handling_fee_percent || 0) / 100) + (m.handling_fee_fixed || 0))
}

function Row({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex justify-between gap-4 text-sm', className)}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right tabular-nums">{value}</dd>
    </div>
  )
}

function PaymentPanel({ order }: { order: Order }) {
  const t = useT()
  const currency = useCurrency()
  const qc = useQueryClient()
  const methods = useQuery({ queryKey: ['user', 'paymentMethods'], queryFn: api.paymentMethods })
  const [methodId, setMethodId] = useState<number | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)

  const method = methods.data?.find((m) => m.id === methodId) ?? methods.data?.[0]
  const fee = feeOf(method, order.total_amount)
  const free = order.total_amount <= 0

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['user', 'order', order.trade_no] })
    qc.invalidateQueries({ queryKey: keys.orders })
    qc.invalidateQueries({ queryKey: keys.stat })
    qc.invalidateQueries({ queryKey: keys.subscribe })
  }

  const checkout = useMutation({
    mutationFn: api.checkout,
    onSuccess: (r) => {
      if (r.type === -1) {
        toast.success(t('order.paid'))
        refresh()
      } else if (r.type === 0) {
        setQr(String(r.data))
      } else if (r.type === 1) {
        window.location.href = String(r.data)
      }
    },
    onError: (e) => toast.error(e.message),
  })
  const cancel = useMutation({
    mutationFn: () => api.cancelOrder(order.trade_no),
    onSuccess: () => {
      toast.success(t('order.cancelled'))
      setCancelOpen(false)
      refresh()
    },
    onError: (e) => toast.error(e.message),
  })

  // 掃碼支付時輪詢訂單狀態
  useQuery({
    queryKey: ['user', 'orderCheck', order.trade_no],
    queryFn: async () => {
      const status = await api.checkOrder(order.trade_no)
      if (status !== 0) {
        setQr(null)
        toast.success(t('order.paid'))
        refresh()
      }
      return status
    },
    enabled: !!qr,
    refetchInterval: 3000,
  })

  return (
    <Card className="lg:sticky lg:top-24">
      <CardHeader>
        <CardTitle>{t('order.payment')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!free &&
          (methods.isLoading ? (
            <Skeleton className="h-24" />
          ) : !methods.data?.length ? (
            <p className="text-sm text-muted-foreground">{t('order.noMethods')}</p>
          ) : (
            <div role="radiogroup" className="grid gap-2">
              {methods.data.map((m) => {
                const active = m.id === method?.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setMethodId(m.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors hover:border-primary/50',
                      active && 'border-primary bg-primary/5 ring-1 ring-primary',
                    )}
                  >
                    {m.icon ? <img src={m.icon} alt="" className="size-6 rounded object-contain" /> : <CreditCardIcon className="size-5 text-muted-foreground" />}
                    <span className="flex-1 font-medium">{m.name}</span>
                    {feeOf(m, order.total_amount) > 0 && (
                      <span className="text-xs text-muted-foreground">+{formatMoney(feeOf(m, order.total_amount), currency)}</span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        <Separator />
        <dl className="space-y-2">
          <Row label={t('order.amountDue')} value={formatMoney(order.total_amount, currency)} />
          {fee > 0 && <Row label={t('order.fee')} value={formatMoney(fee, currency)} />}
        </dl>
        <div className="flex items-baseline justify-between">
          <span className="font-medium">{t('checkout.total')}</span>
          <span className="text-2xl font-semibold tabular-nums">{formatMoney(order.total_amount + fee, currency)}</span>
        </div>
        <Button
          className="w-full"
          size="lg"
          disabled={checkout.isPending || (!free && !method)}
          onClick={() => checkout.mutate({ trade_no: order.trade_no, method: method?.id ?? 0 })}
        >
          {checkout.isPending && <Loader2Icon className="animate-spin" />}
          {free ? t('order.confirmFree') : t('order.payNow')}
        </Button>
        <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setCancelOpen(true)}>
          {t('order.cancel')}
        </Button>
      </CardContent>
      <QrDialog
        open={!!qr}
        onOpenChange={(o) => !o && setQr(null)}
        value={qr ?? ''}
        title={t('order.scanTitle', { method: method?.name ?? '' })}
        description={t('order.scanDesc')}
        footer={
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            {t('order.waiting')}
          </p>
        }
      />
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('order.cancel')}</DialogTitle>
            <DialogDescription>{t('order.cancelConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              {t('common.back')}
            </Button>
            <Button variant="destructive" disabled={cancel.isPending} onClick={() => cancel.mutate()}>
              {t('order.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export function OrderDetailPage() {
  const t = useT()
  const currency = useCurrency()
  const tradeNo = useParams().tradeNo ?? ''
  const order = useQuery({ queryKey: ['user', 'order', tradeNo], queryFn: () => api.order(tradeNo), enabled: !!tradeNo })

  // 從第三方支付頁返回時刷新狀態
  const { refetch } = order
  const pending = order.data?.status === 0
  useEffect(() => {
    if (!pending) return
    const onFocus = () => refetch()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [pending, refetch])

  if (order.error) return <QueryError error={order.error} onRetry={() => order.refetch()} />
  if (order.isLoading || !order.data) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )
  }
  const o = order.data
  const status = ORDER_STATUS[o.status]
  const original = o.total_amount + (o.discount_amount || 0) + (o.surplus_amount || 0) + (o.balance_amount || 0)

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 text-muted-foreground">
        <Link to="/orders">
          <ArrowLeftIcon />
          {t('order.back')}
        </Link>
      </Button>
      <PageHeader title={t('order.title')} description={o.trade_no} actions={<Badge variant={status.variant} className="h-7 px-3 text-sm">{t(status.label)}</Badge>} />
      <div className={cn('grid items-start gap-6', o.status === 0 && 'lg:grid-cols-[1fr_360px]')}>
        <Card>
          <CardHeader>
            <CardTitle>{t('order.info')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <Row label={t('orders.plan')} value={<span className="font-medium">{o.plan?.name}</span>} />
              <Row label={t('orders.period')} value={t(periodLabel(o.period))} />
              <Row label={t('orders.type')} value={t(ORDER_TYPE[o.type])} />
              <Row label={t('orders.createdAt')} value={formatDate(o.created_at, true)} />
              {o.payment && <Row label={t('order.method')} value={o.payment.name} />}
            </dl>
            <Separator className="my-5" />
            <dl className="space-y-3">
              <Row label={t('checkout.subtotal')} value={formatMoney(original, currency)} />
              {!!o.discount_amount && <Row className="text-success" label={t('checkout.discount')} value={`-${formatMoney(o.discount_amount, currency)}`} />}
              {!!o.surplus_amount && <Row label={t('order.surplus')} value={`-${formatMoney(o.surplus_amount, currency)}`} />}
              {!!o.balance_amount && <Row label={t('order.balancePaid')} value={`-${formatMoney(o.balance_amount, currency)}`} />}
              {!!o.handling_amount && <Row label={t('order.fee')} value={formatMoney(o.handling_amount, currency)} />}
            </dl>
            <Separator className="my-5" />
            <div className="flex items-baseline justify-between">
              <span className="font-medium">{t('checkout.total')}</span>
              <span className="text-xl font-semibold tabular-nums">{formatMoney(o.total_amount + (o.handling_amount || 0), currency)}</span>
            </div>
            {o.status === 3 && (
              <div className="mt-6 flex items-center gap-2 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
                <CheckCircle2Icon className="size-4" />
                {t('order.completedHint')}
              </div>
            )}
          </CardContent>
        </Card>
        {o.status === 0 && <PaymentPanel order={o} />}
      </div>
    </>
  )
}
