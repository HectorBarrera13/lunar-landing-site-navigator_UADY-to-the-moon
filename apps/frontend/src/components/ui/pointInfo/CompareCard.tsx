import { ICON_BUTTON, LABEL, MONO_NUM } from '@/components/ui/common/styles'
import { pointColor, pointLabel } from '@/lib/pointColors'
import { useAppStore } from '@/store'
import type { ComparedLocation } from '@/types'
import { formatLat, formatLon } from './formatCoords'
import IndexDelta from './IndexDelta'
import NearestSiteNote from './NearestSiteNote'
import ScoreCell from './ScoreCell'
import { POINT_INFO_STRINGS as S } from './strings'
import type { CompareResult } from './useCompareResults'

interface CompareCardProps {
  location: ComparedLocation
  result: CompareResult | undefined
  /** Shifted-window evaluation for the "+N days" delay; null when the delay is off. */
  shift: { days: number; result: CompareResult | undefined } | null
  /** 1-based position by base Suitability Index; null while loading or failed. */
  rank: number | null
}

export default function CompareCard({ location, result, shift, rank }: CompareCardProps) {
  const removeFromCompare = useAppStore((s) => s.removeFromCompare)
  const color = pointColor(location.colorIndex)
  const title = location.name ?? pointLabel(location.colorIndex)
  const headingId = `cc-${location.id}`
  const data = result?.data ?? null
  const shiftedData = shift?.result?.data ?? null

  return (
    <article aria-labelledby={headingId} className="border border-line bg-panel text-sm">
      <div className="flex h-8 items-center justify-between gap-2 border-b border-line pr-1 pl-3">
        <h3
          id={headingId}
          className="flex min-w-0 items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.14em]"
        >
          {rank !== null && <span className={`text-primary ${MONO_NUM}`}>#{rank}</span>}
          {color !== null && (
            <span aria-hidden="true" style={{ backgroundColor: color }} className="inline-block size-2 shrink-0" />
          )}
          <span className="truncate">{title}</span>
        </h3>
        <button
          type="button"
          onClick={() => removeFromCompare(location.id)}
          aria-label={`${S.remove}: ${title}`}
          className={ICON_BUTTON}
        >
          <span aria-hidden="true">{'✕'}</span>
        </button>
      </div>

      <div className="space-y-3 p-3">
        {location.origin === 'nearest-site' && location.name !== null && <NearestSiteNote name={location.name} />}
        <p className={`text-[11px] text-ink-muted ${MONO_NUM}`}>
          {formatLat(location.latDeg)}, {formatLon(location.lonDeg)}
        </p>

        <div>
          <p className={LABEL}>{S.suitabilityIndex}</p>
          <div className={`mt-1 grid gap-2 ${shift === null ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <ScoreCell label={shift === null ? null : S.base} result={result} />
            {shift !== null && <ScoreCell label={`+${shift.days} ${S.days}`} result={shift.result} />}
          </div>
          {shift !== null && data !== null && shiftedData !== null && (
            <IndexDelta base={data.suitability_index} shifted={shiftedData.suitability_index} days={shift.days} />
          )}
        </div>

        {data !== null && (
          <>
            <section aria-labelledby={`${headingId}-criteria`}>
              <h4 id={`${headingId}-criteria`} className={LABEL}>
                {S.criteria}
                {shift !== null && <span className="text-ink-subtle"> · {S.baseDetails}</span>}
              </h4>
              <ul className="mt-1 space-y-1.5">
                {data.criteria.map((c) => (
                  <li key={c.code}>
                    <div className="flex justify-between gap-2 text-xs">
                      <span>{c.label}</span>
                      <span className={MONO_NUM}>{c.contribution}</span>
                    </div>
                    <div className="text-[11px] text-ink-subtle">
                      {S.weight} <span className={MONO_NUM}>{c.weight}</span> · {c.detail}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby={`${headingId}-vetoes`}>
              <h4 id={`${headingId}-vetoes`} className={LABEL}>
                {S.vetoes}
              </h4>
              {data.vetoes.length === 0 ? (
                <p className="mt-1 text-xs text-ink-muted">{S.noVetoes}</p>
              ) : (
                <ul className="mt-1 space-y-1">
                  {data.vetoes.map((v) => (
                    <li key={v.code} className="flex gap-2 text-xs">
                      <span aria-hidden="true" className="text-ink-muted">
                        {'⛔'}
                      </span>
                      <span>{v.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-subtle">
              {S.precision[data.precision]}
            </p>

            {data.warnings.length > 0 && (
              <section aria-label={S.warnings} className="text-[11px] text-ink-muted">
                <h4 className={LABEL}>{S.warnings}</h4>
                <ul className="mt-1 space-y-1">
                  {data.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </article>
  )
}
