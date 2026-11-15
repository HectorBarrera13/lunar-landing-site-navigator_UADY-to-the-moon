import { useEffect, useId, useRef } from 'react'
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  CHIP,
  LABEL,
  MONO_NUM,
  PANEL,
  SECTION_TITLE,
} from '@/components/ui/common/styles'
import { formatLat, formatLon } from '@/components/ui/pointInfo/formatCoords'
import NearestSiteNote from '@/components/ui/pointInfo/NearestSiteNote'
import { POINT_INFO_STRINGS as P } from '@/components/ui/pointInfo/strings'
import TrafficLightBadge from '@/components/ui/pointInfo/TrafficLightBadge'
import { useFocusEvaluation } from '@/components/ui/pointInfo/useFocusEvaluation'
import { pointLabel } from '@/lib/pointColors'
import { MAX_COMPARED, useAppStore } from '@/store'
import LandingCanvas from './LandingCanvas'
import { MARGIN_M, MARGIN_RADIUS_M, ZONE_RADIUS_M, pixelsPerMeter } from './landingZone'
import MapLegend from './MapLegend'
import { MAP_STRINGS as S } from './strings'
import { useElementSize } from './useElementSize'

/**
 * FR-08 2D landing view, shown when `mode === '2d'`. It is an opaque overlay below the top bar;
 * the 3D Canvas stays mounted underneath so the camera state survives. The viewport sits right
 * of the 560 px horizon panel (bottom-left) and left of the compare sidebar when it is open.
 */
export default function LandingView() {
  const mode = useAppStore((s) => s.mode)
  if (mode !== '2d') return null
  return <LandingViewContent />
}

function LandingViewContent() {
  const focus = useAppStore((s) => s.focus)
  const focusOrigin = useAppStore((s) => s.focusOrigin)
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const compared = useAppStore((s) => s.compared)
  const setMode = useAppStore((s) => s.setMode)
  const addToCompare = useAppStore((s) => s.addToCompare)
  const openSidebar = useAppStore((s) => s.openSidebar)
  const { data, failed, noData } = useFocusEvaluation(focus)
  const drawingRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLButtonElement>(null)
  const size = useElementSize(drawingRef)
  const titleId = useId()
  const summaryId = useId()

  useEffect(() => {
    backRef.current?.focus()
  }, [])

  useEffect(() => {
    // Capture phase: runs before the sidebar's own Escape handler, so an open sidebar closes first.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || useAppStore.getState().sidebarOpen) return
      setMode('3d')
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [setMode])

  const pxPerM = pixelsPerMeter(size.width, size.height)
  const light = data?.traffic_light ?? null
  const name = focus === null ? '' : (focus.name ?? pointLabel(focus.colorIndex))
  const inCompare = focus !== null && compared.some((c) => c.id === focus.id)
  const full = !inCompare && compared.length >= MAX_COMPARED

  const strokeNote =
    data !== null ? S.zoneColored : failed ? (noData ? S.neutralNoData : S.neutralFailed) : S.neutralLoading
  const indexText =
    data !== null
      ? S.indexText(data.suitability_index, P.trafficLight[data.traffic_light])
      : `${P.suitabilityIndex}: ${failed ? (noData ? P.noWindowData : P.error) : P.loading}`

  return (
    <section aria-labelledby={titleId} className="absolute inset-x-0 top-28 bottom-0 z-5 bg-base text-ink">
      <div
        className={`${PANEL} absolute top-4 bottom-4 left-[calc(560px+2rem)] flex min-w-0 flex-col ${
          sidebarOpen ? 'right-[calc(384px+1rem)]' : 'right-4'
        }`}
      >
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-line px-3 py-2">
          <div className="min-w-0 space-y-1">
            <h2 id={titleId} className={SECTION_TITLE}>
              {S.title}
              {focus !== null && <span className="text-primary"> · {name}</span>}
            </h2>
            {focus !== null && (
              <p className={`text-[11px] text-secondary ${MONO_NUM}`}>
                <span className="sr-only">{P.latitude} </span>
                {formatLat(focus.latDeg)}
                <span aria-hidden="true"> · </span>
                <span className="sr-only">, {P.longitude} </span>
                {formatLon(focus.lonDeg)}
              </p>
            )}
            {focusOrigin === 'nearest-site' && focus?.name != null && <NearestSiteNote name={focus.name} />}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {focus !== null && (
              <div>
                <p className={LABEL}>{P.suitabilityIndex}</p>
                {data !== null ? (
                  <p className="mt-0.5 flex items-center gap-2">
                    <span className={`text-lg font-bold leading-6 ${MONO_NUM}`}>{data.suitability_index}</span>
                    <span className="font-mono text-[11px] text-primary">/100</span>
                    <TrafficLightBadge light={data.traffic_light} />
                  </p>
                ) : failed ? (
                  <p role="alert" className="mt-0.5 text-xs">
                    {noData ? P.noWindowData : P.error}
                  </p>
                ) : (
                  <p role="status" className="mt-0.5 text-xs text-ink-muted">
                    {P.loading}
                  </p>
                )}
              </div>
            )}
            {focus !== null && (
              <button
                type="button"
                onClick={inCompare ? openSidebar : addToCompare}
                disabled={full}
                className={BUTTON_SECONDARY}
              >
                {full ? P.comparisonFull : inCompare ? P.viewComparison : P.compare}
              </button>
            )}
            <button
              ref={backRef}
              type="button"
              onClick={() => setMode('3d')}
              aria-keyshortcuts="Escape"
              className={`${BUTTON_PRIMARY} gap-2`}
            >
              <span aria-hidden="true">{'←'}</span>
              {S.backToGlobe}
              <span aria-hidden="true" className="font-mono text-[10px] font-medium opacity-70">
                {S.backHint}
              </span>
            </button>
          </div>
        </header>

        <div ref={drawingRef} className="relative min-h-0 flex-1 overflow-hidden">
          {focus === null ? (
            <p role="status" className="p-4 text-sm text-ink-muted">
              {S.noFocus}
            </p>
          ) : (
            <>
              <LandingCanvas
                size={size}
                pxPerM={pxPerM}
                light={light}
                label={`${S.canvasLabel}: ${name}`}
                describedBy={summaryId}
              />
              <p id={summaryId} className="sr-only">
                {S.summary({
                  name,
                  lat: formatLat(focus.latDeg),
                  lon: formatLon(focus.lonDeg),
                  zoneDiameterM: ZONE_RADIUS_M * 2,
                  zoneRadiusM: ZONE_RADIUS_M,
                  marginM: MARGIN_M,
                  marginRadiusM: MARGIN_RADIUS_M,
                  index: indexText,
                })}
              </p>
              <ul className="pointer-events-none absolute top-2 left-2 flex flex-col items-start gap-1">
                <li className={CHIP}>
                  <span aria-hidden="true" className="size-1 bg-ink-subtle" />
                  {S.placeholder}
                </li>
                <li className={CHIP}>{S.notGeoreferenced}</li>
                <li className={CHIP}>{S.provisional}</li>
              </ul>
            </>
          )}
        </div>

        {focus !== null && (
          <footer className="shrink-0 space-y-1 border-t border-line px-3 py-2">
            <MapLegend pxPerM={pxPerM} light={light} />
            <p className="text-[11px] text-ink-subtle">
              <span aria-hidden="true">{data !== null ? '◉ ' : 'ⓘ '}</span>
              {strokeNote}
            </p>
          </footer>
        )}
      </div>
    </section>
  )
}
