import { useMemo } from 'react'
import { CHIP, ICON_BUTTON, PANEL, SECTION_TITLE } from '@/components/ui/common/styles'
import { formatUtc } from '@/lib/time'
import { useAppStore } from '@/store'
import BodyReadout, { readBody } from './BodyReadout'
import HorizonChart, { chartGeometry } from './HorizonChart'
import { cursorIndexFor, nextEvents } from './horizonMath'
import { HORIZON_STRINGS as S } from './strings'

const PANEL_POSITION =
  'pointer-events-auto absolute bottom-4 left-4 z-10 max-h-[calc(100dvh-9rem)] w-[560px] max-w-[calc(100vw-2rem)] overflow-y-auto p-3'

function signedText(value: number): string {
  return `${value >= 0 ? 'plus' : 'minus'} ${Math.abs(value).toFixed(1)}`
}

export default function HorizonPanel() {
  const series = useAppStore((s) => s.siteSeries)
  const seriesStatus = useAppStore((s) => s.seriesStatus)
  const timeCursor = useAppStore((s) => s.mission.timeCursor)
  const setHorizonPanelOpen = useAppStore((s) => s.setHorizonPanelOpen)

  const geometry = useMemo(
    () => (series === null || series.series.length === 0 ? null : chartGeometry(series)),
    [series],
  )

  const view = useMemo(() => {
    if (series === null || series.series.length === 0) return null
    const index = cursorIndexFor(series.series, timeCursor)
    const point = series.series[index]
    return {
      point,
      cursorMs: Date.parse(point.time_utc),
      sun: readBody(point, series.horizon_profile_deg, 'sun'),
      earth: readBody(point, series.horizon_profile_deg, 'earth'),
      sunEvents: nextEvents(series.series, index, 'sun'),
      earthEvents: nextEvents(series.series, index, 'earth'),
    }
  }, [series, timeCursor])

  if (series === null || geometry === null || view === null) {
    const message =
      seriesStatus === 'loading'
        ? S.loading
        : seriesStatus === 'error' || (series !== null && series.series.length === 0)
          ? S.noData
          : S.unavailable
    return (
      <aside aria-label={S.title} className={`${PANEL} ${PANEL_POSITION}`}>
        <div className="flex items-center justify-between gap-2">
          <h2 className={SECTION_TITLE}>{S.title}</h2>
          <button type="button" onClick={() => setHorizonPanelOpen(false)} aria-label={S.close} className={ICON_BUTTON}>
            <span aria-hidden="true">{'✕'}</span>
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-muted" role="status">
          <span aria-hidden="true">{'ⓘ'} </span>
          {message}
        </p>
      </aside>
    )
  }

  const { point, sun, earth } = view
  const exaggeration = geometry.exaggeration.toFixed(1)
  const summary = [
    `${S.title} for ${series.name} ${S.atTime} ${formatUtc(point.time_utc)}.`,
    `${S.sun}: ${sun.visible ? S.visible : S.hidden}, elevation ${signedText(sun.elevationDeg)} degrees, ${signedText(sun.marginDeg)} degrees relative to terrain, azimuth ${sun.azimuthDeg.toFixed(1)} degrees.`,
    `${S.earth}: ${earth.visible ? S.visible : S.hidden}, elevation ${signedText(earth.elevationDeg)} degrees, ${signedText(earth.marginDeg)} degrees relative to terrain, azimuth ${earth.azimuthDeg.toFixed(1)} degrees.`,
    `${S.source[series.horizon_source]}. ${S.exaggeration} ${exaggeration}. ${S.discNotToScale}.`,
  ].join(' ')

  return (
    <figure aria-label={S.title} className={`${PANEL} ${PANEL_POSITION} m-0`}>
      <figcaption className="flex items-center justify-between gap-2 border-b border-line pb-1.5">
        <h2 className={SECTION_TITLE}>
          {S.title} <span className="text-primary">· {series.name}</span>
        </h2>
        <div className="flex items-center gap-1">
          <span className="font-mono text-[11px] tabular-nums text-secondary">{formatUtc(point.time_utc)}</span>
          <button type="button" onClick={() => setHorizonPanelOpen(false)} aria-label={S.close} className={ICON_BUTTON}>
            <span aria-hidden="true">{'✕'}</span>
          </button>
        </div>
      </figcaption>
      <p className="sr-only">{summary}</p>

      <div className="mt-2">
        <HorizonChart series={series} geometry={geometry} cursorPoint={point} />
      </div>

      <ul className="mt-1.5 flex flex-wrap items-center gap-1.5" aria-label={S.notesLabel}>
        <li className={CHIP}>
          <span aria-hidden="true" className="size-1 bg-primary" />
          {S.source[series.horizon_source]}
        </li>
        <li className={CHIP}>
          {S.stepPrefix} <span className="tabular-nums">{series.time_step_minutes}</span> {S.minutes}
        </li>
        <li className={CHIP}>
          {S.exaggeration} <span className="tabular-nums">×{exaggeration}</span>
        </li>
        <li className={CHIP}>{S.discNotToScale}</li>
      </ul>
      <p className="mt-1 font-mono text-[10px] text-ink-subtle">
        {S.solidVisible} · {S.dashedHidden} · {S.zeroLine}
      </p>

      <div aria-label={S.bodiesLabel} role="group" className="mt-2 grid grid-cols-2 gap-2">
        <BodyReadout body="sun" reading={sun} events={view.sunEvents} cursorMs={view.cursorMs} />
        <BodyReadout body="earth" reading={earth} events={view.earthEvents} cursorMs={view.cursorMs} />
      </div>
    </figure>
  )
}
