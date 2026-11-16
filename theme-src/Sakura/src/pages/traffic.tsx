import { useQuery } from '@tanstack/react-query'
import { ChartColumnIcon } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { EmptyState, QueryError } from '@/components/query-state'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api } from '@/api/endpoints'
import type { TrafficLog } from '@/api/types'
import { useT } from '@/i18n'
import { formatBytes, formatDate } from '@/lib/format'

const charged = (r: TrafficLog) => (Number(r.u) + Number(r.d)) * Number(r.server_rate || 1)

/** 按日期彙總計費流量，用於柱狀圖 */
function byDay(logs: TrafficLog[]) {
  const map = new Map<string, number>()
  logs.forEach((r) => {
    const day = formatDate(r.record_at)
    map.set(day, (map.get(day) ?? 0) + charged(r))
  })
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
}

export function TrafficPage() {
  const t = useT()
  const logs = useQuery({ queryKey: ['user', 'traffic'], queryFn: api.trafficLog })
  const list = logs.data ?? []
  const days = byDay(list)
  const max = Math.max(1, ...days.map(([, v]) => v))
  const total = days.reduce((s, [, v]) => s + v, 0)

  return (
    <>
      <PageHeader title={t('traffic.title')} description={t('traffic.desc')} />
      {logs.error ? (
        <QueryError error={logs.error} onRetry={() => logs.refetch()} />
      ) : logs.isLoading ? (
        <Skeleton className="h-80 rounded-xl" />
      ) : list.length === 0 ? (
        <EmptyState icon={<ChartColumnIcon />} title={t('traffic.empty')} />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardDescription>{t('traffic.monthTotal')}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                <span className="text-gradient">{formatBytes(total)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-40 items-end gap-1.5">
                {days.map(([day, v]) => (
                  <div key={day} className="group relative flex h-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-primary/50 to-primary-2 transition-all group-hover:brightness-125"
                      style={{ height: `${Math.max(3, (v / max) * 100)}%` }}
                    />
                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md border bg-popover px-2 py-1 text-xs whitespace-nowrap opacity-0 shadow-lg backdrop-blur-xl transition-opacity group-hover:opacity-100">
                      {day.slice(5)} · {formatBytes(v)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden py-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t('traffic.date')}</TableHead>
                  <TableHead className="text-right">{t('traffic.upload')}</TableHead>
                  <TableHead className="text-right">{t('traffic.download')}</TableHead>
                  <TableHead className="text-right">{t('traffic.rate')}</TableHead>
                  <TableHead className="text-right">{t('traffic.total')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="tabular-nums">{formatDate(r.record_at)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBytes(r.u)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBytes(r.d)}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(r.server_rate)}x</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatBytes(charged(r))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </>
  )
}
