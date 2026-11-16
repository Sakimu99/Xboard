import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, LifeBuoyIcon, Loader2Icon, PlusIcon, SendIcon } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { EmptyState, QueryError } from '@/components/query-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/api/endpoints'
import { keys } from '@/api/queries'
import type { Ticket } from '@/api/types'
import { useT, type MessageKey } from '@/i18n'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

const LEVELS: MessageKey[] = ['ticket.level.low', 'ticket.level.medium', 'ticket.level.high']

function statusOf(tk: Ticket): { label: MessageKey; variant: 'secondary' | 'warning' | 'success' } {
  if (tk.status === 1) return { label: 'ticket.status.closed', variant: 'secondary' }
  return tk.reply_status === 1 ? { label: 'ticket.status.replied', variant: 'success' } : { label: 'ticket.status.waiting', variant: 'warning' }
}

function NewTicketDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useT()
  const qc = useQueryClient()
  const [subject, setSubject] = useState('')
  const [level, setLevel] = useState('1')
  const [message, setMessage] = useState('')
  const create = useMutation({
    mutationFn: api.createTicket,
    onSuccess: () => {
      toast.success(t('ticket.created'))
      onOpenChange(false)
      setSubject('')
      setMessage('')
      qc.invalidateQueries({ queryKey: ['user', 'tickets'] })
      qc.invalidateQueries({ queryKey: keys.stat })
    },
    onError: (e) => toast.error(e.message),
  })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('ticket.new')}</DialogTitle>
          <DialogDescription>{t('ticket.newDesc')}</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            create.mutate({ subject: subject.trim(), level: Number(level), message: message.trim() })
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="subject">{t('ticket.subject')}</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label>{t('ticket.level')}</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((l, i) => (
                  <SelectItem key={l} value={String(i)}>
                    {t(l)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">{t('ticket.message')}</Label>
            <Textarea id="message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2Icon className="animate-spin" />}
              {t('common.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function TicketsPage() {
  const t = useT()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const tickets = useQuery({ queryKey: ['user', 'tickets'], queryFn: api.tickets })

  return (
    <>
      <PageHeader
        title={t('ticket.title')}
        description={t('ticket.desc')}
        actions={
          <Button onClick={() => setOpen(true)}>
            <PlusIcon />
            {t('ticket.new')}
          </Button>
        }
      />
      {tickets.error ? (
        <QueryError error={tickets.error} onRetry={() => tickets.refetch()} />
      ) : tickets.isLoading ? (
        <Skeleton className="h-60 rounded-xl" />
      ) : !tickets.data?.length ? (
        <EmptyState icon={<LifeBuoyIcon />} title={t('ticket.empty')} description={t('ticket.emptyDesc')} />
      ) : (
        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t('ticket.subject')}</TableHead>
                <TableHead>{t('ticket.level')}</TableHead>
                <TableHead>{t('orders.status')}</TableHead>
                <TableHead>{t('orders.createdAt')}</TableHead>
                <TableHead>{t('ticket.lastReply')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.data.map((tk) => {
                const s = statusOf(tk)
                return (
                  <TableRow key={tk.id} className="cursor-pointer" onClick={() => navigate(`/tickets/${tk.id}`)}>
                    <TableCell className="max-w-72 truncate font-medium">{tk.subject}</TableCell>
                    <TableCell>{t(LEVELS[tk.level] ?? LEVELS[0])}</TableCell>
                    <TableCell>
                      <Badge variant={s.variant}>{t(s.label)}</Badge>
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{formatDate(tk.created_at, true)}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{formatDate(tk.updated_at, true)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
      <NewTicketDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

export function TicketDetailPage() {
  const t = useT()
  const qc = useQueryClient()
  const id = Number(useParams().id)
  const [reply, setReply] = useState('')
  const ticket = useQuery({ queryKey: ['user', 'ticket', id], queryFn: () => api.ticket(id), enabled: !!id, refetchInterval: 15_000 })
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['user', 'ticket', id] })
    qc.invalidateQueries({ queryKey: ['user', 'tickets'] })
  }
  const send = useMutation({
    mutationFn: api.replyTicket,
    onSuccess: () => {
      setReply('')
      refresh()
    },
    onError: (e) => toast.error(e.message),
  })
  const close = useMutation({
    mutationFn: () => api.closeTicket(id),
    onSuccess: () => {
      toast.success(t('ticket.closedDone'))
      refresh()
    },
    onError: (e) => toast.error(e.message),
  })

  if (ticket.error) return <QueryError error={ticket.error} onRetry={() => ticket.refetch()} />
  if (ticket.isLoading || !ticket.data) return <Skeleton className="h-96 rounded-xl" />
  const tk = ticket.data
  const s = statusOf(tk)
  const closed = tk.status === 1

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 text-muted-foreground">
        <Link to="/tickets">
          <ArrowLeftIcon />
          {t('ticket.back')}
        </Link>
      </Button>
      <PageHeader
        title={tk.subject}
        description={`${t(LEVELS[tk.level] ?? LEVELS[0])} · ${formatDate(tk.created_at, true)}`}
        actions={
          <>
            <Badge variant={s.variant} className="h-8 px-3 text-sm">
              {t(s.label)}
            </Badge>
            {!closed && (
              <Button size="sm" variant="outline" disabled={close.isPending} onClick={() => close.mutate()}>
                {t('ticket.close')}
              </Button>
            )}
          </>
        }
      />
      <Card className="gap-0 py-0">
        <div className="flex max-h-[60svh] flex-col gap-4 overflow-y-auto p-5">
          {(tk.message ?? []).map((m) => {
            const mine = !!m.is_me
            return (
              <div key={m.id} className={cn('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap shadow-sm',
                    mine ? 'rounded-br-md bg-gradient-brand text-primary-foreground' : 'rounded-bl-md border bg-card',
                  )}
                >
                  {m.message}
                </div>
                <span className="px-1 text-xs text-muted-foreground">
                  {mine ? t('ticket.me') : t('ticket.staff')} · {formatDate(m.created_at, true)}
                </span>
              </div>
            )
          })}
        </div>
        {!closed && (
          <form
            className="flex items-end gap-2 border-t p-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (reply.trim()) send.mutate({ id, message: reply.trim() })
            }}
          >
            <Textarea
              className="min-h-11 flex-1 resize-none"
              rows={2}
              placeholder={t('ticket.replyPlaceholder')}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit()
              }}
            />
            <Button type="submit" size="icon" className="size-11" disabled={!reply.trim() || send.isPending} aria-label={t('ticket.send')}>
              {send.isPending ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
            </Button>
          </form>
        )}
      </Card>
    </>
  )
}
