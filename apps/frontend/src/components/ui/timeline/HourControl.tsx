import { ICON_BUTTON, LABEL, segmentClass } from '@/components/ui/common/styles'
import { HOUR_MS, clampMs, toIsoUtc } from '@/lib/mission'
import { useAppStore } from '@/store'
import { TIMELINE_STRINGS as S } from './strings'

const QUICK_HOURS = [0, 6, 12, 18] as const

function pad(hour: number): string {
  return String(hour).padStart(2, '0')
}

/** UTC hour of the time cursor: +-1 h stepper and 00/06/12/18 chips within the selected day. */
export default function HourControl() {
  const t0 = useAppStore((s) => s.mission.t0)
  const tf = useAppStore((s) => s.mission.tf)
  const timeCursor = useAppStore((s) => s.mission.timeCursor)
  const setTimeCursor = useAppStore((s) => s.setTimeCursor)

  if (t0 === null || tf === null || timeCursor === null) return null
  const start = Date.parse(t0)
  const end = Date.parse(tf)
  const cursor = Date.parse(timeCursor)
  const hour = new Date(cursor).getUTCHours()
  const dayStart = cursor - (cursor % 86_400_000)

  const go = (ms: number) => setTimeCursor(toIsoUtc(clampMs(ms, start, end)))

  return (
    <div role="group" aria-label={S.hourGroupLabel} className="pointer-events-auto flex shrink-0 items-center gap-1.5">
      <span className={LABEL}>{S.hourLabel}</span>
      <div className="flex items-center border border-line bg-base">
        <button
          type="button"
          aria-label={S.hourBack}
          disabled={cursor - HOUR_MS < start}
          onClick={() => go(cursor - HOUR_MS)}
          className={`${ICON_BUTTON} disabled:cursor-not-allowed disabled:text-line-strong`}
        >
          <span aria-hidden="true">{'−'}</span>
        </button>
        <output
          aria-live="polite"
          aria-label={S.cursorTime}
          className="min-w-20 px-1 text-center font-mono text-sm font-semibold tabular-nums text-secondary"
        >
          {pad(hour)}:00 <span className="text-[10px] font-normal text-ink-subtle">{S.utc}</span>
        </output>
        <button
          type="button"
          aria-label={S.hourForward}
          disabled={cursor + HOUR_MS > end}
          onClick={() => go(cursor + HOUR_MS)}
          className={`${ICON_BUTTON} disabled:cursor-not-allowed disabled:text-line-strong`}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
      <div className="flex border border-line">
        {QUICK_HOURS.map((h) => {
          const target = dayStart + h * HOUR_MS
          const outside = target < start || target > end
          return (
            <button
              key={h}
              type="button"
              aria-pressed={hour === h}
              aria-label={`${S.setHour} ${pad(h)}:00 ${S.utc}`}
              disabled={outside}
              onClick={() => go(target)}
              className={`${segmentClass(hour === h)} disabled:cursor-not-allowed disabled:text-line-strong`}
            >
              {pad(h)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
