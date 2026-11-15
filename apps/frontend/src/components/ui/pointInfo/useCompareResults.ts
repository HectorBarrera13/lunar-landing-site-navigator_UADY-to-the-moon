import { useEffect, useState } from 'react'
import { evaluate } from '@/lib/api'
import { useAppStore } from '@/store'
import type { EvaluateResponse, FocusedLocation } from '@/types'

export type CompareResult = { data: EvaluateResponse | null; failed: boolean }

/** Evaluates each compared location for the current mission window. */
export function useCompareResults(compared: FocusedLocation[]): Record<string, CompareResult> {
  const [results, setResults] = useState<Record<string, CompareResult>>({})
  const t0 = useAppStore((s) => s.mission.t0)
  const tf = useAppStore((s) => s.mission.tf)

  useEffect(() => {
    if (t0 === null || tf === null) return
    let cancelled = false
    setResults({})
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
        .then((data) => settle(loc.id, { data, failed: false }))
        .catch(() => settle(loc.id, { data: null, failed: true }))
    }
    return () => {
      cancelled = true
    }
  }, [compared, t0, tf])

  return results
}
