import { useEffect, useMemo, useRef } from 'react'
import type { TrafficLight } from '@/types'
import { MARGIN_RADIUS_M, ZONE_RADIUS_M, createPlaceholderTile } from './landingZone'
import type { ElementSize } from './useElementSize'

/** Token names from `index.css`; fallbacks keep the drawing legible if a variable is missing. */
const TOKENS = {
  base: ['--color-base', '#0d1013'],
  neutral: ['--color-ink-muted', '#c1c7cc'],
  subtle: ['--color-ink-subtle', '#8b9296'],
  primary: ['--color-primary', '#88b3c7'],
  green: ['--color-light-green', '#52997c'],
  orange: ['--color-light-orange', '#c8933e'],
  red: ['--color-light-red', '#c75450'],
} as const

type TokenName = keyof typeof TOKENS

function readToken(styles: CSSStyleDeclaration, name: TokenName): string {
  const [variable, fallback] = TOKENS[name]
  return styles.getPropertyValue(variable).trim() || fallback
}

interface LandingCanvasProps {
  size: ElementSize
  pxPerM: number
  /** Suitability Index traffic light for the zone stroke; null draws a neutral stroke. */
  light: TrafficLight | null
  label: string
  describedBy: string
}

/**
 * Canvas 2D drawing of the landing zone, to scale: placeholder base, error margin ring (dotted,
 * neutral), zone circle (traffic-light stroke only, never a fill) and the proposed landing point.
 * Redraws only when the size, DPR, scale or light change.
 */
export default function LandingCanvas({ size, pxPerM, light, label, describedBy }: LandingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tile = useMemo(() => createPlaceholderTile(), [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null || size.width === 0 || size.height === 0) return
    const { width, height, dpr } = size
    const pixelW = Math.round(width * dpr)
    const pixelH = Math.round(height * dpr)
    if (canvas.width !== pixelW) canvas.width = pixelW
    if (canvas.height !== pixelH) canvas.height = pixelH
    const ctx = canvas.getContext('2d')
    if (ctx === null) return

    const styles = getComputedStyle(canvas)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)

    ctx.fillStyle = readToken(styles, 'base')
    ctx.fillRect(0, 0, width, height)
    const pattern = tile === null ? null : ctx.createPattern(tile, 'repeat')
    if (pattern !== null) {
      ctx.fillStyle = pattern
      ctx.fillRect(0, 0, width, height)
    }

    const cx = width / 2
    const cy = height / 2
    const zoneR = ZONE_RADIUS_M * pxPerM
    const marginR = MARGIN_RADIUS_M * pxPerM

    // Error margin: dotted neutral ring at the outer edge of the margin.
    ctx.beginPath()
    ctx.arc(cx, cy, marginR, 0, Math.PI * 2)
    ctx.setLineDash([2, 5])
    ctx.lineWidth = 1.5
    ctx.strokeStyle = readToken(styles, 'subtle')
    ctx.stroke()
    ctx.setLineDash([])

    // Landing zone: stroke only (owner rule: traffic-light colors are never fills).
    ctx.beginPath()
    ctx.arc(cx, cy, zoneR, 0, Math.PI * 2)
    ctx.lineWidth = 2
    ctx.strokeStyle = readToken(styles, light ?? 'neutral')
    ctx.stroke()

    // Proposed landing point: crosshair with a small open square.
    const arm = 9
    const box = 3
    ctx.lineWidth = 1
    ctx.strokeStyle = readToken(styles, 'primary')
    ctx.beginPath()
    ctx.moveTo(cx - arm, cy)
    ctx.lineTo(cx - box, cy)
    ctx.moveTo(cx + box, cy)
    ctx.lineTo(cx + arm, cy)
    ctx.moveTo(cx, cy - arm)
    ctx.lineTo(cx, cy - box)
    ctx.moveTo(cx, cy + box)
    ctx.lineTo(cx, cy + arm)
    ctx.stroke()
    ctx.strokeRect(cx - box + 0.5, cy - box + 0.5, box * 2 - 1, box * 2 - 1)
  }, [size, pxPerM, light, tile])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      aria-describedby={describedBy}
      className="absolute inset-0 block h-full w-full"
    />
  )
}
