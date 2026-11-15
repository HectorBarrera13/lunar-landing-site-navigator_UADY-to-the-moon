import { pointColor, pointLabel } from '@/lib/pointColors'
import { useAppStore } from '@/store'
import type { FocusedLocation } from '@/types'
import { formatLat, formatLon } from './formatCoords'
import { POINT_INFO_STRINGS as S } from './strings'
import type { CompareResult } from './useCompareResults'

const LIGHT_ICON = { green: '✔', orange: '⚠', red: '✖' } as const

interface CompareCardProps {
  location: FocusedLocation
  result: CompareResult | undefined
  /** 1-based position by Suitability Index; null while loading or failed. */
  rank: number | null
}

export default function CompareCard({ location, result, rank }: CompareCardProps) {
  const removeFromCompare = useAppStore((s) => s.removeFromCompare)
  const color = pointColor(location.colorIndex)
  const title = location.name ?? pointLabel(location.colorIndex)
  const headingId = `cc-${location.id}`
  const data = result?.data ?? null

  return (
    <article aria-labelledby={headingId} className="rounded-lg border border-star-100/15 bg-space-800/60 p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 id={headingId} className="flex items-center gap-2 font-semibold">
          {rank !== null && <span className="text-star-100/70">#{rank}</span>}
          {color !== null && (
            <span
              aria-hidden="true"
              style={{ backgroundColor: color }}
              className="inline-block size-3 rounded-full ring-1 ring-star-100/60"
            />
          )}
          {title}
        </h3>
        <button
          type="button"
          onClick={() => removeFromCompare(location.id)}
          aria-label={`${S.remove}: ${title}`}
          className="-m-1 rounded p-1 hover:bg-star-100/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
        >
          <span aria-hidden="true">&#x2715;</span>
        </button>
      </div>
      <p className="mt-1 text-xs text-star-100/70">
        {formatLat(location.latDeg)}, {formatLon(location.lonDeg)}
      </p>

      {result === undefined && <p className="mt-3" role="status">{S.loading}</p>}
      {result?.failed === true && <p className="mt-3" role="alert">{S.error}</p>}

      {data !== null && (
        <div className="mt-3 space-y-3">
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-star-100/70">{S.suitabilityIndex}</span>
            <span className="text-2xl font-semibold">{data.suitability_index}</span>
            <span className="inline-flex items-center gap-1 rounded border border-star-100/40 px-1.5 py-0.5 text-[10px] uppercase">
              <span aria-hidden="true">&#x26A0;</span>
              {S.mockBadge}
            </span>
            <span className="inline-flex items-center gap-1 rounded border border-star-100/40 px-1.5 py-0.5 text-xs">
              <span aria-hidden="true">{LIGHT_ICON[data.traffic_light]}</span>
              {S.trafficLight[data.traffic_light]}
            </span>
          </p>

          <section aria-labelledby={`${headingId}-criteria`}>
            <h4 id={`${headingId}-criteria`} className="font-semibold">{S.criteria}</h4>
            <ul className="mt-1 space-y-2">
              {data.criteria.map((c) => (
                <li key={c.code}>
                  <div className="flex justify-between">
                    <span>{c.label}</span>
                    <span>{c.contribution}</span>
                  </div>
                  <div className="text-xs text-star-100/70">
                    {S.weight} {c.weight} &middot; {c.detail}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby={`${headingId}-vetoes`}>
            <h4 id={`${headingId}-vetoes`} className="font-semibold">{S.vetoes}</h4>
            {data.vetoes.length === 0 ? (
              <p className="mt-1 text-xs">{S.noVetoes}</p>
            ) : (
              <ul className="mt-1 space-y-1">
                {data.vetoes.map((v) => (
                  <li key={v.code} className="flex gap-2 text-xs">
                    <span aria-hidden="true">&#x26D4;</span>
                    <span>{v.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <p className="text-xs text-star-100/70">{S.mockWarning}</p>
        </div>
      )}
    </article>
  )
}
