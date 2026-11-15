import { ICON_BUTTON, LABEL } from '@/components/ui/common/styles'
import { POINT_INFO_STRINGS as S } from './strings'

interface WindowOffsetControlProps {
  days: number
  maxDays: number
  onChange: (days: number) => void
}

/** "+N days" delay stepper; 0 turns the comparison off. */
export default function WindowOffsetControl({ days, maxDays, onChange }: WindowOffsetControlProps) {
  const set = (value: number) => onChange(Math.min(maxDays, Math.max(0, value)))
  return (
    <div role="group" aria-label={S.offsetGroup} className="flex flex-wrap items-center gap-2">
      <span className={LABEL}>{S.offsetTitle}</span>
      <div className="flex items-center overflow-hidden rounded border border-line bg-base">
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
      {days >= maxDays && <p className="w-full text-[11px] text-ink-subtle">{S.offsetLimit}</p>}
    </div>
  )
}
