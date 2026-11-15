import { ICON_BUTTON, LABEL, segmentClass } from '@/components/ui/common/styles'
import { POINT_INFO_STRINGS as S } from './strings'

/** PROVISIONAL (round 3 proposal; FR-14 names "+7 days"): quick delay presets in days. */
export const OFFSET_PRESETS = [1, 3, 7, 14] as const

interface WindowOffsetControlProps {
  days: number
  maxDays: number
  onChange: (days: number) => void
}

/** "+N days" delay: stepper plus quick presets; 0 turns the comparison off. */
export default function WindowOffsetControl({ days, maxDays, onChange }: WindowOffsetControlProps) {
  const set = (value: number) => onChange(Math.min(maxDays, Math.max(0, value)))
  return (
    <div role="group" aria-label={S.offsetGroup} className="flex flex-wrap items-center gap-2">
      <span className={LABEL}>{S.offsetTitle}</span>
      <div className="flex items-center border border-line bg-base">
        <button
          type="button"
          aria-label={S.offsetLess}
          disabled={days <= 0}
          onClick={() => set(days - 1)}
          className={`${ICON_BUTTON} disabled:cursor-not-allowed disabled:text-line-strong`}
        >
          <span aria-hidden="true">{'−'}</span>
        </button>
        <output
          aria-live="polite"
          aria-label={S.offsetLabel}
          className="min-w-14 text-center font-mono text-sm font-semibold tabular-nums text-secondary"
        >
          +{days} {S.days}
        </output>
        <button
          type="button"
          aria-label={S.offsetMore}
          disabled={days >= maxDays}
          onClick={() => set(days + 1)}
          className={`${ICON_BUTTON} disabled:cursor-not-allowed disabled:text-line-strong`}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
      <div className="flex border border-line">
        <button type="button" aria-pressed={days === 0} onClick={() => set(0)} className={segmentClass(days === 0)}>
          {S.offsetOff}
        </button>
        {OFFSET_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={days === preset}
            aria-label={`+${preset} ${S.daysLong}`}
            disabled={preset > maxDays}
            onClick={() => set(preset)}
            className={`${segmentClass(days === preset)} disabled:cursor-not-allowed disabled:text-line-strong`}
          >
            +{preset}
          </button>
        ))}
      </div>
      {maxDays < OFFSET_PRESETS[OFFSET_PRESETS.length - 1] && (
        <p className="w-full text-[11px] text-ink-subtle">{S.offsetLimit}</p>
      )}
    </div>
  )
}
