import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/api/endpoints'
import type { AuthData } from '@/api/types'
import { useT } from '@/i18n'
import { auth } from '@/lib/auth'
import { AuthHeading, Field } from './shared'

export function LoginPage() {
  const t = useT()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSuccess = (data: AuthData) => {
    auth.set(data.auth_data)
    // 只允許站內相對路徑，避免開放跳轉
    const redirect = params.get('redirect')
    navigate(redirect && /^[a-z0-9/_-]+$/i.test(redirect) ? `/${redirect.replace(/^\/+/, '')}` : '/dashboard', { replace: true })
  }
  const onError = (e: Error) => toast.error(e.message)
  const login = useMutation({ mutationFn: api.login, onSuccess, onError })
  const tokenLogin = useMutation({ mutationFn: api.token2Login, onSuccess, onError })

  // 郵件快捷登入連結：/#/login?verify=xxx
  const verify = params.get('verify')
  const handled = useRef(false)
  useEffect(() => {
    if (verify && !handled.current) {
      handled.current = true
      tokenLogin.mutate(verify)
    }
  }, [verify, tokenLogin])

  const pending = login.isPending || tokenLogin.isPending
  return (
    <>
      <AuthHeading title={t('auth.loginTitle')} description={t('auth.loginDesc')} />
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          login.mutate({ email: email.trim(), password })
        }}
      >
        <Field id="email" label={t('auth.email')}>
          <Input id="email" type="email" autoComplete="username" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field
          id="password"
          label={t('auth.password')}
          extra={
            <Link to="/forget" className="text-xs text-muted-foreground hover:text-foreground">
              {t('auth.forgot')}
            </Link>
          }
        >
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <Button type="submit" className="mt-2 w-full" disabled={pending}>
          {pending && <Loader2Icon className="animate-spin" />}
          {t('auth.login')}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          {t('auth.register')}
        </Link>
      </p>
    </>
  )
}
