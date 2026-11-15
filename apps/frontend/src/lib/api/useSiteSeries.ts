import { useEffect } from 'react'
import { useAppStore } from '@/store'
import { getSiteSeries } from './client'

/** Loads the precomputed series for the focused site (or the first site with coordinates). */
export function useMissionSeries(): void {
  const focus = useAppStore((s) => s.focus)
  const sites = useAppStore((s) => s.sites)
  const t0 = useAppStore((s) => s.mission.t0)
  const tf = useAppStore((s) => s.mission.tf)
  const setSiteSeries = useAppStore((s) => s.setSiteSeries)
  const setSeriesStatus = useAppStore((s) => s.setSeriesStatus)

  const focusedSiteId = focus?.kind === 'site' ? focus.id : null
  const defaultSiteId = sites.find((site) => site.lat !== null && site.lon !== null)?.id ?? null
  const siteId = focusedSiteId ?? defaultSiteId

  useEffect(() => {
    if (siteId === null || t0 === null || tf === null) {
      setSiteSeries(null)
      return
    }
    let cancelled = false
    setSeriesStatus('loading')
    getSiteSeries(siteId, t0, tf)
      .then((series) => {
        if (!cancelled) setSiteSeries(series)
      })
      .catch(() => {
        if (cancelled) return
        setSiteSeries(null)
        setSeriesStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [siteId, t0, tf, setSiteSeries, setSeriesStatus])
}
