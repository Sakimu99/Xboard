import { useState } from 'react'
import { images } from '@/lib/images'
import { cn } from '@/lib/utils'

/** 白底 Q 版貼圖，以 multiply 混合讓白底融入粉白背景；載入失敗時隱藏 */
export function Sticker({ slot, className }: { slot: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  const src = images.sticker(slot)
  if (!src || failed) return null
  return <img src={src} alt="" aria-hidden loading="lazy" draggable={false} onError={() => setFailed(true)} className={cn('pointer-events-none object-contain mix-blend-multiply select-none', className)} />
}
