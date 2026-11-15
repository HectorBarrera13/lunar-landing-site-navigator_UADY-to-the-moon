import { useEffect, useState } from 'react'
import type { TourTarget } from './steps'

export interface TourRect {
  top: number
  left: number
  width: number
  height: number
}

const PAD = 6
/** Share of the viewport height covered by the virtual "moon" target. */
const MOON_FRACTION = 0.6

function measure(target: TourTarget): TourRect | null {
  if (target === null) return null
  if ('virtual' in target) {
    const size = Math.min(window.innerWidth, window.innerHeight) * MOON_FRACTION
    return {
      top: (window.innerHeight - size) / 2,
      left: (window.innerWidth - size) / 2,
      width: size,
      height: size,
    }
  }
  const el = document.querySelector(target.selector)
  if (el === null) return null
  const box = el.getBoundingClientRect()
  if (box.width === 0 || box.height === 0) return null
  return { top: box.top - PAD, left: box.left - PAD, width: box.width + PAD * 2, height: box.height + PAD * 2 }
}

function same(a: TourRect | null, b: TourRect | null): boolean {
  if (a === null || b === null) return a === b
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height
}

/**
 * Viewport rectangle of the current target, re-measured every frame: the point card follows a
 * 3D anchor and panels animate, so it can move. `null` while the target does not exist yet.
 */
export function useTargetRect(target: TourTarget): TourRect | null {
  const [rect, setRect] = useState<TourRect | null>(null)

  useEffect(() => {
    let frame = 0
    const tick = () => {
      const next = measure(target)
      setRect((prev) => (same(prev, next) ? prev : next))
      frame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(frame)
  }, [target])

  return rect
}
