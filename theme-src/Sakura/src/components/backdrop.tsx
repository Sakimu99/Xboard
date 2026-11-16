import { SakuraCanvas } from '@/components/sakura-canvas'
import { effectsOn, petalsOn } from '@/lib/effects'
import { images } from '@/lib/images'
import { cn } from '@/lib/utils'

/**
 * 全站背景：奶白底 + 粉色光暈 + 細網格 + 立繪 + 櫻花
 * 立繪是白底圖，用 multiply 混合讓白色融進背景，只留下角色
 * variant="hero" 用於登入頁（立繪鋪滿）；"app" 用於控制台（立繪站在右下角）
 */
export function Backdrop({ variant = 'app' }: { variant?: 'app' | 'hero' }) {
  const standee = images.standee(variant)
  const motion = effectsOn()
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background">
      <div className={cn('absolute -top-1/3 -left-1/4 size-[70vmax] rounded-full bg-primary/15 blur-[120px]', motion && 'animate-aurora')} />
      <div className={cn('absolute -right-1/4 -bottom-1/3 size-[60vmax] rounded-full bg-primary-2/25 blur-[120px]', motion && 'animate-aurora')} style={{ animationDelay: '-11s' }} />
      <div
        className="absolute inset-0 text-primary opacity-[0.07]"
        style={{
          backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 80%)',
        }}
      />
      {standee &&
        (variant === 'hero' ? (
          <>
            <img src={standee} alt="" className="absolute inset-0 size-full object-cover object-right mix-blend-multiply" />
            {/* 手機上角色會被表單擋住，整體淡化 */}
            <div className="absolute inset-0 bg-background/60 lg:bg-transparent" />
          </>
        ) : (
          <img
            src={standee}
            alt=""
            className="absolute right-0 bottom-0 hidden h-[82vh] w-[60vw] object-cover object-right-bottom opacity-70 mix-blend-multiply xl:block"
            style={{ maskImage: 'linear-gradient(to left, #000 55%, transparent)' }}
          />
        ))}
      {petalsOn() && <SakuraCanvas count={variant === 'hero' ? 32 : 18} />}
    </div>
  )
}
