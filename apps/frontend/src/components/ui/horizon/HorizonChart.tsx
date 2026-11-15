import { useId, useMemo } from 'react'
import type { SeriesPoint, SiteTimeSeries } from '@/types'
import {
  bodySample,
  elevationRange,
  elevationTickStep,
  trajectorySegments,
} from './horizonMath'
import type { Body, ElevationRange, TrajectorySegment } from './horizonMath'
import { HORIZON_STRINGS as S } from './strings'

/*
 * PROVISIONAL (round 3 owner-approved proposal, leader decisions PR not merged): azimuth axis
 * -180..180 with north at the center, elevation auto-ranged to the window, symbolic disc size.
 */
export const VIEW_W = 528
export const VIEW_H = 232
const PAD = { left: 34, right: 8, top: 10, bottom: 22 }
const PLOT_W = VIEW_W - PAD.left - PAD.right
const PLOT_H = VIEW_H - PAD.top - PAD.bottom

/** Fixed symbolic radii (viewBox units): the contract has no distances yet (R3-1). */
const DISC_R: Record<Body, number> = { sun: 6, earth: 5 }

const CARDINALS: ReadonlyArray<{ u: number; label: string }> = [
  { u: -180, label: S.south },
  { u: -90, label: S.west },
  { u: 0, label: S.north },
  { u: 90, label: S.east },
  { u: 180, label: S.south },
]

const MINOR_AZIMUTHS = [-135, -45, 45, 135]

/** Literal class names so Tailwind can detect them. */
const TONE: Record<Body, { fill: string; stroke: string; disc: string; hiddenDisc: string }> = {
  sun: { fill: 'fill-sun', stroke: 'stroke-sun', disc: 'fill-sun stroke-base', hiddenDisc: 'fill-base stroke-sun' },
  earth: {
    fill: 'fill-earth',
    stroke: 'stroke-earth',
    disc: 'fill-earth stroke-base',
    hiddenDisc: 'fill-base stroke-earth',
  },
}

function x(u: number): number {
  return PAD.left + ((u + 180) / 360) * PLOT_W
}

function yFor(range: ElevationRange) {
  return (elevationDeg: number): number =>
    PAD.top + ((range.max - elevationDeg) / (range.max - range.min)) * PLOT_H
}

function pathFor(points: Array<[number, number]>, y: (e: number) => number): string {
  return points.map(([u, e], i) => `${i === 0 ? 'M' : 'L'}${x(u).toFixed(2)},${y(e).toFixed(2)}`).join(' ')
}

/** Profile ordered from u = -180 (south, via west) to u = +180 (south, via east). */
function terrainPath(profile: readonly number[], y: (e: number) => number): { fill: string; line: string } {
  const points: Array<[number, number]> = []
  for (let u = -180; u <= 180; u++) {
    const azimuth = (u + 360) % 360
    points.push([u, profile[azimuth] ?? 0])
  }
  const line = pathFor(points, y)
  const bottom = (PAD.top + PLOT_H).toFixed(2)
  return { line, fill: `${line} L${x(180).toFixed(2)},${bottom} L${x(-180).toFixed(2)},${bottom} Z` }
}

export interface ChartGeometry {
  range: ElevationRange
  exaggeration: number
}

/** Pure geometry shared with the panel text (exaggeration readout). */
export function chartGeometry(series: SiteTimeSeries): ChartGeometry {
  const range = elevationRange(series)
  const pxPerDegV = PLOT_H / (range.max - range.min)
  const pxPerDegH = PLOT_W / 360
  return { range, exaggeration: pxPerDegV / pxPerDegH }
}

function Trajectory({
  segments,
  body,
  y,
}: {
  segments: TrajectorySegment[]
  body: Body
  y: (e: number) => number
}) {
  return (
    <g className={`fill-none ${TONE[body].stroke}`}>
      {segments.map((segment, i) =>
        segment.points.length < 2 ? null : (
          <path
            key={i}
            d={pathFor(segment.points, y)}
            strokeWidth={1.25}
            strokeDasharray={segment.visible ? undefined : '3 3'}
            opacity={segment.visible ? 0.9 : 0.55}
          />
        ),
      )}
    </g>
  )
}

