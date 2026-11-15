import { useMemo } from 'react'
import { useAppStore } from '@/store'
import type { SiteTimeSeries } from '@/types'
import { TIMELINE_STRINGS } from './strings'
import ViewToggle from './ViewToggle'

const DAY_MS = 86_400_000
const WEEKDAY = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' })
const MONTH = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
const FULL = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeZone: 'UTC' })

interface DayVisibility {
  sunPercent: number | null
  earthPercent: number | null
}

function buildDays(startUtc: string, endUtc: string): Date[] {
  const start = Date.parse(startUtc)
  const end = Date.parse(endUtc)
  const days: Date[] = []
  for (let t = start; t <= end; t += DAY_MS) days.push(new Date(t))
  return days
}

function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Per UTC day, the share of series points with the Sun and the Earth above the horizon. */
function visibilityByDay(series: SiteTimeSeries | null): Map<string, DayVisibility> {
  const counts = new Map<string, { sun: number; earth: number; total: number }>()
  if (series === null) return new Map()
  for (const point of series.series) {
    const day = point.time_utc.slice(0, 10)
    const entry = counts.get(day) ?? { sun: 0, earth: 0, total: 0 }
    entry.total += 1
    if (point.sun_visible) entry.sun += 1
    if (point.earth_visible) entry.earth += 1
    counts.set(day, entry)
  }
  const result = new Map<string, DayVisibility>()
  for (const [day, entry] of counts) {
    result.set(day, {
      sunPercent: entry.total === 0 ? null : Math.round((100 * entry.sun) / entry.total),
      earthPercent: entry.total === 0 ? null : Math.round((100 * entry.earth) / entry.total),
    })
  }
  return result
}

function Band({ percent, tone, label }: { percent: number | null; tone: string; label: string }) {
  return (
    <span aria-hidden="true" className="flex h-1 w-8 overflow-hidden rounded-sm bg-star-100/15">
      <span
        className={`h-full ${tone}`}
        style={{ width: percent === null ? '0%' : `${percent}%` }}
        title={label}
      />
    </span>
  )
}

export default function TimeCursorBar() {
  const t0 = useAppStore((s) => s.mission.t0)
  const tf = useAppStore((s) => s.mission.tf)
  const timeCursor = useAppStore((s) => s.mission.timeCursor)
  const setTimeCursor = useAppStore((s) => s.setTimeCursor)
  const series = useAppStore((s) => s.siteSeries)

  const days = useMemo(() => (t0 !== null && tf !== null ? buildDays(t0, tf) : []), [t0, tf])
  const visibility = useMemo(() => visibilityByDay(series), [series])
  const selectedDay = timeCursor === null ? null : utcDay(new Date(timeCursor))

  if (days.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
      <div className="flex items-center gap-3 border-b border-star-100/10 bg-space-900/80 px-4 py-2 backdrop-blur">
        <ul
          aria-label={TIMELINE_STRINGS.calendarLabel}
          className="pointer-events-auto flex flex-1 gap-1 overflow-x-auto"
        >
          {days.map((d, i) => {
            const key = utcDay(d)
            const newMonth = i === 0 || d.getUTCMonth() !== days[i - 1].getUTCMonth()
            const isSel = key === selectedDay
            const day = visibility.get(key)
            const sunText = day?.sunPercent == null ? TIMELINE_STRINGS.noData : `${TIMELINE_STRINGS.sunBand} ${day.sunPercent}%`
            const earthText =
              day?.earthPercent == null ? TIMELINE_STRINGS.noData : `${TIMELINE_STRINGS.earthBand} ${day.earthPercent}%`
            return (
              <li key={d.getTime()} className="shrink-0">
                <button
                  type="button"
                  aria-pressed={isSel}
                  aria-label={`${FULL.format(d)} UTC; ${sunText}; ${earthText}`}
                  onClick={() => setTimeCursor(d.toISOString().replace('.000Z', 'Z'))}
                  className={`flex w-12 flex-col items-center rounded px-1 py-1 text-star-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 ${isSel ? 'bg-accent-400/20 ring-2 ring-accent-400' : 'hover:bg-star-100/10'}`}
                >
                  <span className="text-[10px] uppercase text-star-100/70">
                    {newMonth ? MONTH.format(d) : ' '}
                  </span>
                  <span className="text-sm font-semibold">{d.getUTCDate()}</span>
                  <span className="text-[10px] text-star-100/70">{WEEKDAY.format(d)}</span>
                  <span className="mt-1 flex flex-col items-center gap-0.5">
                    <Band percent={day?.sunPercent ?? null} tone="bg-amber-300" label={sunText} />
                    <Band percent={day?.earthPercent ?? null} tone="bg-sky-300" label={earthText} />
                  </span>
                  <span aria-hidden="true" className={`mt-0.5 h-0.5 w-4 rounded ${isSel ? 'bg-accent-400' : 'bg-transparent'}`} />
                </button>
              </li>
            )
          })}
        </ul>
        <ul aria-label={TIMELINE_STRINGS.legendLabel} className="hidden shrink-0 items-center gap-3 text-[10px] text-star-100/70 md:flex">
          <li className="flex items-center gap-1">
            <span aria-hidden="true" className="h-1 w-3 rounded-sm bg-amber-300" />
            <span aria-hidden="true">&#x2609;</span> {TIMELINE_STRINGS.sunBand}
          </li>
          <li className="flex items-center gap-1">
            <span aria-hidden="true" className="h-1 w-3 rounded-sm bg-sky-300" />
            <span aria-hidden="true">&#x2295;</span> {TIMELINE_STRINGS.earthBand}
          </li>
        </ul>
        <ViewToggle />
      </div>
    </div>
  )
}
