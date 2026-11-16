import { AlertCircleIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Sticker } from '@/components/sticker'
import { useT } from '@/i18n'
import { settings } from '@/lib/settings'

export function QueryError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const t = useT()
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>{t('common.loadFailed')}</AlertTitle>
      <AlertDescription className="text-destructive/80">
        <span>{error instanceof Error ? error.message : String(error)}</span>
        {onRetry && (
          <Button size="sm" variant="outline" className="mt-2" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

export function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/50 px-6 py-12 text-center backdrop-blur">
      {settings.sticker_url ? (
        <Sticker slot={`empty-${title}`} className="size-32" />
      ) : (
        <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-5">{icon}</div>
      )}
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}
