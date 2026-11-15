import { DAY_MS } from '@/lib/mission'
import type { SiteTimeSeries } from '@/types'

/**
 * PROVISIONAL (round 3 proposal): the strip shows days up to 60 days, weeks up to 60 weeks,
 * and months beyond, so the 2025–2035 range never renders thousands of buttons.
 */
export const MAX_DAY_BUCKETS = 60
export const MAX_WEEK_BUCKETS = 60

export type Granularity = 'day' | 'week' | 'month'

export interface TimeBucket {
  startMs: number
  /** Exclusive end. */
  endMs: number
  sunPercent: number | null
  earthPercent: number | null
}

function utcMidnight(ms: number): number {
  const d = new Date(ms)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

export function granularityFor(t0Ms: number, tfMs: number): Granularity {
  const days = Math.floor((utcMidnight(tfMs) - utcMidnight(t0Ms)) / DAY_MS) + 1
  if (days <= MAX_DAY_BUCKETS) return 'day'
  if (Math.ceil(days / 7) <= MAX_WEEK_BUCKETS) return 'week'
  return 'month'
}

function bucketStarts(t0Ms: number, tfMs: number, granularity: Granularity): number[] {
  const starts: number[] = []
  if (granularity === 'month') {
    const d = new Date(t0Ms)
    let year = d.getUTCFullYear()
    let month = d.getUTCMonth()
    for (let t = Date.UTC(year, month, 1); t <= tfMs; t = Date.UTC(year, month, 1)) {
      starts.push(t)
      month += 1
      if (month === 12) {
        month = 0
        year += 1
      }
    }
    return starts
  }
  const step = granularity === 'day' ? DAY_MS : 7 * DAY_MS
  for (let t = utcMidnight(t0Ms); t <= tfMs; t += step) starts.push(t)
  return starts
}

function nextStart(start: number, granularity: Granularity): number {
  if (granularity === 'day') return start + DAY_MS
  if (granularity === 'week') return start + 7 * DAY_MS
  const d = new Date(start)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)
}

/** Buckets over the window with the share of series points where the Sun / Earth is visible. */
export function buildBuckets(
  t0Ms: number,
  tfMs: number,
  granularity: Granularity,
  series: SiteTimeSeries | null,
): TimeBucket[] {
  const starts = bucketStarts(t0Ms, tfMs, granularity)
  const points = series?.series ?? []
  let p = 0
  return starts.map((startMs) => {
    const endMs = nextStart(startMs, granularity)
    let total = 0
    let sun = 0
    let earth = 0
    while (p < points.length && Date.parse(points[p].time_utc) < startMs) p++
    while (p < points.length && Date.parse(points[p].time_utc) < endMs) {
      total += 1
      if (points[p].sun_visible) sun += 1
      if (points[p].earth_visible) earth += 1
      p++
    }
    return {
      startMs,
      endMs,
      sunPercent: total === 0 ? null : Math.round((100 * sun) / total),
      earthPercent: total === 0 ? null : Math.round((100 * earth) / total),
    }
  })
}
