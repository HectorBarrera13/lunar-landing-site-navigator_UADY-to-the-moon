import { FOCUS_RING, ICON_BUTTON, LABEL, MONO_NUM } from '@/components/ui/common/styles'
import { pointColor, pointLabel } from '@/lib/pointColors'
import { siteImage } from '@/lib/siteImages'
import { useAppStore } from '@/store'
import type { ComparedLocation } from '@/types'
import { formatLat, formatLon } from './formatCoords'
import CriterionRow from './CriterionRow'
import IndexDelta from './IndexDelta'
import NearestSiteNote from './NearestSiteNote'
import ScoreCell from './ScoreCell'
import { POINT_INFO_STRINGS as S } from './strings'
import TrafficLightBadge from './TrafficLightBadge'
import type { CompareResult } from './useCompareResults'

interface CompareCardProps {
  location: ComparedLocation
  result: CompareResult | undefined
  /** Shifted-window evaluation for the "+N days" delay; null when the delay is off. */
  shift: { days: number; result: CompareResult | undefined } | null
  /** 1-based position by base Suitability Index; null while loading or failed. */
  rank: number | null
  /** Opens the 2D landing view focused on this location. */
  onOpenLanding: (location: ComparedLocation) => void
}

export default function CompareCard({ location, result, shift, rank, onOpenLanding }: CompareCardProps) {
  const removeFromCompare = useAppStore((s) => s.removeFromCompare)
  const color = pointColor(location.colorIndex)
  const title = location.name ?? pointLabel(location.colorIndex)
  const headingId = `cc-${location.id}`
  const data = result?.data ?? null
  const shiftedData = shift?.result?.data ?? null
  const imagery = siteImage(location.id)
  const gradientId = `cc-grad-${location.id}`

  return (
    <article aria-labelledby={headingId} className="border border-line bg-panel text-sm">
      <button
        type="button"
        onClick={() => onOpenLanding(location)}
        aria-label={`${S.openLanding}: ${title}`}
        className={`relative block h-16 w-full overflow-hidden border-b border-line text-left focus:outline-none ${FOCUS_RING}`}
      >
        {imagery !== null ? (
          <img src={imagery.src} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <svg aria-hidden="true" viewBox="0 0 120 32" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#3a4046" />
                <stop offset="0.5" stopColor="#1a1e22" />
                <stop offset="1" stopColor="#4a5158" />
              </linearGradient>
            </defs>
            <rect width="120" height="32" fill={`url(#${gradientId})`} />
            <path d="M0 22 Q 14 12 30 20 T 62 18 T 94 22 T 120 16 V32 H0 Z" fill="#0d1013" opacity="0.55" />
            <path d="M0 27 Q 20 20 40 26 T 80 24 T 120 28 V32 H0 Z" fill="#0d1013" opacity="0.75" />
          </svg>
        )}
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-base/85 via-base/10 to-transparent" />
        <span className="absolute bottom-1 left-2 flex items-center gap-2">
          {rank !== null && <span className={`font-display text-xs font-semibold text-primary ${MONO_NUM}`}>#{rank}</span>}
          {data !== null && <TrafficLightBadge light={data.traffic_light} />}
        </span>
      </button>

      <div className="flex h-8 items-center justify-between gap-2 border-b border-line pr-1 pl-3">
        <h3
          id={headingId}
          className="flex min-w-0 items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.14em]"
        >
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
                    <CriterionRow criterion={c} />
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
