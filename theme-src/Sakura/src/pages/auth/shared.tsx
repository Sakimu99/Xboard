import type { ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/api/endpoints'
import { useCountdown } from '@/hooks/use-countdown'
import { useT } from '@/i18n'

export function AuthHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6 space-y-1.5">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}

export function Field({ id, label, children, extra }: { id: string; label: string; children: ReactNode; extra?: ReactNode }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {extra}
      </div>
      {children}
    </div>
  )
}

/** 郵箱驗證碼輸入框 + 發送按鈕（含 60 秒冷卻） */
export function EmailCodeField({
  value,
  onChange,
  email,
  getCaptcha,
  onSent,
}: {
  value: string
  onChange: (v: string) => void
  email: string
  getCaptcha: () => Promise<Record<string, string> | null>
  onSent?: () => void
}) {
  const t = useT()
  const [left, setLeft] = useCountdown()
  const send = useMutation({ mutationFn: api.sendEmailCode })

  const onSend = async () => {
    if (!email) return toast.error(t('auth.emailRequired'))
    const captcha = await getCaptcha()
    if (!captcha) return toast.error(t('auth.captchaRequired'))
    send.mutate(
      { email, ...captcha },
      {
        onSuccess: () => {
          toast.success(t('auth.codeSent'))
          setLeft(60)
        },
        onError: (e) => toast.error(e.message),
        // 驗證碼 token 只能使用一次，發送後重置
        onSettled: () => onSent?.(),
      },
    )
  }

  return (
    <Field id="email_code" label={t('auth.emailCode')}>
      <div className="flex gap-2">
        <Input id="email_code" inputMode="numeric" maxLength={6} value={value} onChange={(e) => onChange(e.target.value)} required />
        <Button type="button" variant="outline" className="w-28 shrink-0" disabled={left > 0 || send.isPending} onClick={onSend}>
          {left > 0 ? `${left}s` : t('auth.sendCode')}
        </Button>
      </div>
    </Field>
  )
}
