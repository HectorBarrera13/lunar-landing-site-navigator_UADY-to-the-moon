import { useEffect, useState } from 'react'
import { evaluate } from '@/lib/api'
import { useAppStore } from '@/store'
import type { FocusedLocation } from '@/types'
import { failureFor } from './useCompareResults'
import type { CompareResult } from './useCompareResults'

export type FocusResult = CompareResult

const EMPTY: FocusResult = { data: null, failed: false, noData: false }

/** Evaluates the focused location for the current mission window. */
export function useFocusEvaluation(focus: FocusedLocation | null): FocusResult {
  const t0 = useAppStore((s) => s.mission.t0)
  const tf = useAppStore((s) => s.mission.tf)
  const [result, setResult] = useState<FocusResult>(EMPTY)

  useEffect(() => {
    setResult(EMPTY)
    if (focus === null || t0 === null || tf === null) return
    let cancelled = false
    evaluate({
      site_id: focus.kind === 'site' ? focus.id : null,
      lat_deg: focus.kind === 'point' ? focus.latDeg : null,
      lon_deg: focus.kind === 'point' ? focus.lonDeg : null,
      start_utc: t0,
      end_utc: tf,
    })
      .then((data) => {
        if (!cancelled) setResult({ data, failed: false, noData: false })
      })
      .catch((error: unknown) => {
        if (!cancelled) setResult(failureFor(error))
      })
    return () => {
      cancelled = true
    }
  }, [focus, t0, tf])

  return result
}
