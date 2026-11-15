import { useEffect, useState } from 'react'
import { ApiError, evaluate } from '@/lib/api'
import type { EvaluateResponse, FocusedLocation } from '@/types'

export type CompareResult = {
  data: EvaluateResponse | null
  failed: boolean
  /** The backend answered 404/422: no precomputed data (or no points) for this window. */
  noData: boolean
}

export interface EvaluationWindow {
  t0: string
  tf: string
}

export function failureFor(error: unknown): CompareResult {
  const noData = error instanceof ApiError && (error.status === 404 || error.status === 422)
  return { data: null, failed: true, noData }
}

/** Evaluates each compared location for the given window; `null` skips the requests. */
export function useCompareResults(
  compared: readonly FocusedLocation[],
  evaluationWindow: EvaluationWindow | null,
): Record<string, CompareResult> {
  const [results, setResults] = useState<Record<string, CompareResult>>({})
  const t0 = evaluationWindow?.t0 ?? null
  const tf = evaluationWindow?.tf ?? null

  useEffect(() => {
    setResults({})
    if (t0 === null || tf === null) return
    let cancelled = false
    const settle = (id: string, result: CompareResult) => {
      if (cancelled) return
      setResults((prev) => ({ ...prev, [id]: result }))
    }
    for (const loc of compared) {
      evaluate({
        site_id: loc.kind === 'site' ? loc.id : null,
        lat_deg: loc.kind === 'point' ? loc.latDeg : null,
        lon_deg: loc.kind === 'point' ? loc.lonDeg : null,
        start_utc: t0,
        end_utc: tf,
      })
        .then((data) => settle(loc.id, { data, failed: false, noData: false }))
        .catch((error: unknown) => settle(loc.id, failureFor(error)))
    }
    return () => {
      cancelled = true
    }
  }, [compared, t0, tf])

  return results
}
