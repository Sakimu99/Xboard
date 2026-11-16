import { useState, type ReactNode } from 'react'
import { images } from '@/lib/images'

/** 儀表盤頂部的萌系橫幅：右側為插畫，左側漸層承載歡迎文字 */
export function WelcomeBanner({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  const [failed, setFailed] = useState(false)
  const src = images.banner()
  return (
    <div className="spotlight relative mb-6 overflow-hidden rounded-3xl border bg-card shadow-[0_12px_40px_-16px_color-mix(in_oklch,var(--primary)_45%,transparent)] backdrop-blur-xl">
      {src && !failed && (
        <img src={src} alt="" onError={() => setFailed(true)} className="absolute inset-y-0 right-0 h-full w-full object-cover opacity-30 sm:w-3/5 sm:opacity-100" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-card/0 sm:via-card/80" />
      <div className="relative flex min-h-40 flex-col justify-center gap-2 p-6 sm:min-h-44 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          <span className="text-gradient">{title}</span>
        </h1>
        {subtitle && <p className="max-w-md text-sm text-muted-foreground">{subtitle}</p>}
        {children && <div className="mt-2 flex flex-wrap gap-2">{children}</div>}
      </div>
    </div>
  )
}
