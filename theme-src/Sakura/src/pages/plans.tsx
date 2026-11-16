import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { PackageIcon } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { PlanFeatures } from '@/components/plan-features'
import { EmptyState, QueryError } from '@/components/query-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/api/endpoints'
import { useCurrency, useSubscribe } from '@/api/queries'
import type { Plan } from '@/api/types'
import { useT } from '@/i18n'
import { formatMoney } from '@/lib/format'
import { startingPrice } from '@/lib/plan'
import { cn } from '@/lib/utils'

function PlanCard({ plan, current }: { plan: Plan; current: boolean }) {
  const t = useT()
  const currency = useCurrency()
  const start = startingPrice(plan)
  const soldOut = typeof plan.capacity_limit === 'string'
  return (
    <Card className={cn('relative', current && 'border-primary ring-1 ring-primary')}>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg">{plan.name}</CardTitle>
          {current && <Badge>{t('plans.current')}</Badge>}
          {plan.tags?.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        <CardDescription className="flex flex-wrap gap-x-3">
          <span>{plan.transfer_enable} GB</span>
          <span>{plan.device_limit ? t('plans.devices', { count: plan.device_limit }) : t('plans.unlimitedDevices')}</span>
          {plan.speed_limit ? <span>{plan.speed_limit} Mbps</span> : null}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {start ? (
          <p className="flex items-baseline gap-1">
            <span className="text-3xl font-semibold tabular-nums tracking-tight">{formatMoney(start.price, currency)}</span>
            <span className="text-sm text-muted-foreground">/ {t(start.period.label)}</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">-</p>
        )}
      </CardContent>
      <Separator />
      <CardContent className="flex-1">
        <PlanFeatures content={plan.content} />
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant={current ? 'default' : 'outline'} disabled={soldOut || !start} asChild={!soldOut && !!start}>
          {soldOut ? <span>{t('plans.soldOut')}</span> : <Link to={`/plans/${plan.id}`}>{current ? t('plans.renew') : t('plans.choose')}</Link>}
        </Button>
      </CardFooter>
    </Card>
  )
}

export function PlansPage() {
  const t = useT()
  const plans = useQuery({ queryKey: ['user', 'plans'], queryFn: api.plans })
  const sub = useSubscribe()

  return (
    <>
      <PageHeader title={t('plans.title')} description={t('plans.desc')} />
      {plans.error ? (
        <QueryError error={plans.error} onRetry={() => plans.refetch()} />
      ) : plans.isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-96 rounded-xl" />
          ))}
        </div>
      ) : !plans.data?.length ? (
        <EmptyState icon={<PackageIcon />} title={t('plans.empty')} />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {plans.data.map((p) => (
            <PlanCard key={p.id} plan={p} current={sub.data?.plan_id === p.id} />
          ))}
        </div>
      )}
    </>
  )
}
