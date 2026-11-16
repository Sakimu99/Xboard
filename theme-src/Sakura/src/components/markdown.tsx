import { useMemo } from 'react'
import { marked } from 'marked'
import { cn } from '@/lib/utils'

/** 渲染後台維護的文檔（Markdown，允許內嵌 HTML） */
export function Markdown({ source, className }: { source: string; className?: string }) {
  const html = useMemo(() => marked.parse(source ?? '', { async: false, gfm: true, breaks: true }), [source])
  return <div className={cn('markdown', className)} dangerouslySetInnerHTML={{ __html: html }} />
}
