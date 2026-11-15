import type { ReactNode } from 'react'
import { LABEL, MONO_NUM } from '@/components/ui/common/styles'
import type { TrafficLight } from '@/types'
import { MARGIN_M, MARGIN_RADIUS_M, ZONE_RADIUS_M, scaleBarMeters } from './landingZone'
import { MAP_STRINGS as S } from './strings'

/** Literal classes so Tailwind emits them; traffic-light colors only on the stroke. */
const ZONE_STROKE: Record<TrafficLight, string> = {
  green: 'stroke-light-green',
  orange: 'stroke-light-orange',
  red: 'stroke-light-red',
}

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0 fill-none">
      {children}
    </svg>
  )
}

interface MapLegendProps {
  pxPerM: number
  light: TrafficLight | null
}

export default function MapLegend({ pxPerM, light }: MapLegendProps) {
  const barM = scaleBarMeters(pxPerM)
  const barPx = Math.round(barM * pxPerM)

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <h3 className={LABEL}>{S.legendLabel}</h3>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-muted">
        <li className="flex items-center gap-1.5">
          <Glyph>
            <circle
              cx="8"
              cy="8"
              r="6"
              strokeWidth="2"
              className={light === null ? 'stroke-ink-muted' : ZONE_STROKE[light]}
            />
          </Glyph>
          <span>
            {S.legendZone}{' '}
            <span className={MONO_NUM}>
              {ZONE_RADIUS_M * 2} {S.meters}
            </span>{' '}
            {S.diameter}
          </span>
        </li>
        <li className="flex items-center gap-1.5">
          <Glyph>
            <circle cx="8" cy="8" r="6" strokeWidth="1.5" strokeDasharray="1.5 2.5" className="stroke-ink-subtle" />
          </Glyph>
          <span>
            {S.legendMargin}{' '}
            <span className={MONO_NUM}>
              +{MARGIN_M} {S.meters}
            </span>{' '}
            ({S.radius}{' '}
            <span className={MONO_NUM}>
              {MARGIN_RADIUS_M} {S.meters}
            </span>
            )
          </span>
        </li>
        <li className="flex items-center gap-1.5">
          <Glyph>
            <path d="M1 8h4M11 8h4M8 1v4M8 11v4" strokeWidth="1" className="stroke-primary" />
            <rect x="6" y="6" width="4" height="4" strokeWidth="1" className="stroke-primary" />
          </Glyph>
          <span>{S.legendPoint}</span>
        </li>
        <li className="flex items-center gap-2">
          <span>{S.legendScale}</span>
          {/* Dynamic width: the bar length in CSS px equals `barM` at the drawing scale. */}
          <span
            aria-hidden="true"
            style={{ width: barPx }}
            className="inline-block h-1.5 border-x border-b border-ink-muted"
          />
          <span className={MONO_NUM}>
            {barM} {S.meters}
          </span>
        </li>
      </ul>
    </div>
  )
}
