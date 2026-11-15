import { useMemo } from 'react'
import { FOCUS_RING, LABEL } from '@/components/ui/common/styles'
import { DAY_MS, HOUR_MS, clampMs, toIsoUtc } from '@/lib/mission'
import { useAppStore } from '@/store'
import { TIMELINE_STRINGS as S } from './strings'
import { buildBuckets, granularityFor } from './timeBuckets'
import type { Granularity, TimeBucket } from './timeBuckets'

const WEEKDAY = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' })
const MONTH = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
const FULL = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeZone: 'UTC' })
const MONTH_YEAR = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })

function Band({ percent, tone }: { percent: number | null; tone: string }) {
  return (
    <span aria-hidden="true" className="flex h-[3px] w-8 bg-line">
      <span className={`h-full ${tone}`} style={{ width: percent === null ? '0%' : `${percent}%` }} />
    </span>
  )
}

interface BucketLabels {
  top: string
  main: string
  bottom: string
  full: string
}

function labelsFor(bucket: TimeBucket, granularity: Granularity, previous: TimeBucket | undefined): BucketLabels {
  const d = new Date(bucket.startMs)
  if (granularity === 'month') {
    return { top: String(d.getUTCFullYear()), main: MONTH.format(d), bottom: '', full: MONTH_YEAR.format(d) }
  }
  const newMonth = previous === undefined || new Date(previous.startMs).getUTCMonth() !== d.getUTCMonth()
  return {
    top: newMonth ? MONTH.format(d) : '',
    main: String(d.getUTCDate()),
    bottom: granularity === 'week' ? S.week : WEEKDAY.format(d),
    full: granularity === 'week' ? `${S.week} ${FULL.format(d)}` : FULL.format(d),
  }
}

/** FR-11 strip: one button per day (or week / month for long windows) with light and contact bands. */
export default function TimeCursorBar() {
  const t0 = useAppStore((s) => s.mission.t0)
  const tf = useAppStore((s) => s.mission.tf)
  const timeCursor = useAppStore((s) => s.mission.timeCursor)
  const setTimeCursor = useAppStore((s) => s.setTimeCursor)
  const series = useAppStore((s) => s.siteSeries)
  const seriesStatus = useAppStore((s) => s.seriesStatus)

  const start = t0 === null ? Number.NaN : Date.parse(t0)
  const end = tf === null ? Number.NaN : Date.parse(tf)
  const valid = !Number.isNaN(start) && !Number.isNaN(end)
  const granularity: Granularity = valid ? granularityFor(start, end) : 'day'
  const buckets = useMemo(
    () => (valid ? buildBuckets(start, end, granularity, series) : []),
    [valid, start, end, granularity, series],
  )

  if (buckets.length === 0) return null
  const cursor = timeCursor === null ? start : Date.parse(timeCursor)
  const hourOffset = Math.floor((cursor % DAY_MS) / HOUR_MS) * HOUR_MS
  const noData = seriesStatus === 'error' || (series !== null && series.series.length === 0)

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <ul
        aria-label={`${S.calendarLabel} (${S.granularity[granularity]})`}
        className="pointer-events-auto flex min-w-0 flex-1 overflow-x-auto pl-px"
      >
        {buckets.map((bucket, i) => {
          const text = labelsFor(bucket, granularity, buckets[i - 1])
          const selected = cursor >= bucket.startMs && cursor < bucket.endMs
          const sunText = bucket.sunPercent === null ? S.noData : `${S.sunBand} ${bucket.sunPercent}%`
          const earthText = bucket.earthPercent === null ? S.noData : `${S.earthBand} ${bucket.earthPercent}%`
          const target = clampMs(bucket.startMs + (granularity === 'day' ? hourOffset : 0), start, end)
          return (
            <li key={bucket.startMs} className="-ml-px shrink-0">
              <button
                type="button"
                aria-pressed={selected}
                aria-label={`${text.full} UTC; ${sunText}; ${earthText}`}
                onClick={() => setTimeCursor(toIsoUtc(target))}
                className={`relative flex h-14 w-12 flex-col items-center justify-center border ${FOCUS_RING} ${
                  selected ? 'z-1 border-primary bg-panel text-ink' : 'border-line bg-chassis text-ink-muted hover:text-ink'
                }`}
              >
                {selected && (
                  <span aria-hidden="true" className="absolute top-0.5 left-1/2 size-1 -translate-x-1/2 bg-primary" />
                )}
                <span className="h-3 font-mono text-[9px] uppercase leading-3 text-ink-subtle">{text.top}</span>
                <span className="font-mono text-sm font-semibold leading-4 tabular-nums">{text.main}</span>
                <span className="h-3 font-mono text-[9px] uppercase leading-3 text-ink-subtle">{text.bottom}</span>
                <span className="mt-0.5 flex flex-col items-center gap-0.5">
                  <Band percent={bucket.sunPercent} tone="bg-sun" />
                  <Band percent={bucket.earthPercent} tone="bg-earth" />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {noData ? (
        <p role="status" className="flex shrink-0 items-center gap-1.5 border border-line bg-panel px-2 py-1 text-xs text-ink">
          <span aria-hidden="true" className="text-ink-muted">
            {'ⓘ'}
          </span>
          {S.noWindowData}
        </p>
      ) : seriesStatus === 'loading' ? (
        <p role="status" className={`${LABEL} shrink-0`}>
          {S.loading}
        </p>
      ) : (
        <ul
          aria-label={S.legendLabel}
          className="hidden shrink-0 flex-col gap-1 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-muted xl:flex"
        >
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-[3px] w-3 bg-sun" />
            <span aria-hidden="true" className="text-sun">
              {'☉'}
            </span>
            {S.sunBand}
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-[3px] w-3 bg-earth" />
            <span aria-hidden="true" className="text-earth">
              {'⊕'}
            </span>
            {S.earthBand}
          </li>
        </ul>
      )}
    </div>
  )
}
