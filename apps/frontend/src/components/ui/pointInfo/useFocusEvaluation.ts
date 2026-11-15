import { useEffect, useState } from 'react'
import { evaluate } from '@/lib/api'
import { useAppStore } from '@/store'
import type { EvaluateResponse, FocusedLocation } from '@/types'

export type FocusResult = { data: EvaluateResponse | null; failed: boolean }

/** Evaluates the focused location for the current mission window. */
export function useFocusEvaluation(focus: FocusedLocation | null): FocusResult {
  const t0 = useAppStore((s) => s.mission.t0)
  const tf = useAppStore((s) => s.mission.tf)
  const [result, setResult] = useState<FocusResult>({ data: null, failed: false })

  useEffect(() => {
    if (focus === null || t0 === null || tf === null) {
      setResult({ data: null, failed: false })
      return
    }
    let cancelled = false
    setResult({ data: null, failed: false })
    evaluate({
      site_id: focus.kind === 'site' ? focus.id : null,
      lat_deg: focus.kind === 'point' ? focus.latDeg : null,
      lon_deg: focus.kind === 'point' ? focus.lonDeg : null,
      start_utc: t0,
      end_utc: tf,
    })
      .then((data) => {
        if (!cancelled) setResult({ data, failed: false })
      })
      .catch(() => {
        if (!cancelled) setResult({ data: null, failed: true })
      })
    return () => {
      cancelled = true
    }
  }, [focus, t0, tf])

  return result
}
