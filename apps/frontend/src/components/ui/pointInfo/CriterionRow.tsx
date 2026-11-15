import { MONO_NUM } from '@/components/ui/common/styles'
import type { Criterion } from '@/types'
import { POINT_INFO_STRINGS as S } from './strings'

/** Monochrome glyphs, consistent with the horizon panel conventions; fallback for future codes. */
const GLYPH: Record<string, string> = {
  power: '☉',
  communication: '⊕',
  slope: '▲',
  landing_zone: '◎',
}
const TONE: Record<string, string> = {
  power: 'text-sun',
  communication: 'text-earth',
}

/**
 * One criterion row: glyph + label, contribution and achievement %, a level bar
 * (decorative; the numbers carry the meaning) and the weight/detail line.
 */
export default function CriterionRow({ criterion }: { criterion: Criterion }) {
  const percent = Math.round(criterion.normalized * 100)
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex min-w-0 items-center gap-1.5">
          <span aria-hidden="true" className={`leading-none ${TONE[criterion.code] ?? 'text-ink-muted'}`}>
            {GLYPH[criterion.code] ?? '•'}
          </span>
          <span className="truncate">{criterion.label}</span>
        </span>
        <span className={`shrink-0 ${MONO_NUM}`}>
          {criterion.contribution.toFixed(2)}
          <span className="text-ink-subtle"> ({percent}%)</span>
        </span>
      </div>
      <div aria-hidden="true" className="mt-1 h-1 w-full overflow-hidden bg-line">
        <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-ink-subtle">
        {S.weight} <span className={MONO_NUM}>{criterion.weight}</span> · {criterion.detail}
      </p>
    </div>
  )
}
