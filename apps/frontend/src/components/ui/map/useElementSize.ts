import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

export interface ElementSize {
  width: number
  height: number
  /** Device pixel ratio at the last measurement. */
  dpr: number
}

const ZERO: ElementSize = { width: 0, height: 0, dpr: 1 }

/** Tracks an element's CSS size and the device pixel ratio; updates only when one changes. */
export function useElementSize(ref: RefObject<HTMLElement | null>): ElementSize {
  const [size, setSize] = useState<ElementSize>(ZERO)

  useEffect(() => {
    const el = ref.current
    if (el === null) return
    const measure = () => {
      const width = el.clientWidth
      const height = el.clientHeight
      const dpr = window.devicePixelRatio || 1
      setSize((prev) =>
        prev.width === width && prev.height === height && prev.dpr === dpr ? prev : { width, height, dpr },
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    // Browser zoom changes the DPR and fires `resize` on the window.
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [ref])

  return size
}
