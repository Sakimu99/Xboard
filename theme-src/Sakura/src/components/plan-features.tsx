import { CheckIcon, XIcon } from 'lucide-react'
import { parseContent } from '@/lib/plan'
import { cn } from '@/lib/utils'

export function PlanFeatures({ content, className }: { content: string; className?: string }) {
  const parsed = parseContent(content)
  if ('html' in parsed) {
    // 內容由管理員在後台維護
    return <div className={cn('prose-sm text-sm text-muted-foreground [&_li]:my-1 [&_ul]:list-disc [&_ul]:pl-4', className)} dangerouslySetInnerHTML={{ __html: parsed.html }} />
  }
  return (
    <ul className={cn('space-y-2.5 text-sm', className)}>
      {parsed.features.map((f, i) => (
        <li key={i} className={cn('flex items-start gap-2.5', !f.ok && 'text-muted-foreground line-through decoration-muted-foreground/40')}>
          {f.ok ? <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" /> : <XIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
          <span>{f.text}</span>
        </li>
      ))}
    </ul>
  )
}
