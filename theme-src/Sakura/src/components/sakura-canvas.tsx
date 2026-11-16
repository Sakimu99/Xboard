import { useEffect, useRef } from 'react'

type Petal = { x: number; y: number; r: number; vx: number; vy: number; rot: number; vr: number; flip: number; vf: number; hue: number }

/** 飄落的櫻花花瓣（Canvas 2D，分頁隱藏時自動暫停） */
export function SakuraCanvas({ count = 28 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    let w = 0
    let h = 0
    let raf = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const spawn = (p: Partial<Petal> = {}): Petal => ({
      x: Math.random() * w,
      y: -20,
      r: 6 + Math.random() * 7,
      vx: 0.3 + Math.random() * 0.8,
      vy: 0.6 + Math.random() * 0.9,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.03,
      flip: Math.random() * Math.PI,
      vf: 0.02 + Math.random() * 0.03,
      hue: 340 + Math.random() * 20,
      ...p,
    })

    resize()
    const petals = Array.from({ length: count }, () => spawn({ y: Math.random() * h }))

    const draw = (p: Petal) => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.scale(1, Math.abs(Math.cos(p.flip)) * 0.8 + 0.2)
      const g = ctx.createLinearGradient(0, -p.r, 0, p.r)
      g.addColorStop(0, `hsla(${p.hue}, 100%, 92%, 0.95)`)
      g.addColorStop(1, `hsla(${p.hue}, 85%, 78%, 0.85)`)
      ctx.fillStyle = g
      ctx.beginPath()
      // 花瓣：頂端帶缺口的水滴形
      ctx.moveTo(0, p.r)
      ctx.bezierCurveTo(p.r * 0.9, p.r * 0.4, p.r * 0.7, -p.r * 0.8, p.r * 0.18, -p.r)
      ctx.lineTo(0, -p.r * 0.72)
      ctx.lineTo(-p.r * 0.18, -p.r)
      ctx.bezierCurveTo(-p.r * 0.7, -p.r * 0.8, -p.r * 0.9, p.r * 0.4, 0, p.r)
      ctx.fill()
      ctx.restore()
    }

    const tick = () => {
      ctx.clearRect(0, 0, w, h)
      for (let i = 0; i < petals.length; i++) {
        const p = petals[i]
        p.x += p.vx + Math.sin(p.flip) * 0.4
        p.y += p.vy
        p.rot += p.vr
        p.flip += p.vf
        if (p.y > h + 20 || p.x > w + 20) petals[i] = spawn({ x: Math.random() * w * 1.2 - w * 0.2 })
        draw(p)
      }
      raf = requestAnimationFrame(tick)
    }
    const onVisibility = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [count])

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0 size-full" />
}
