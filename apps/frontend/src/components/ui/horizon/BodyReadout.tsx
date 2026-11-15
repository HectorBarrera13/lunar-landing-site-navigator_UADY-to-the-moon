import { MONO_NUM } from '@/components/ui/common/styles'
import { formatDuration, formatUtc } from '@/lib/time'
import type { SeriesPoint } from '@/types'
import { horizonAt } from './horizonMath'
import type { Body, BodyEvents } from './horizonMath'
import { HORIZON_STRINGS as S } from './strings'

const GLYPH: Record<Body, string> = { sun: '☉', earth: '⊕' }
const TONE: Record<Body, string> = { sun: 'text-sun', earth: 'text-earth' }

export interface BodyReading {
  azimuthDeg: number
  elevationDeg: number
  visible: boolean
  /** Share of the disc above the terrain (contract 1.1 `<body>_visible_fraction`). */
  visiblePercent: number
  marginDeg: number
}

export function readBody(point: SeriesPoint, profile: readonly number[], body: Body): BodyReading {
  const azimuthDeg = body === 'sun' ? point.sun_azimuth_deg : point.earth_azimuth_deg
  const elevationDeg = body === 'sun' ? point.sun_elevation_deg : point.earth_elevation_deg
  const visible = body === 'sun' ? point.sun_visible : point.earth_visible
  const fraction = body === 'sun' ? point.sun_visible_fraction : point.earth_visible_fraction
  return {
    azimuthDeg,
    elevationDeg,
    visible,
    visiblePercent: Math.round(100 * fraction),
    // Display only: interpolated between whole-degree bins (the pipeline fraction also interpolates linearly).
    marginDeg: elevationDeg - horizonAt(profile, azimuthDeg),
  }
}

function signed(value: number, digits = 1): string {
  const text = Math.abs(value).toFixed(digits)
  if (Number(text) === 0) return `${text}`
  return `${value > 0 ? '+' : '−'}${text}`
}

function EventValue({ isoUtc, cursorMs }: { isoUtc: string | null; cursorMs: number }) {
  if (isoUtc === null) return <span className="text-ink-subtle">{S.noneInWindow}</span>
  return (
    <span className={MONO_NUM}>
      {formatUtc(isoUtc)}{' '}
      <span className="text-ink-subtle">
        ({S.inPrefix} {formatDuration(Date.parse(isoUtc) - cursorMs)})
      </span>
    </span>
  )
}

interface BodyReadoutProps {
  body: Body
  reading: BodyReading
  events: BodyEvents
  cursorMs: number
}

export default function BodyReadout({ body, reading, events, cursorMs }: BodyReadoutProps) {
  const name = body === 'sun' ? S.sun : S.earth
  const above = reading.marginDeg >= 0
  return (
    <section aria-label={name} className="border border-line bg-chassis p-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 font-display text-xs font-semibold uppercase tracking-[0.14em]">
          <span aria-hidden="true" className={`${TONE[body]} text-sm leading-none`}>
            {GLYPH[body]}
          </span>
          {name}
        </h3>
        <span className="inline-flex h-5 items-center gap-1.5 border border-line bg-base px-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-ink">
          <span aria-hidden="true">{reading.visible ? '▲' : '▽'}</span>
          {reading.visible ? S.visible : S.hidden}
          <span className={MONO_NUM}>
            · {reading.visiblePercent}%<span className="sr-only"> {S.visiblePercent}</span>
          </span>
        </span>
      </div>
      <p className={`mt-1.5 text-[11px] text-ink-muted ${MONO_NUM}`}>
        {S.azimuth} {reading.azimuthDeg.toFixed(1)}° · {S.elevation} {signed(reading.elevationDeg, 2)}°
      </p>
      <p className={`mt-0.5 text-xs ${above ? 'text-ink' : 'text-ink-muted'}`}>
        <span className={`font-semibold ${MONO_NUM}`}>{signed(reading.marginDeg)}°</span>{' '}
        {above ? S.aboveTerrain : S.belowTerrain}
      </p>
      <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[11px]">
        <dt className="text-ink-subtle">{S.nextRise}</dt>
        <dd>
          <EventValue isoUtc={events.nextRiseUtc} cursorMs={cursorMs} />
        </dd>
        <dt className="text-ink-subtle">{S.nextSet}</dt>
        <dd>
          <EventValue isoUtc={events.nextSetUtc} cursorMs={cursorMs} />
        </dd>
      </dl>
    </section>
  )
}
