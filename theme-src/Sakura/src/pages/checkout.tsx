import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, Loader2Icon, TicketPercentIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { PlanFeatures } from '@/components/plan-features'
import { QueryError } from '@/components/query-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/api/endpoints'
import { keys, useCurrency } from '@/api/queries'
import type { Coupon, PeriodKey } from '@/api/types'
import { useT } from '@/i18n'
import { formatMoney } from '@/lib/format'
import { availablePeriods } from '@/lib/plan'
import { cn } from '@/lib/utils'

function discountOf(coupon: Coupon | null, price: number) {
  if (!coupon) return 0
  const d = coupon.type === 1 ? coupon.value : Math.floor((price * coupon.value) / 100)
  return Math.min(price, d)
}

export function CheckoutPage() {
  const t = useT()
  const currency = useCurrency()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const id = Number(useParams().id)
  const plan = useQuery({ queryKey: ['user', 'plan', id], queryFn: () => api.plan(id), enabled: !!id })

  const [selected, setSelected] = useState<PeriodKey | null>(null)
  const [code, setCode] = useState('')
  const [coupon, setCoupon] = useState<Coupon | null>(null)

  const periods = plan.data ? availablePeriods(plan.data) : []
  const period = selected ?? periods[0]?.key ?? null
  const price = plan.data && period ? (plan.data[period] ?? 0) : 0
  const discount = discountOf(coupon, price)

  const check = useMutation({
    mutationFn: api.checkCoupon,
    onSuccess: (c) => {
      setCoupon(c)
      toast.success(t('checkout.couponApplied'))
    },
    onError: (e) => toast.error(e.message),
  })
  const save = useMutation({
    mutationFn: api.saveOrder,
    onSuccess: (tradeNo) => {
      qc.invalidateQueries({ queryKey: keys.orders })
      qc.invalidateQueries({ queryKey: keys.stat })
      navigate(`/orders/${tradeNo}`)
    },
    onError: (e) => toast.error(e.message),
  })

  if (plan.error) return <QueryError error={plan.error} onRetry={() => plan.refetch()} />
  if (plan.isLoading || !plan.data) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    )
  }
  const p = plan.data

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 text-muted-foreground">
        <Link to="/plans">
          <ArrowLeftIcon />
          {t('checkout.back')}
        </Link>
      </Button>
      <PageHeader title={p.name} description={t('checkout.desc')} />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('checkout.period')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
                {periods.map((x) => {
                  const active = x.key === period
                  const amount = p[x.key] as number
                  return (
                    <button
                      key={x.key}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        setSelected(x.key)
                        setCoupon(null)
                      }}
                      className={cn(
                        'flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors hover:border-primary/50',
                        active && 'border-primary bg-primary/5 ring-1 ring-primary',
                      )}
                    >
                      <span className="text-sm font-medium">{t(x.label)}</span>
                      <span className="text-right">
                        <span className="block font-semibold tabular-nums">{formatMoney(amount, currency)}</span>
                        {x.months > 1 && (
                          <span className="block text-xs text-muted-foreground tabular-nums">
                            {t('checkout.perMonth', { price: formatMoney(Math.round(amount / x.months), currency) })}
                          </span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('checkout.features')}</CardTitle>
            </CardHeader>
            <CardContent>
              <PlanFeatures content={p.content} />
            </CardContent>
          </Card>
        </div>

        <Card className="lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>{t('checkout.summary')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {coupon ? (
              <div className="flex items-center justify-between rounded-md border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <TicketPercentIcon className="size-4 text-primary" />
                  {coupon.name}
                </span>
                <Button variant="ghost" size="icon" className="size-6" onClick={() => setCoupon(null)} aria-label={t('common.remove')}>
                  <XIcon />
                </Button>
              </div>
            ) : (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (code.trim() && period) check.mutate({ code: code.trim(), plan_id: p.id, period })
                }}
              >
                <Input placeholder={t('checkout.couponPlaceholder')} value={code} onChange={(e) => setCode(e.target.value)} />
                <Button type="submit" variant="outline" disabled={!code.trim() || check.isPending}>
                  {t('checkout.apply')}
                </Button>
              </form>
            )}
            <Separator />
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('checkout.subtotal')}</dt>
                <dd className="tabular-nums">{formatMoney(price, currency)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <dt>{t('checkout.discount')}</dt>
                  <dd className="tabular-nums">-{formatMoney(discount, currency)}</dd>
                </div>
              )}
            </dl>
            <Separator />
            <div className="flex items-baseline justify-between">
              <span className="font-medium">{t('checkout.total')}</span>
              <span className="text-2xl font-semibold tabular-nums">{formatMoney(price - discount, currency)}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t('checkout.note')}</p>
            <Button
              className="w-full"
              size="lg"
              disabled={!period || save.isPending}
              onClick={() => period && save.mutate({ plan_id: p.id, period, coupon_code: coupon?.code })}
            >
              {save.isPending && <Loader2Icon className="animate-spin" />}
              {t('checkout.placeOrder')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
