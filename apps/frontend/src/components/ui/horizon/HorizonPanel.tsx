import { useMemo } from 'react'
import { seriesPointAt } from '@/lib/orientation'
import { useAppStore } from '@/store'
import { HORIZON_STRINGS as S } from './strings'

const SIZE = 240
const CENTER = SIZE / 2
const RADIUS = 100
const RAD = Math.PI / 180

const TIME = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
})

/** Elevation [-90, 90] to radius [R, 0]: the horizon (0 deg) sits at half radius. */
function radiusFor(elevationDeg: number): number {
  const elevation = Math.max(-90, Math.min(90, elevationDeg))
  return (RADIUS * (90 - elevation)) / 180
}

function polar(azimuthDeg: number, radius: number): [number, number] {
  const azimuth = azimuthDeg * RAD
  return [CENTER + radius * Math.sin(azimuth), CENTER - radius * Math.cos(azimuth)]
}

function toPolyline(points: Array<[number, number]>): string {
  return points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
}

const CARDINALS = [
  { label: S.north, at: polar(0, RADIUS + 9) },
  { label: S.east, at: polar(90, RADIUS + 9) },
  { label: S.south, at: polar(180, RADIUS + 9) },
  { label: S.west, at: polar(270, RADIUS + 9) },
]

export default function HorizonPanel() {
  const series = useAppStore((s) => s.siteSeries)
  const seriesStatus = useAppStore((s) => s.seriesStatus)
  const timeCursor = useAppStore((s) => s.mission.timeCursor)

  const point = useMemo(
    () => (series === null ? null : seriesPointAt(series, timeCursor)),
    [series, timeCursor],
  )

  const geometry = useMemo(() => {
    if (series === null) return null
    const profile = series.horizon_profile_deg.map((elevation, azimuth) =>
      polar(azimuth, radiusFor(elevation)),
    )
    const outer = Array.from({ length: 360 }, (_, azimuth) => polar(azimuth, RADIUS)).reverse()
    return {
      ground: `M ${toPolyline(profile)} L ${toPolyline(outer)} Z`,
      profile: toPolyline(profile),
    }
  }, [series])

  if (series === null || geometry === null || point === null) {
    return (
      <aside
        aria-label={S.title}
        className="pointer-events-none absolute bottom-4 left-4 z-10 w-64 rounded-lg border border-star-100/15 bg-space-900/90 p-3 text-star-100 shadow-lg backdrop-blur"
      >
        <h2 className="text-sm font-semibold">{S.title}</h2>
        <p className="mt-2 text-xs text-star-100/70" role="status">
          {seriesStatus === 'loading' ? S.loading : S.unavailable}
        </p>
      </aside>
    )
  }

  const [sunX, sunY] = polar(point.sun_azimuth_deg, radiusFor(point.sun_elevation_deg))
  const [earthX, earthY] = polar(point.earth_azimuth_deg, radiusFor(point.earth_elevation_deg))
  const summary = [
    `${S.title} for ${series.name} at ${TIME.format(new Date(point.time_utc))} UTC.`,
    `${S.sun} ${point.sun_visible ? S.above : S.below}, elevation ${point.sun_elevation_deg.toFixed(1)} degrees.`,
    `${S.earth} ${point.earth_visible ? S.above : S.below}, elevation ${point.earth_elevation_deg.toFixed(1)} degrees.`,
  ].join(' ')

  return (
    <figure
      aria-label={S.title}
      className="pointer-events-none absolute bottom-4 left-4 z-10 w-64 rounded-lg border border-star-100/15 bg-space-900/90 p-3 text-star-100 shadow-lg backdrop-blur"
    >
      <figcaption className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">{S.title}</h2>
        <span className="text-[10px] text-star-100/70">{series.name}</span>
      </figcaption>
      <p className="sr-only">{summary}</p>
      <svg aria-hidden="true" viewBox={`0 0 ${SIZE} ${SIZE}`} className="mt-2 w-full">
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          className="fill-space-950/60 stroke-star-100/20"
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS / 2}
          className="fill-none stroke-star-100/20"
          strokeDasharray="3 4"
        />
        <path d={geometry.ground} className="fill-space-800/70" />
        <polyline points={geometry.profile} className="fill-none stroke-star-100/70" strokeWidth={1.5} />

        {CARDINALS.map(({ label, at: [x, y] }) => (
          <text
            key={label}
            x={x}
            y={y + 3}
            textAnchor="middle"
            className="fill-star-100/70 text-[10px]"
          >
            {label}
          </text>
        ))}

        <g className={point.sun_visible ? 'text-amber-300' : 'text-amber-300/50'}>
          <circle
            cx={sunX}
            cy={sunY}
            r={4}
            className={point.sun_visible ? 'fill-current' : 'fill-none stroke-current'}
            strokeWidth={1.5}
          />
          <line x1={sunX - 7} y1={sunY} x2={sunX - 5} y2={sunY} className="stroke-current" />
          <line x1={sunX + 5} y1={sunY} x2={sunX + 7} y2={sunY} className="stroke-current" />
          <line x1={sunX} y1={sunY - 7} x2={sunX} y2={sunY - 5} className="stroke-current" />
          <line x1={sunX} y1={sunY + 5} x2={sunX} y2={sunY + 7} className="stroke-current" />
        </g>

        <g className={point.earth_visible ? 'text-sky-300' : 'text-sky-300/50'}>
          <circle
            cx={earthX}
            cy={earthY}
            r={4}
            className={point.earth_visible ? 'fill-current' : 'fill-none stroke-current'}
            strokeWidth={1.5}
          />
          <line x1={earthX - 6} y1={earthY} x2={earthX + 6} y2={earthY} className="stroke-current" />
          <line x1={earthX} y1={earthY - 6} x2={earthX} y2={earthY + 6} className="stroke-current" />
        </g>
      </svg>
      <ul aria-label={S.legend} className="mt-2 space-y-1 text-[11px] text-star-100/80">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="text-amber-300">
            &#x2609;
          </span>
          {S.sun}: {point.sun_visible ? S.above : S.below} ({point.sun_elevation_deg.toFixed(1)}&deg;)
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="text-sky-300">
            &#x2295;
          </span>
          {S.earth}: {point.earth_visible ? S.above : S.below} (
          {point.earth_elevation_deg.toFixed(1)}&deg;)
        </li>
      </ul>
      <p className="mt-1 text-[10px] text-star-100/60">{TIME.format(new Date(point.time_utc))} UTC</p>
    </figure>
  )
}
