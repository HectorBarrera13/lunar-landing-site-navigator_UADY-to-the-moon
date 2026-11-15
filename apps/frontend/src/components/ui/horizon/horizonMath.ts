import type { SeriesPoint, SiteTimeSeries } from '@/types'

/** Bodies drawn on the horizon panel; keys match the `<body>_*` contract fields. */
export type Body = 'sun' | 'earth'

export interface BodySample {
  timeMs: number
  /** Display azimuth in [-180, 180): 0 = north, +90 = east, -90 = west, +-180 = south. */
  u: number
  elevationDeg: number
  visible: boolean
}

export interface TrajectorySegment {
  visible: boolean
  points: Array<[number, number]>
}

/** Azimuth clockwise from north (any range) to the panel axis [-180, 180) with north at the center. */
export function toDisplayAzimuth(azimuthDeg: number): number {
  const wrapped = ((((azimuthDeg + 180) % 360) + 360) % 360) - 180
  return wrapped
}

/** Horizon elevation at a fractional azimuth, linearly interpolated between whole-degree bins. */
export function horizonAt(profile: readonly number[], azimuthDeg: number): number {
  const n = profile.length
  if (n === 0) return 0
  const a = ((azimuthDeg % 360) + 360) % 360
  const i0 = Math.floor(a) % n
  const i1 = (i0 + 1) % n
  const frac = a - Math.floor(a)
  return profile[i0] * (1 - frac) + profile[i1] * frac
}

export function bodySample(point: SeriesPoint, body: Body): BodySample {
  const azimuth = body === 'sun' ? point.sun_azimuth_deg : point.earth_azimuth_deg
  return {
    timeMs: Date.parse(point.time_utc),
    u: toDisplayAzimuth(azimuth),
    elevationDeg: body === 'sun' ? point.sun_elevation_deg : point.earth_elevation_deg,
    visible: body === 'sun' ? point.sun_visible : point.earth_visible,
  }
}

/**
 * Splits a body trajectory into solid (visible) and dashed (hidden) runs. Runs are cut at the
 * +-180 deg wrap (interpolating the crossing so each run reaches the edge) and at data gaps,
 * so nothing is ever drawn as a line across the whole panel.
 */
export function trajectorySegments(
  points: readonly SeriesPoint[],
  body: Body,
  stepMinutes: number,
): TrajectorySegment[] {
  const segments: TrajectorySegment[] = []
  const gapMs = Math.max(1, stepMinutes) * 60_000 * 1.5
  let current: TrajectorySegment | null = null
  let prev: BodySample | null = null

  for (const point of points) {
    const sample = bodySample(point, body)
    if (prev === null || current === null || sample.timeMs - prev.timeMs > gapMs) {
      current = { visible: sample.visible, points: [[sample.u, sample.elevationDeg]] }
      segments.push(current)
      prev = sample
      continue
    }
    const jump = sample.u - prev.u
    if (Math.abs(jump) > 180) {
      // Unwrap, find where the path meets the edge, and restart on the opposite edge.
      const edge = jump < 0 ? 180 : -180
      const unwrapped = jump < 0 ? sample.u + 360 : sample.u - 360
      const span = unwrapped - prev.u
      const t = span === 0 ? 0 : (edge - prev.u) / span
      const crossing = prev.elevationDeg + t * (sample.elevationDeg - prev.elevationDeg)
      current.points.push([edge, crossing])
      current = { visible: sample.visible, points: [[-edge, crossing]] }
      segments.push(current)
    } else if (sample.visible !== current.visible) {
      // Share the boundary point so solid and dashed runs join without a hole.
      current = { visible: sample.visible, points: [[prev.u, prev.elevationDeg]] }
      segments.push(current)
    }
    current.points.push([sample.u, sample.elevationDeg])
    prev = sample
  }
  return segments
}

export interface ElevationRange {
  min: number
  max: number
}

/** Auto range over the horizon profile, both trajectories, and 0 deg, with padding. */
export function elevationRange(series: SiteTimeSeries): ElevationRange {
  let min = 0
  let max = 0
  for (const value of series.horizon_profile_deg) {
    if (value < min) min = value
    if (value > max) max = value
  }
  for (const p of series.series) {
    min = Math.min(min, p.sun_elevation_deg, p.earth_elevation_deg)
    max = Math.max(max, p.sun_elevation_deg, p.earth_elevation_deg)
  }
  const pad = Math.max(1, (max - min) * 0.08)
  return { min: Math.max(-90, min - pad), max: Math.min(90, max + pad) }
}

/** Tick step giving at most ~6 elevation labels. */
export function elevationTickStep(range: ElevationRange): number {
  const span = range.max - range.min
  for (const step of [1, 2, 5, 10, 15, 30, 45]) {
    if (span / step <= 6) return step
  }
  return 90
}

export interface BodyEvents {
  nextRiseUtc: string | null
  nextSetUtc: string | null
}

/**
 * Next rise / set after the cursor, from transitions of the precomputed visibility booleans
 * (no ephemeris math). The reported time is the first sample after the transition, so its
 * resolution is the series time step.
 */
export function nextEvents(points: readonly SeriesPoint[], cursorIndex: number, body: Body): BodyEvents {
  const key = body === 'sun' ? 'sun_visible' : 'earth_visible'
  let nextRiseUtc: string | null = null
  let nextSetUtc: string | null = null
  for (let i = Math.max(1, cursorIndex + 1); i < points.length; i++) {
    const before = points[i - 1][key]
    const now = points[i][key]
    if (nextRiseUtc === null && now && !before) nextRiseUtc = points[i].time_utc
    if (nextSetUtc === null && !now && before) nextSetUtc = points[i].time_utc
    if (nextRiseUtc !== null && nextSetUtc !== null) break
  }
  return { nextRiseUtc, nextSetUtc }
}

/** Index of the series point closest to the cursor; 0 when the cursor is missing. */
export function cursorIndexFor(points: readonly SeriesPoint[], timeUtc: string | null): number {
  if (points.length === 0 || timeUtc === null) return 0
  const target = Date.parse(timeUtc)
  if (Number.isNaN(target)) return 0
  let best = 0
  let bestDelta = Number.POSITIVE_INFINITY
  for (let i = 0; i < points.length; i++) {
    const delta = Math.abs(Date.parse(points[i].time_utc) - target)
    if (delta < bestDelta) {
      best = i
      bestDelta = delta
    }
  }
  return best
}
