import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCaptcha } from '@/components/captcha'
import { api } from '@/api/endpoints'
import { useGuestConfig } from '@/api/queries'
import { useT } from '@/i18n'
import { AuthHeading, EmailCodeField, Field } from './shared'

export function ForgetPage() {
  const t = useT()
  const navigate = useNavigate()
  const { data: config } = useGuestConfig()
  const captcha = useCaptcha(config)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const reset = useMutation({
    mutationFn: api.forget,
    onSuccess: () => {
      toast.success(t('auth.resetDone'))
      navigate('/login', { replace: true })
    },
    onError: (e) => toast.error(e.message),
  })

  return (
    <>
      <AuthHeading title={t('auth.forgetTitle')} description={t('auth.forgetDesc')} />
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (password !== confirm) return toast.error(t('auth.passwordMismatch'))
          reset.mutate({ email: email.trim(), email_code: code, password })
        }}
      >
        <Field id="email" label={t('auth.email')}>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        {captcha.element}
        <EmailCodeField value={code} onChange={setCode} email={email.trim()} getCaptcha={captcha.getParams} onSent={captcha.reset} />
        <Field id="password" label={t('auth.newPassword')}>
          <Input id="password" type="password" autoComplete="new-password" minLength={8} placeholder={t('auth.passwordHint')} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <Field id="confirm" label={t('auth.confirmPassword')}>
          <Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </Field>
        <Button type="submit" className="mt-2 w-full" disabled={reset.isPending}>
          {reset.isPending && <Loader2Icon className="animate-spin" />}
          {t('auth.resetPassword')}
        </Button>
      </form>
      <Button variant="link" asChild className="mt-4 w-full text-muted-foreground">
        <Link to="/login">
          <ArrowLeftIcon />
          {t('auth.backToLogin')}
        </Link>
      </Button>
    </>
  )
}
