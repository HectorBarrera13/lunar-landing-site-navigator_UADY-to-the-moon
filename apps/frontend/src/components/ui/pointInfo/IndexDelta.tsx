import { MONO_NUM } from '@/components/ui/common/styles'
import { POINT_INFO_STRINGS as S } from './strings'

/** Shifted minus base Suitability Index, with an arrow and text (not color alone). */
export default function IndexDelta({ base, shifted, days }: { base: number; shifted: number; days: number }) {
  const delta = shifted - base
  const icon = delta > 0 ? '▲' : delta < 0 ? '▼' : '='
  const value = delta === 0 ? S.noChange : `${delta > 0 ? '+' : '−'}${Math.abs(delta)} ${S.points}`
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink">
      <span aria-hidden="true" className="text-primary">
        {icon}
      </span>
      <span className="text-ink-subtle">{S.delta}</span>
      <span className={`font-semibold ${MONO_NUM}`}>{value}</span>
      <span className="sr-only">
        (+{days} {S.daysLong})
      </span>
    </p>
  )
}
