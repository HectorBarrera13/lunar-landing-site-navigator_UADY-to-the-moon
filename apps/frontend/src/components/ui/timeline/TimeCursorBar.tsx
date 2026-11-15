import { useMemo, useState } from 'react'
import { MOCK_WINDOW } from '@/lib/api'
import { TIMELINE_STRINGS } from './strings'
import ViewToggle from './ViewToggle'

const DAY_MS = 86_400_000
const WEEKDAY = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' })
const MONTH = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
const FULL = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeZone: 'UTC' })

function buildDays(startUtc: string, endUtc: string): Date[] {
  const start = Date.parse(startUtc)
  const end = Date.parse(endUtc)
  const days: Date[] = []
  for (let t = start; t <= end; t += DAY_MS) days.push(new Date(t))
  return days
}

export default function TimeCursorBar() {
  const days = useMemo(() => buildDays(MOCK_WINDOW.start_utc, MOCK_WINDOW.end_utc), [])
  const [selected, setSelected] = useState<number>(0)

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
      <div className="flex items-center gap-3 border-b border-star-100/10 bg-space-900/80 px-4 py-2 backdrop-blur">
        <ul
          aria-label={TIMELINE_STRINGS.calendarLabel}
          className="pointer-events-auto flex flex-1 gap-1 overflow-x-auto"
        >
          {days.map((d, i) => {
            const newMonth = i === 0 || d.getUTCMonth() !== days[i - 1].getUTCMonth()
            const isSel = i === selected
            return (
              <li key={d.getTime()} className="shrink-0">
                <button
                  type="button"
                  aria-pressed={isSel}
                  aria-label={`${FULL.format(d)} UTC`}
                  onClick={() => setSelected(i)}
                  className={`flex w-12 flex-col items-center rounded px-1 py-1 text-star-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 ${isSel ? 'bg-accent-400/20 ring-2 ring-accent-400' : 'hover:bg-star-100/10'}`}
                >
                  <span className="text-[10px] uppercase text-star-100/70">
                    {newMonth ? MONTH.format(d) : ' '}
                  </span>
                  <span className="text-sm font-semibold">{d.getUTCDate()}</span>
                  <span className="text-[10px] text-star-100/70">{WEEKDAY.format(d)}</span>
                  <span aria-hidden="true" className={`mt-0.5 h-0.5 w-4 rounded ${isSel ? 'bg-accent-400' : 'bg-transparent'}`} />
                </button>
              </li>
            )
          })}
        </ul>
        <ViewToggle />
      </div>
    </div>
  )
}
