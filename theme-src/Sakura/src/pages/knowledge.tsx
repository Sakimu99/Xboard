import { useDeferredValue, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpenIcon, ChevronRightIcon, SearchIcon } from 'lucide-react'
import { Markdown } from '@/components/markdown'
import { PageHeader } from '@/components/page-header'
import { EmptyState, QueryError } from '@/components/query-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/api/endpoints'
import { useLanguage, useT } from '@/i18n'
import { formatDate } from '@/lib/format'

function ArticleDialog({ id, onClose }: { id: number | null; onClose: () => void }) {
  const t = useT()
  const article = useQuery({ queryKey: ['user', 'article', id], queryFn: () => api.article(id!), enabled: id !== null })
  return (
    <Dialog open={id !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88svh] grid-rows-[auto_1fr] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{article.data?.title ?? t('common.loading')}</DialogTitle>
          {article.data && <DialogDescription>{t('knowledge.updatedAt', { date: formatDate(article.data.updated_at) })}</DialogDescription>}
        </DialogHeader>
        <div className="-mx-6 overflow-y-auto px-6 pb-2">
          {article.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5" />
              <Skeleton className="h-5 w-5/6" />
            </div>
          ) : article.error ? (
            <QueryError error={article.error} />
          ) : (
            <Markdown source={article.data?.body ?? ''} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function KnowledgePage() {
  const t = useT()
  const lang = useLanguage()
  const [keyword, setKeyword] = useState('')
  const deferred = useDeferredValue(keyword.trim())
  const [active, setActive] = useState<number | null>(null)
  const list = useQuery({ queryKey: ['user', 'knowledge', lang, deferred], queryFn: () => api.knowledge(lang, deferred) })
  const groups = list.data && !Array.isArray(list.data) ? Object.entries(list.data) : []

  return (
    <>
      <PageHeader
        title={t('knowledge.title')}
        description={t('knowledge.desc')}
        actions={
          <div className="relative w-full sm:w-64">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="rounded-full pl-9" placeholder={t('knowledge.search')} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
        }
      />
      {list.error ? (
        <QueryError error={list.error} onRetry={() => list.refetch()} />
      ) : list.isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState icon={<BookOpenIcon />} title={t('knowledge.empty')} />
      ) : (
        <div className="grid items-start gap-6 md:grid-cols-2">
          {groups.map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-gradient-brand shadow-[0_0_10px_var(--primary)]" />
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                <ul>
                  {items.map((a) => (
                    <li key={a.id}>
                      <button
                        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent"
                        onClick={() => setActive(a.id)}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{a.title}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(a.updated_at)}</span>
                        </span>
                        <ChevronRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <ArticleDialog id={active} onClose={() => setActive(null)} />
    </>
  )
}
