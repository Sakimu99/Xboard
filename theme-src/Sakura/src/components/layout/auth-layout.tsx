import { Navigate, Outlet } from 'react-router'
import { HeartIcon, SparklesIcon, ZapIcon } from 'lucide-react'
import { Backdrop } from '@/components/backdrop'
import { Brand } from '@/components/brand'
import { LanguageMenu } from '@/components/layout/preferences'
import { Sticker } from '@/components/sticker'
import { useT } from '@/i18n'
import { useAuthToken } from '@/lib/auth'
import { effectsOn } from '@/lib/effects'
import { settings } from '@/lib/settings'
import { cn } from '@/lib/utils'

export function AuthLayout() {
  const token = useAuthToken()
  const t = useT()
  // 帶 verify 參數的郵件登入連結需要留在登入頁處理
  const hasVerify = new URLSearchParams(window.location.hash.split('?')[1] ?? '').has('verify')
  if (token && !hasVerify) return <Navigate to="/dashboard" replace />

  const motion = effectsOn()
  const chips = [
    { icon: ZapIcon, label: t('auth.hero1') },
    { icon: SparklesIcon, label: t('auth.hero2') },
    { icon: HeartIcon, label: t('auth.hero3') },
  ]

  return (
    <div className="relative min-h-svh overflow-hidden">
      <Backdrop variant="hero" />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between p-4 sm:p-6">
        <div className="rounded-full border bg-card py-1.5 pr-4 pl-1.5 shadow-sm backdrop-blur-xl">
          <Brand />
        </div>
        <div className="rounded-full border bg-card p-1 shadow-sm backdrop-blur-xl">
          <LanguageMenu />
        </div>
      </header>

      {/* 左側為標語與表單，右側留給立繪角色 */}
      <main className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8 px-4 pt-2 pb-16 sm:px-6 lg:min-h-[calc(100svh-96px)] lg:justify-center lg:pt-0">
        <section className="hidden max-w-xl animate-fade-up lg:block">
          <h1 className="text-4xl leading-tight font-black tracking-tight xl:text-5xl">
            <span className={cn('text-gradient mr-3 text-6xl xl:text-7xl', motion && 'animate-shimmer')}>{settings.title}</span>
            <br />
            {settings.hero_title || t('auth.heroTitle')}
          </h1>
          <p className="mt-4 max-w-md text-base text-muted-foreground">{t('auth.heroDesc')}</p>
          <ul className="mt-6 flex flex-wrap gap-2.5">
            {chips.map(({ icon: Icon, label }, i) => (
              <li
                key={label}
                className={cn('flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-sm shadow-sm backdrop-blur-xl', motion && 'animate-float')}
                style={{ animationDelay: `${i * -2}s` }}
              >
                <Icon className="size-4 text-primary" />
                {label}
              </li>
            ))}
          </ul>
        </section>

        <section className="relative w-full max-w-md animate-fade-up self-center [animation-delay:120ms] lg:self-start">
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-brand opacity-25 blur-3xl" />
          <Sticker slot="auth" className={cn('absolute -top-20 right-2 z-10 size-28', motion && 'animate-float')} />
          <div className="rounded-3xl border bg-popover p-7 shadow-[0_20px_60px_-20px_color-mix(in_oklch,var(--primary)_45%,transparent)] backdrop-blur-2xl sm:p-8">
            <Outlet />
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {settings.title}
          </p>
        </section>
      </main>
    </div>
  )
}
