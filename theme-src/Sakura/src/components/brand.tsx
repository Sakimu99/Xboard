import { settings } from '@/lib/settings'
import { cn } from '@/lib/utils'

export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      {settings.logo ? (
        <img src={settings.logo} alt="" className="size-8 shrink-0 rounded-full object-contain" />
      ) : (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-primary-foreground shadow-[0_0_16px_-2px_var(--primary)]">
          {settings.title.slice(0, 1).toUpperCase()}
        </div>
      )}
      <span className="truncate text-base font-bold tracking-tight">{settings.title}</span>
    </div>
  )
}
