import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { QueryError } from '@/components/query-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { api } from '@/api/endpoints'
import { keys, useCurrency, useUserInfo } from '@/api/queries'
import type { UserInfo } from '@/api/types'
import { useT, type MessageKey } from '@/i18n'
import { auth } from '@/lib/auth'
import { formatDate, formatMoney } from '@/lib/format'

function PasswordCard() {
  const t = useT()
  const [oldPassword, setOld] = useState('')
  const [newPassword, setNew] = useState('')
  const [confirm, setConfirm] = useState('')
  const change = useMutation({
    mutationFn: api.changePassword,
    onSuccess: () => {
      toast.success(t('profile.passwordChanged'))
      setOld('')
      setNew('')
      setConfirm('')
    },
    onError: (e) => toast.error(e.message),
  })
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profile.password')}</CardTitle>
        <CardDescription>{t('profile.passwordDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:max-w-sm"
          onSubmit={(e) => {
            e.preventDefault()
            if (newPassword !== confirm) return toast.error(t('auth.passwordMismatch'))
            change.mutate({ old_password: oldPassword, new_password: newPassword })
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="old">{t('profile.oldPassword')}</Label>
            <Input id="old" type="password" autoComplete="current-password" value={oldPassword} onChange={(e) => setOld(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new">{t('auth.newPassword')}</Label>
            <Input id="new" type="password" autoComplete="new-password" minLength={8} placeholder={t('auth.passwordHint')} value={newPassword} onChange={(e) => setNew(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm">{t('auth.confirmPassword')}</Label>
            <Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <Button type="submit" className="w-fit" disabled={change.isPending}>
            {change.isPending && <Loader2Icon className="animate-spin" />}
            {t('common.save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function NotifyCard({ info }: { info: UserInfo }) {
  const t = useT()
  const qc = useQueryClient()
  const update = useMutation({
    mutationFn: api.updateUser,
    onSuccess: () => {
      toast.success(t('common.saved'))
      qc.invalidateQueries({ queryKey: keys.info })
    },
    onError: (e) => toast.error(e.message),
  })
  const items: { field: 'remind_expire' | 'remind_traffic'; label: MessageKey; desc: MessageKey }[] = [
    { field: 'remind_expire', label: 'profile.remindExpire', desc: 'profile.remindExpireDesc' },
    { field: 'remind_traffic', label: 'profile.remindTraffic', desc: 'profile.remindTrafficDesc' },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profile.notifications')}</CardTitle>
        <CardDescription>{t('profile.notificationsDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        {items.map((it) => (
          <div key={it.field} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div className="space-y-0.5">
              <Label htmlFor={it.field}>{t(it.label)}</Label>
              <p className="text-sm text-muted-foreground">{t(it.desc)}</p>
            </div>
            <Switch
              id={it.field}
              checked={!!info[it.field]}
              disabled={update.isPending}
              onCheckedChange={(v) => update.mutate({ [it.field]: v ? 1 : 0 })}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function ProfilePage() {
  const t = useT()
  const currency = useCurrency()
  const qc = useQueryClient()
  const info = useUserInfo()

  if (info.error) return <QueryError error={info.error} onRetry={() => info.refetch()} />
  const u = info.data

  return (
    <>
      <PageHeader title={t('profile.title')} description={t('profile.desc')} />
      <div className="grid items-start gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardContent className="space-y-5">
            {!u ? (
              <Skeleton className="h-48" />
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <img src={u.avatar_url} alt="" className="size-12 rounded-full bg-muted" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{u.email}</p>
                    <p className="text-xs text-muted-foreground">{t('profile.joined', { date: formatDate(u.created_at) })}</p>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">{t('dashboard.balance')}</dt>
                    <dd className="mt-1 font-semibold tabular-nums">{formatMoney(u.balance, currency)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t('profile.commission')}</dt>
                    <dd className="mt-1 font-semibold tabular-nums">{formatMoney(u.commission_balance, currency)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">{t('profile.lastLogin')}</dt>
                    <dd className="mt-1 tabular-nums">{formatDate(u.last_login_at, true)}</dd>
                  </div>
                </dl>
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => {
                    auth.set(null)
                    qc.clear()
                  }}
                >
                  {t('auth.logout')}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
        <div className="space-y-6">
          {u && <NotifyCard info={u} />}
          <PasswordCard />
        </div>
      </div>
    </>
  )
}
