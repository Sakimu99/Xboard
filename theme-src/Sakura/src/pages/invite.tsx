import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRightLeftIcon, BanknoteIcon, CopyIcon, PlusIcon, TicketIcon } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { QueryError } from '@/components/query-state'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api } from '@/api/endpoints'
import { keys, useCurrency, useUserConfig } from '@/api/queries'
import { useT } from '@/i18n'
import { settings } from '@/lib/settings'
import { copyText } from '@/lib/clipboard'
import { formatDate, formatMoney } from '@/lib/format'

const inviteUrl = (code: string) => `${window.location.origin}${settings.base_url}#/register?code=${encodeURIComponent(code)}`

function TransferDialog({ open, onOpenChange, max }: { open: boolean; onOpenChange: (o: boolean) => void; max: number }) {
  const t = useT()
  const currency = useCurrency()
  const qc = useQueryClient()
  const [amount, setAmount] = useState('')
  const transfer = useMutation({
    mutationFn: api.transfer,
    onSuccess: () => {
      toast.success(t('invite.transferDone'))
      onOpenChange(false)
      setAmount('')
      qc.invalidateQueries({ queryKey: ['user', 'invite'] })
      qc.invalidateQueries({ queryKey: keys.info })
    },
    onError: (e) => toast.error(e.message),
  })
  const cents = Math.round(Number(amount) * 100)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('invite.transfer')}</DialogTitle>
          <DialogDescription>{t('invite.transferDesc', { amount: formatMoney(max, currency) })}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="amount">{t('invite.amount')}</Label>
          <Input id="amount" type="number" min="0.01" step="0.01" max={max / 100} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button disabled={!(cents > 0 && cents <= max) || transfer.isPending} onClick={() => transfer.mutate(cents)}>
            {t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function WithdrawDialog({ open, onOpenChange, methods }: { open: boolean; onOpenChange: (o: boolean) => void; methods: string[] }) {
  const t = useT()
  const [method, setMethod] = useState('')
  const [account, setAccount] = useState('')
  const withdraw = useMutation({
    mutationFn: api.withdraw,
    onSuccess: () => {
      toast.success(t('invite.withdrawDone'))
      onOpenChange(false)
      setAccount('')
    },
    onError: (e) => toast.error(e.message),
  })
  const current = method || methods[0] || ''
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('invite.withdraw')}</DialogTitle>
          <DialogDescription>{t('invite.withdrawDesc')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>{t('invite.withdrawMethod')}</Label>
            <Select value={current} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {methods.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="account">{t('invite.withdrawAccount')}</Label>
            <Input id="account" value={account} onChange={(e) => setAccount(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button disabled={!current || !account.trim() || withdraw.isPending} onClick={() => withdraw.mutate({ withdraw_method: current, withdraw_account: account.trim() })}>
            {t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CommissionLogs() {
  const t = useT()
  const currency = useCurrency()
  const [page, setPage] = useState(1)
  const logs = useQuery({ queryKey: ['user', 'commission', page], queryFn: () => api.commissionLogs(page) })
  const pages = Math.max(1, Math.ceil((logs.data?.total ?? 0) / 10))
  return (
    <Card className="gap-0 overflow-hidden pb-0">
      <CardHeader className="pb-4">
        <CardTitle>{t('invite.logs')}</CardTitle>
      </CardHeader>
      {logs.isLoading ? (
        <Skeleton className="mx-5 mb-5 h-24" />
      ) : !logs.data?.data.length ? (
        <p className="px-5 pb-8 text-center text-sm text-muted-foreground">{t('common.noData')}</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t('invite.logTime')}</TableHead>
                <TableHead>{t('orders.tradeNo')}</TableHead>
                <TableHead className="text-right">{t('invite.orderAmount')}</TableHead>
                <TableHead className="text-right">{t('invite.commission')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.data.data.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="tabular-nums">{formatDate(l.created_at, true)}</TableCell>
                  <TableCell className="font-mono text-xs">{l.trade_no}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(l.order_amount, currency)}</TableCell>
                  <TableCell className="text-right font-medium text-success tabular-nums">+{formatMoney(l.get_amount, currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pages > 1 && (
            <div className="flex items-center justify-end gap-2 border-t px-5 py-3 text-sm">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                {t('common.prev')}
              </Button>
              <span className="tabular-nums text-muted-foreground">
                {page} / {pages}
              </span>
              <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                {t('common.next')}
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

export function InvitePage() {
  const t = useT()
  const currency = useCurrency()
  const qc = useQueryClient()
  const config = useUserConfig()
  const invite = useQuery({ queryKey: ['user', 'invite'], queryFn: api.invite })
  const [transferOpen, setTransferOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const create = useMutation({
    mutationFn: api.createInviteCode,
    onSuccess: () => {
      toast.success(t('invite.codeCreated'))
      qc.invalidateQueries({ queryKey: ['user', 'invite'] })
    },
    onError: (e) => toast.error(e.message),
  })

  if (invite.error) return <QueryError error={invite.error} onRetry={() => invite.refetch()} />
  const [registered = 0, totalCommission = 0, pending = 0, rate = 0, available = 0] = invite.data?.stat ?? []
  const copy = async (code: string) => {
    if (await copyText(inviteUrl(code))) toast.success(t('common.copied'))
    else toast.error(t('common.copyFailed'))
  }
  const withdrawMethods = config.data?.withdraw_methods ?? []
  const canWithdraw = !config.data?.withdraw_close && withdrawMethods.length > 0

  return (
    <>
      <PageHeader title={t('invite.title')} description={t('invite.desc')} />
      {invite.isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <Card className="overflow-hidden">
              <div className="absolute -top-16 -right-10 -z-10 size-48 rounded-full bg-gradient-brand opacity-25 blur-3xl" />
              <CardHeader>
                <CardDescription>{t('invite.available')}</CardDescription>
                <CardTitle className="text-4xl tabular-nums">
                  <span className="text-gradient">{formatMoney(available, currency)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button size="sm" disabled={available <= 0} onClick={() => setTransferOpen(true)}>
                  <ArrowRightLeftIcon />
                  {t('invite.transfer')}
                </Button>
                {canWithdraw && (
                  <Button size="sm" variant="outline" onClick={() => setWithdrawOpen(true)}>
                    <BanknoteIcon />
                    {t('invite.withdraw')}
                  </Button>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <dl className="grid grid-cols-2 gap-5">
                  {[
                    [t('invite.registered'), t('invite.people', { count: registered })],
                    [t('invite.rate'), `${rate}%`],
                    [t('invite.pending'), formatMoney(pending, currency)],
                    [t('invite.total'), formatMoney(totalCommission, currency)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </div>

          <Card className="gap-0 overflow-hidden pb-0">
            <CardHeader className="pb-4">
              <CardTitle>{t('invite.codes')}</CardTitle>
              <CardDescription>{t('invite.codesDesc')}</CardDescription>
              <CardAction>
                <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending}>
                  <PlusIcon />
                  {t('invite.createCode')}
                </Button>
              </CardAction>
            </CardHeader>
            {!invite.data?.codes.length ? (
              <div className="flex flex-col items-center gap-2 px-5 pb-8 text-sm text-muted-foreground">
                <TicketIcon className="size-6" />
                {t('invite.noCodes')}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>{t('invite.code')}</TableHead>
                    <TableHead>{t('invite.link')}</TableHead>
                    <TableHead>{t('orders.createdAt')}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invite.data.codes.map((c) => (
                    <TableRow key={c.code}>
                      <TableCell className="font-mono font-medium">{c.code}</TableCell>
                      <TableCell className="max-w-64 truncate text-muted-foreground">{inviteUrl(c.code)}</TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => copy(c.code)}>
                          <CopyIcon />
                          {t('invite.copyLink')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <CommissionLogs />
        </div>
      )}
      <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} max={available} />
      <WithdrawDialog open={withdrawOpen} onOpenChange={setWithdrawOpen} methods={withdrawMethods} />
    </>
  )
}
