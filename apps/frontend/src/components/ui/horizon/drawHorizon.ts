import type { SeriesPoint } from '@/types'
import { horizonStrings as t } from './strings'

const EL_MIN = -10
const EL_MAX = 20
const PAD = { left: 40, right: 12, top: 12, bottom: 28 }

type BodyKind = 'sun' | 'earth'

function drawBody(
  ctx: CanvasRenderingContext2D,
  kind: BodyKind,
  x: number,
  y: number,
  visible: boolean,
  elevation: number,
): void {
  const color = kind === 'sun' ? '#ffc94d' : '#5aa9ff'
  const r = 8
  ctx.save()
  ctx.lineWidth = 2
  ctx.strokeStyle = color
  ctx.fillStyle = color
  if (!visible) ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  if (visible) ctx.fill()
  else ctx.stroke()
  ctx.setLineDash([])
  if (kind === 'sun') {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4
      ctx.beginPath()
      ctx.moveTo(x + Math.cos(a) * (r + 3), y + Math.sin(a) * (r + 3))
      ctx.lineTo(x + Math.cos(a) * (r + 7), y + Math.sin(a) * (r + 7))
      ctx.stroke()
    }
  } else {
    ctx.beginPath()
    ctx.ellipse(x, y, r + 5, 3, -0.4, 0, Math.PI * 2)
    ctx.stroke()
  }
  const status = visible ? t.visible : elevation < 0 ? t.belowHorizon : t.hiddenByTerrain
  const mark = visible ? '✓' : '✕'
  ctx.fillStyle = '#e8ecff'
  ctx.font = '12px sans-serif'
  ctx.textBaseline = 'middle'
  const label = `${kind === 'sun' ? t.sun : t.earth} ${mark} ${status}`
  const w = ctx.measureText(label).width
  const tx = x + r + 12 + w > ctx.canvas.width ? x - r - 12 - w : x + r + 12
  ctx.fillText(label, tx, y - 16)
  ctx.restore()
}

export function drawHorizon(
  canvas: HTMLCanvasElement,
  profile: number[],
  point: SeriesPoint | null,
  width: number,
  height: number,
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = width * dpr
  canvas.height = height * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)

  const pw = width - PAD.left - PAD.right
  const ph = height - PAD.top - PAD.bottom
  const xOf = (az: number): number => PAD.left + (az / 360) * pw
  const yOf = (el: number): number => PAD.top + ((EL_MAX - el) / (EL_MAX - EL_MIN)) * ph

  ctx.font = '11px sans-serif'
  ctx.fillStyle = '#9aa3c7'
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 1
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'right'
  for (let el = EL_MIN; el <= EL_MAX; el += 10) {
    ctx.beginPath()
    ctx.moveTo(PAD.left, yOf(el))
    ctx.lineTo(width - PAD.right, yOf(el))
    ctx.stroke()
    ctx.fillText(String(el), PAD.left - 6, yOf(el))
  }
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const cardinals: Record<number, string> = { 0: t.cardinal.N, 90: t.cardinal.E, 180: t.cardinal.S, 270: t.cardinal.W, 360: t.cardinal.N }
  for (let az = 0; az <= 360; az += 45) {
    const name = cardinals[az]
    ctx.fillText(name ? `${az} ${name}` : String(az), xOf(az), height - PAD.bottom + 6)
  }

  ctx.beginPath()
  ctx.moveTo(xOf(0), yOf(EL_MIN))
  profile.forEach((el, az) => ctx.lineTo(xOf(az), yOf(el)))
  ctx.lineTo(xOf(360), yOf(profile[0] ?? 0))
  ctx.lineTo(xOf(360), yOf(EL_MIN))
  ctx.closePath()
  ctx.fillStyle = '#4a4f66'
  ctx.fill()
  ctx.strokeStyle = '#b8bfdc'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.save()
  ctx.strokeStyle = '#e8ecff'
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(PAD.left, yOf(0))
  ctx.lineTo(width - PAD.right, yOf(0))
  ctx.stroke()
  ctx.restore()

  if (point) {
    drawBody(ctx, 'sun', xOf(point.sun_azimuth_deg), yOf(point.sun_elevation_deg), point.sun_visible, point.sun_elevation_deg)
    drawBody(ctx, 'earth', xOf(point.earth_azimuth_deg), yOf(point.earth_elevation_deg), point.earth_visible, point.earth_elevation_deg)
  }
}
