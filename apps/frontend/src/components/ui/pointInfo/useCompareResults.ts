import { useEffect, useRef, useState } from 'react'
import { MOCK_WINDOW, evaluate } from '@/lib/api'
import { useAppStore } from '@/store'
import type { EvaluateResponse, FocusedLocation } from '@/types'

export type CompareResult = { data: EvaluateResponse | null; failed: boolean }

/** Evaluates each compared location once (cached by id) using the mission window at that moment. */
export function useCompareResults(compared: FocusedLocation[]): Record<string, CompareResult> {
  const [results, setResults] = useState<Record<string, CompareResult>>({})
  const requested = useRef(new Set<string>())
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    const ids = new Set(compared.map((c) => c.id))
    for (const id of [...requested.current]) if (!ids.has(id)) requested.current.delete(id)
    setResults((prev) => {
      const keys = Object.keys(prev)
      if (keys.every((k) => ids.has(k))) return prev
      return Object.fromEntries(keys.filter((k) => ids.has(k)).map((k) => [k, prev[k]]))
    })

    const { t0, tf } = useAppStore.getState().mission
    for (const loc of compared) {
      if (requested.current.has(loc.id)) continue
      requested.current.add(loc.id)
      const settle = (result: CompareResult) => {
        if (!mounted.current || !requested.current.has(loc.id)) return
        setResults((prev) => ({ ...prev, [loc.id]: result }))
      }
      evaluate({
        site_id: loc.kind === 'site' ? loc.id : null,
        lat_deg: loc.kind === 'point' ? loc.latDeg : null,
        lon_deg: loc.kind === 'point' ? loc.lonDeg : null,
        start_utc: t0 ?? MOCK_WINDOW.start_utc,
        end_utc: tf ?? MOCK_WINDOW.end_utc,
      })
        .then((data) => settle({ data, failed: false }))
        .catch(() => settle({ data: null, failed: true }))
    }
  }, [compared])

  return results
}
