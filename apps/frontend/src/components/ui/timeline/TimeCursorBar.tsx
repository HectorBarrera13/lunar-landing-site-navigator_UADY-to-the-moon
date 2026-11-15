import { useMemo, useState } from 'react'
import { FOCUS_RING, ICON_BUTTON, LABEL } from '@/components/ui/common/styles'
import { DAY_MS, HOUR_MS, clampMs, toIsoUtc } from '@/lib/mission'
import { useAppStore } from '@/store'
import { TIMELINE_STRINGS as S } from './strings'
import { buildBuckets, granularityFor } from './timeBuckets'
import type { Granularity, TimeBucket } from './timeBuckets'

/** Buckets shown at once; the rest are reached with the pager. */
const PAGE_SIZE = 6

const WEEKDAY = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' })
const MONTH = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
const FULL = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeZone: 'UTC' })
const MONTH_YEAR = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })

/** Font Awesome Free 7 solid `caret-left` / `caret-right` (CC BY 4.0), drawn in the current text color. */
const CARET_PATHS = {
  left: 'M7.7 235.8c-10.3 12.6-9.5 31.1 2.2 42.8l128 128c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6l0-256c0-12.9-7.8-24.6-19.8-29.6s-25.7-2.2-34.9 6.9l-128 128-2.2 2.4z',
  right:
    'M249.3 235.8c10.2 12.6 9.5 31.1-2.2 42.8l-128 128c-9.2 9.2-22.9 11.9-34.9 6.9S64.5 396.9 64.5 384l0-256c0-12.9 7.8-24.6 19.8-29.6s25.7-2.2 34.9 6.9l128 128 2.2 2.4z',
} as const

function CaretIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 256 512" className="h-4 w-2 fill-current">
      <path d={CARET_PATHS[direction]} />
    </svg>
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

  const cursor = timeCursor === null ? start : Date.parse(timeCursor)
  const selectedIndex = buckets.findIndex((b) => cursor >= b.startMs && cursor < b.endMs)
  const pageCount = Math.max(1, Math.ceil(buckets.length / PAGE_SIZE))
  const [pager, setPager] = useState({ page: 0, selectedIndex: -1 })
  // Keep the selected bucket visible: follow the cursor when it moves to another page.
  let page = Math.min(pager.page, pageCount - 1)
  if (selectedIndex !== pager.selectedIndex) {
    page = selectedIndex < 0 ? page : Math.floor(selectedIndex / PAGE_SIZE)
    setPager({ page, selectedIndex })
  }
  const goToPage = (next: number) => setPager({ page: Math.min(Math.max(next, 0), pageCount - 1), selectedIndex })

  if (buckets.length === 0) return null
  const hourOffset = Math.floor((cursor % DAY_MS) / HOUR_MS) * HOUR_MS
  const noData = seriesStatus === 'error' || (series !== null && series.series.length === 0)

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div role="group" aria-label={S.pagerLabel} className="pointer-events-auto flex shrink-0 items-center gap-1">
        {pageCount > 1 && (
          <button
            type="button"
            aria-label={S.pagePrevious}
            disabled={page === 0}
            onClick={() => goToPage(page - 1)}
            className={`${ICON_BUTTON} shrink-0 text-white! hover:border-transparent! enabled:hover:text-primary! disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <CaretIcon direction="left" />
          </button>
        )}
      <ul
        aria-label={`${S.calendarLabel} (${S.granularity[granularity]})`}
        className="flex shrink-0 gap-1"
      >
        {buckets.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((bucket, j) => {
          const i = page * PAGE_SIZE + j
          const text = labelsFor(bucket, granularity, buckets[i - 1])
          const selected = cursor >= bucket.startMs && cursor < bucket.endMs
          const target = clampMs(bucket.startMs + (granularity === 'day' ? hourOffset : 0), start, end)
          return (
            <li key={bucket.startMs} className="shrink-0">
              <button
                type="button"
                aria-pressed={selected}
                aria-label={`${text.full} UTC`}
                onClick={() => setTimeCursor(toIsoUtc(target))}
                className={`relative flex h-14 w-12 flex-col items-center justify-center rounded-sm border ${FOCUS_RING} ${
                  selected
                    ? 'z-1 border-white bg-primary/75 text-on-primary'
                    : 'border-white bg-ink/75 text-base hover:bg-secondary/75'
                }`}
              >
                {selected && (
                  <span aria-hidden="true" className="absolute top-0.5 left-1/2 size-1 -translate-x-1/2 bg-on-primary" />
                )}
                <span className="h-3 font-mono text-[9px] uppercase leading-3 text-current opacity-70">{text.top}</span>
                <span className="font-mono text-sm font-semibold leading-4 tabular-nums">{text.main}</span>
                <span className="h-3 font-mono text-[9px] uppercase leading-3 text-current opacity-70">{text.bottom}</span>
              </button>
            </li>
          )
        })}
      </ul>
        {pageCount > 1 && (
          <button
            type="button"
            aria-label={S.pageNext}
            disabled={page === pageCount - 1}
            onClick={() => goToPage(page + 1)}
            className={`${ICON_BUTTON} shrink-0 text-white! hover:border-transparent! enabled:hover:text-primary! disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <CaretIcon direction="right" />
          </button>
        )}
      </div>
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
      ) : null}
    </div>
  )
}
