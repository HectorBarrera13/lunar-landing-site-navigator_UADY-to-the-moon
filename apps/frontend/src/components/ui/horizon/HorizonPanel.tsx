import { useEffect, useMemo, useRef, useState } from 'react'
import { getSiteSeries, MOCK_WINDOW } from '@/lib/api'
import { useAppStore } from '@/store'
import type { SeriesPoint, SiteTimeSeries } from '@/types'
import { horizonStrings as t } from './strings'
import { drawHorizon } from './drawHorizon'
import TimeSlider from './TimeSlider'

const MOCK_SITE_ID = 'mock-site-a'
const WIDTH = 720
const HEIGHT = 240

function nearestPoint(data: SiteTimeSeries, cursor: string | null): SeriesPoint | null {
  if (data.series.length === 0) return null
  const start = Date.parse(data.series[0].time_utc)
  const ms = cursor === null ? NaN : Date.parse(cursor)
  const idx = Number.isNaN(ms) ? 0 : Math.round((ms - start) / (data.time_step_minutes * 60_000))
  return data.series[Math.min(data.series.length - 1, Math.max(0, idx))]
}

function bodyStatus(visible: boolean, elevation: number): string {
  if (visible) return t.visible
  return elevation < 0 ? t.belowHorizon : t.hiddenByTerrain
}

export default function HorizonPanel(): React.JSX.Element {
  const t0 = useAppStore((s) => s.mission.t0)
  const tf = useAppStore((s) => s.mission.tf)
  const timeCursor = useAppStore((s) => s.mission.timeCursor)
  const setMissionWindow = useAppStore((s) => s.setMissionWindow)
  const [data, setData] = useState<SiteTimeSeries | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (t0 === null || tf === null) setMissionWindow(MOCK_WINDOW.start_utc, MOCK_WINDOW.end_utc)
  }, [t0, tf, setMissionWindow])

  useEffect(() => {
    let cancelled = false
    void getSiteSeries(MOCK_SITE_ID, MOCK_WINDOW.start_utc, MOCK_WINDOW.end_utc).then((d) => {
      if (!cancelled) setData(d)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const point = useMemo(() => (data ? nearestPoint(data, timeCursor) : null), [data, timeCursor])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data) return
    drawHorizon(canvas, data.horizon_profile_deg, point, WIDTH, HEIGHT)
  }, [data, point])

  return (
    <section
      aria-labelledby="horizon-title"
      className="w-full max-w-3xl rounded-lg border border-white/10 bg-space-900/85 p-3 text-star-100 backdrop-blur"
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 id="horizon-title" className="text-sm font-semibold">
          {t.panelTitle}
          {data ? ` - ${data.name}` : ''}
        </h2>
        <span className="rounded border border-accent-400/50 px-1.5 py-0.5 text-xs text-accent-400">{t.mockBadge}</span>
      </div>
      {data === null ? (
        <p role="status" className="py-8 text-center text-sm">{t.loading}</p>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={t.canvasLabel}
            className="block h-auto w-full rounded bg-space-950"
            style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
          />
          {point && (
            <ul className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <li>
                <span aria-hidden="true">{'☀'} </span>
                <strong>{t.sun}</strong>: {bodyStatus(point.sun_visible, point.sun_elevation_deg)} ({t.azimuthShort}{' '}
                {point.sun_azimuth_deg.toFixed(1)}, {t.elevationShort} {point.sun_elevation_deg.toFixed(1)})
              </li>
              <li>
                <span aria-hidden="true">{'◖'} </span>
                <strong>{t.earth}</strong>: {bodyStatus(point.earth_visible, point.earth_elevation_deg)} ({t.azimuthShort}{' '}
                {point.earth_azimuth_deg.toFixed(1)}, {t.elevationShort} {point.earth_elevation_deg.toFixed(1)})
              </li>
            </ul>
          )}
          <TimeSlider />
        </>
      )}
    </section>
  )
}
