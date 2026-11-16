import { Link, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ReceiptTextIcon } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { EmptyState, QueryError } from '@/components/query-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api } from '@/api/endpoints'
import { keys, useCurrency } from '@/api/queries'
import { useT } from '@/i18n'
import { formatDate, formatMoney } from '@/lib/format'
import { ORDER_STATUS, ORDER_TYPE, periodLabel } from '@/lib/plan'

export function OrdersPage() {
  const t = useT()
  const currency = useCurrency()
  const navigate = useNavigate()
  const orders = useQuery({ queryKey: keys.orders, queryFn: api.orders })

  return (
    <>
      <PageHeader title={t('orders.title')} description={t('orders.desc')} />
      {orders.error ? (
        <QueryError error={orders.error} onRetry={() => orders.refetch()} />
      ) : orders.isLoading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : !orders.data?.length ? (
        <EmptyState
          icon={<ReceiptTextIcon />}
          title={t('orders.empty')}
          action={
            <Button asChild variant="outline">
              <Link to="/plans">{t('dashboard.browsePlans')}</Link>
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t('orders.tradeNo')}</TableHead>
                <TableHead>{t('orders.plan')}</TableHead>
                <TableHead>{t('orders.period')}</TableHead>
                <TableHead>{t('orders.type')}</TableHead>
                <TableHead className="text-right">{t('orders.amount')}</TableHead>
                <TableHead>{t('orders.status')}</TableHead>
                <TableHead>{t('orders.createdAt')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.data.map((o) => {
                const status = ORDER_STATUS[o.status]
                return (
                  <TableRow key={o.trade_no} className="cursor-pointer" onClick={() => navigate(`/orders/${o.trade_no}`)}>
                    <TableCell className="font-mono text-xs">{o.trade_no}</TableCell>
                    <TableCell className="font-medium">{o.plan?.name ?? '-'}</TableCell>
                    <TableCell>{t(periodLabel(o.period))}</TableCell>
                    <TableCell className="text-muted-foreground">{t(ORDER_TYPE[o.type])}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(o.total_amount, currency)}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{t(status.label)}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{formatDate(o.created_at, true)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  )
}
