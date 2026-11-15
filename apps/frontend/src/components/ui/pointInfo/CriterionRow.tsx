import { useId, useState } from 'react'
import { FOCUS_RING, MONO_NUM } from '@/components/ui/common/styles'
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

/** Same bands as the traffic light (green ≥ 70, orange ≥ 40), applied to the 0–1 `normalized` value. */
function levelOf(normalized: number): keyof typeof S.level {
  if (normalized >= 0.7) return 'high'
  if (normalized >= 0.4) return 'medium'
  return 'low'
}

/**
 * One criterion row: glyph + descriptive title ("High Solar Power"). The achievement percent,
 * contribution, weight and detail sit in one container revealed by "More information".
 */
export default function CriterionRow({ criterion }: { criterion: Criterion }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const percent = Math.round(criterion.normalized * 100)
  const title = `${S.level[levelOf(criterion.normalized)]} ${S.criterionTitle[criterion.code] ?? criterion.label}`
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex min-w-0 items-center gap-1.5">
          <span aria-hidden="true" className={`leading-none ${TONE[criterion.code] ?? 'text-ink-muted'}`}>
            {GLYPH[criterion.code] ?? '•'}
          </span>
          <span className="truncate">{title}</span>
        </span>
        <button
          type="button"
          data-tour="criteria-more"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className={`shrink-0 text-[11px] text-secondary underline underline-offset-2 hover:text-primary ${FOCUS_RING}`}
        >
          {open ? S.lessInfo : S.moreInfo}
        </button>
      </div>
      {open && (
        <div id={panelId} className="mt-1 space-y-1 border border-line bg-chassis p-2 text-[11px] text-ink-subtle">
          <p className={`text-xs text-ink ${MONO_NUM}`}>
            {criterion.contribution.toFixed(2)}
            <span className="text-ink-subtle"> ({percent}%)</span>
          </p>
          <p>
            {S.weight} <span className={MONO_NUM}>{criterion.weight}</span> · {criterion.detail}
          </p>
        </div>
      )}
    </div>
  )
}
