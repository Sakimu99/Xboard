import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useCaptcha } from '@/components/captcha'
import { api } from '@/api/endpoints'
import { useGuestConfig } from '@/api/queries'
import { useT } from '@/i18n'
import { auth } from '@/lib/auth'
import { AuthHeading, EmailCodeField, Field } from './shared'

export function RegisterPage() {
  const t = useT()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { data: config, isLoading } = useGuestConfig()
  const captcha = useCaptcha(config)

  const suffixes = Array.isArray(config?.email_whitelist_suffix) ? config.email_whitelist_suffix : null
  const [emailName, setEmailName] = useState('')
  const [suffix, setSuffix] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [code, setCode] = useState('')
  const [invite, setInvite] = useState(params.get('code') ?? '')
  const [agreed, setAgreed] = useState(false)

  const email = suffixes ? (emailName ? `${emailName}@${suffix || suffixes[0]}` : '') : emailName.trim()

  const register = useMutation({
    mutationFn: api.register,
    onSuccess: (data) => {
      auth.set(data.auth_data)
      navigate('/dashboard', { replace: true })
    },
    onError: (e) => {
      toast.error(e.message)
      captcha.reset()
    },
  })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return toast.error(t('auth.passwordMismatch'))
    if (config?.tos_url && !agreed) return toast.error(t('auth.tosRequired'))
    const c = await captcha.getParams()
    if (!c) return toast.error(t('auth.captchaRequired'))
    const body: Record<string, string> = { email, password, ...c }
    if (invite) body.invite_code = invite
    if (config?.is_email_verify) body.email_code = code
    register.mutate(body)
  }

  if (isLoading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9" />
        <Skeleton className="h-9" />
        <Skeleton className="h-9" />
      </div>
    )
  }

  return (
    <>
      <AuthHeading title={t('auth.registerTitle')} description={t('auth.registerDesc')} />
      <form className="grid gap-4" onSubmit={onSubmit}>
        <Field id="email" label={t('auth.email')}>
          {suffixes ? (
            <div className="flex gap-2">
              <Input id="email" value={emailName} onChange={(e) => setEmailName(e.target.value.replace(/@.*/, ''))} required />
              <Select value={suffix || suffixes[0]} onValueChange={setSuffix}>
                <SelectTrigger className="w-40 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {suffixes.map((s) => (
                    <SelectItem key={s} value={s}>
                      @{s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <Input id="email" type="email" autoComplete="email" placeholder="name@company.com" value={emailName} onChange={(e) => setEmailName(e.target.value)} required />
          )}
        </Field>
        {captcha.element}
        {!!config?.is_email_verify && (
          <EmailCodeField value={code} onChange={setCode} email={email} getCaptcha={captcha.getParams} onSent={captcha.reset} />
        )}
        <Field id="password" label={t('auth.password')}>
          <Input id="password" type="password" autoComplete="new-password" minLength={8} placeholder={t('auth.passwordHint')} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <Field id="confirm" label={t('auth.confirmPassword')}>
          <Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </Field>
        <Field id="invite" label={config?.is_invite_force ? t('auth.inviteCode') : `${t('auth.inviteCode')} (${t('common.optional')})`}>
          <Input id="invite" value={invite} onChange={(e) => setInvite(e.target.value)} required={!!config?.is_invite_force} />
        </Field>
        {config?.tos_url && (
          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>
              {t('auth.agree')}{' '}
              <a href={config.tos_url} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
                {t('auth.tos')}
              </a>
            </span>
          </label>
        )}
        <Button type="submit" className="mt-2 w-full" disabled={register.isPending}>
          {register.isPending && <Loader2Icon className="animate-spin" />}
          {t('auth.register')}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          {t('auth.login')}
        </Link>
      </p>
    </>
  )
}
