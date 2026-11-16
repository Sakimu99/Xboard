import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ServerOffIcon } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { EmptyState, QueryError } from '@/components/query-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/api/endpoints'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'

export function NodesPage() {
  const t = useT()
  const servers = useQuery({ queryKey: ['user', 'servers'], queryFn: api.servers, refetchInterval: 60_000 })
  const list = servers.data ?? []
  const online = list.filter((s) => !!s.is_online).length

  return (
    <>
      <PageHeader title={t('nodes.title')} description={list.length ? t('nodes.summary', { online, total: list.length }) : t('nodes.desc')} />
      {servers.error ? (
        <QueryError error={servers.error} onRetry={() => servers.refetch()} />
      ) : servers.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<ServerOffIcon />}
          title={t('nodes.empty')}
          description={t('nodes.emptyDesc')}
          action={
            <Button asChild>
              <Link to="/plans">{t('dashboard.browsePlans')}</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((s) => {
            const up = !!s.is_online
            return (
              <Card key={`${s.type}-${s.id}`} className="gap-3 py-4 transition-transform hover:-translate-y-0.5">
                <div className="flex items-start gap-3 px-4">
                  <span className="relative mt-1.5 flex size-2.5 shrink-0">
                    {up && <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />}
                    <span className={cn('relative inline-flex size-2.5 rounded-full', up ? 'bg-success' : 'bg-destructive')} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{up ? t('nodes.online') : t('nodes.offline')}</p>
                  </div>
                  <Badge className="font-mono">{Number(s.rate)}x</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 px-4">
                  <Badge variant="secondary" className="uppercase">
                    {s.type}
                  </Badge>
                  {s.tags?.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