function BodyDisc({ point, body, y }: { point: SeriesPoint; body: Body; y: (e: number) => number }) {
  const sample = bodySample(point, body)
  const r = DISC_R[body]
  // Keep the whole disc inside the plot instead of splitting it across the +-180 edges.
  const cx = Math.min(PAD.left + PLOT_W - r, Math.max(PAD.left + r, x(sample.u)))
  const cy = y(sample.elevationDeg)
  const label = body === 'sun' ? S.sun : S.earth
  const labelY = cy - r - 4 < PAD.top + 8 ? cy + r + 10 : cy - r - 4
  const tone = TONE[body]
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        className={sample.visible ? tone.disc : tone.hiddenDisc}
        strokeWidth={sample.visible ? 1 : 1.5}
        strokeDasharray={sample.visible ? undefined : '2 1.5'}
      />
      {body === 'earth' && (
        <path
          d={`M${cx - r},${cy} L${cx + r},${cy} M${cx},${cy - r} L${cx},${cy + r}`}
          className={sample.visible ? 'stroke-base' : tone.stroke}
          strokeWidth={1}
        />
      )}
      <text
        x={cx}
        y={labelY}
        textAnchor="middle"
        className={`font-mono text-[9px] uppercase tracking-[0.06em] ${tone.fill}`}
      >
        {label}
      </text>
    </g>
  )
}

interface HorizonChartProps {
  series: SiteTimeSeries
  geometry: ChartGeometry
  cursorPoint: SeriesPoint
}

export default function HorizonChart({ series, geometry, cursorPoint }: HorizonChartProps) {
  const clipId = useId()
  const { range } = geometry
  const y = useMemo(() => yFor(range), [range])

  const drawing = useMemo(() => {
    const step = elevationTickStep(range)
    const ticks: number[] = []
    for (let e = Math.ceil(range.min / step) * step; e <= range.max; e += step) ticks.push(e)
    return {
      ticks,
      terrain: terrainPath(series.horizon_profile_deg, y),
      sun: trajectorySegments(series.series, 'sun', series.time_step_minutes),
      earth: trajectorySegments(series.series, 'earth', series.time_step_minutes),
    }
  }, [series, range, y])

  const plotBottom = PAD.top + PLOT_H

  return (
    <svg aria-hidden="true" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="block w-full">
      <defs>
        <clipPath id={clipId}>
          <rect x={PAD.left} y={PAD.top} width={PLOT_W} height={PLOT_H} />
        </clipPath>
      </defs>
      <rect x={PAD.left} y={PAD.top} width={PLOT_W} height={PLOT_H} className="fill-chassis stroke-line" />

      <g className="stroke-floating" strokeWidth={1} strokeDasharray="1 3">
        {[-90, 0, 90, ...MINOR_AZIMUTHS].map((u) => (
          <line key={u} x1={x(u)} x2={x(u)} y1={PAD.top} y2={plotBottom} />
        ))}
        {drawing.ticks.map((e) => (
          <line key={e} x1={PAD.left} x2={PAD.left + PLOT_W} y1={y(e)} y2={y(e)} />
        ))}
      </g>

      <g clipPath={`url(#${clipId})`}>
        <path d={drawing.terrain.fill} className="fill-floating" />
        <path d={drawing.terrain.line} className="fill-none stroke-ink-subtle" strokeWidth={1} />
        <line
          x1={PAD.left}
          x2={PAD.left + PLOT_W}
          y1={y(0)}
          y2={y(0)}
          className="stroke-primary"
          strokeWidth={1}
          strokeDasharray="1 2"
        />
        <Trajectory segments={drawing.earth} body="earth" y={y} />
        <Trajectory segments={drawing.sun} body="sun" y={y} />
        <BodyDisc point={cursorPoint} body="earth" y={y} />
        <BodyDisc point={cursorPoint} body="sun" y={y} />
      </g>

      <g className="fill-ink-subtle font-mono text-[9px] tabular-nums">
        {drawing.ticks.map((e) => (
          <text key={e} x={PAD.left - 4} y={y(e) + 3} textAnchor="end">
            {`${e > 0 ? '+' : ''}${e}°`}
          </text>
        ))}
      </g>
      <g className="font-mono text-[10px] font-medium">
        {CARDINALS.map(({ u, label }) => (
          <text
            key={u}
            x={x(u)}
            y={plotBottom + 14}
            textAnchor={u === -180 ? 'start' : u === 180 ? 'end' : 'middle'}
            className={u === 0 ? 'fill-primary' : 'fill-ink-muted'}
          >
            {label}
          </text>
        ))}
      </g>
    </svg>
  )
}
