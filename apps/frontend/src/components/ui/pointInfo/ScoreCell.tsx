import { MONO_NUM } from '@/components/ui/common/styles'
import { POINT_INFO_STRINGS as S } from './strings'
import TrafficLightBadge from './TrafficLightBadge'
import type { CompareResult } from './useCompareResults'

/** One Suitability Index readout (base or shifted window) in a compare card. */
export default function ScoreCell({ label, result }: { label: string | null; result: CompareResult | undefined }) {
  const data = result?.data ?? null
  return (
    <div className="border border-line bg-chassis p-2">
      {label !== null && (
        <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-subtle">{label}</p>
      )}
      {result === undefined ? (
        <p role="status" className="mt-1 text-xs text-ink-muted">
          {S.loading}
        </p>
      ) : data === null ? (
        <p role="alert" className="mt-1 text-xs text-ink">
          {result.noData ? S.noWindowData : S.error}
        </p>
      ) : (
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`text-2xl font-bold leading-7 ${MONO_NUM}`}>{data.suitability_index}</span>
          <TrafficLightBadge light={data.traffic_light} />
        </div>
      )}
    </div>
  )
}
