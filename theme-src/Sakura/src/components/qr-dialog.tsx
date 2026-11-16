import type { ReactNode } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function QrDialog({
  open,
  onOpenChange,
  value,
  title,
  description,
  footer,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: string
  title: string
  description?: string
  footer?: ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="mx-auto rounded-lg border bg-white p-4">
          <QRCodeSVG value={value} size={208} marginSize={0} />
        </div>
        {footer}
      </DialogContent>
    </Dialog>
  )
}
