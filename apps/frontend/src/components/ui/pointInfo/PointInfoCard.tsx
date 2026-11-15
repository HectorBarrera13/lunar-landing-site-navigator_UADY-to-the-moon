import { useLayoutEffect, useRef, useState } from 'react'
import { SIDEBAR_PX, TOP_BAR_PX } from '@/components/ui/common/layout'
import { BUTTON_PRIMARY, BUTTON_SECONDARY, ICON_BUTTON, LABEL, MONO_NUM, PANEL } from '@/components/ui/common/styles'
import { pointColor, pointLabel } from '@/lib/pointColors'
import { MAX_COMPARED, useAppStore } from '@/store'
import { formatLat, formatLon } from './formatCoords'
import NearestSiteNote from './NearestSiteNote'
import { POINT_INFO_STRINGS as S } from './strings'
import TrafficLightBadge from './TrafficLightBadge'
import { useFocusEvaluation } from './useFocusEvaluation'

const OFFSET = 14
const MARGIN = 8

export default function PointInfoCard() {
  const focus = useAppStore((s) => s.focus)
  const focusOrigin = useAppStore((s) => s.focusOrigin)
  const anchor = useAppStore((s) => s.anchor)
  const openSidebar = useAppStore((s) => s.openSidebar)
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const compared = useAppStore((s) => s.compared)
  const addToCompare = useAppStore((s) => s.addToCompare)
  const clearSelection = useAppStore((s) => s.clearSelection)
  const { data, failed, noData } = useFocusEvaluation(focus)
  const layerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 272, h: 180 })

  const show = focus !== null && anchor !== null && anchor.visible

  useLayoutEffect(() => {
    const el = cardRef.current
    if (el) setSize({ w: el.offsetWidth, h: el.offsetHeight })
  }, [show, focus?.id, focusOrigin, data, failed])

  if (!show) return null

  const color = pointColor(focus.colorIndex)
  const inCompare = compared.some((c) => c.id === focus.id)
  const full = !inCompare && compared.length >= MAX_COMPARED

  // Keep the card between the top bar and the sidebar (when open); the anchor is canvas-relative.
  const layerW = layerRef.current?.clientWidth ?? window.innerWidth
  const layerH = layerRef.current?.clientHeight ?? window.innerHeight
  const minTop = TOP_BAR_PX + MARGIN
  const maxRight = layerW - (sidebarOpen ? SIDEBAR_PX : 0) - MARGIN
  const flipX = anchor.x + OFFSET + size.w > maxRight
  const flipY = anchor.y + OFFSET + size.h > layerH - MARGIN
  const left = Math.min(maxRight - size.w, Math.max(MARGIN, flipX ? anchor.x - OFFSET - size.w : anchor.x + OFFSET))
  const top = Math.max(minTop, flipY ? anchor.y - OFFSET - size.h : anchor.y + OFFSET)

  return (
    <div ref={layerRef} className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      <div
        ref={cardRef}
        role="region"
        aria-label={S.cardLabel}
        style={{ left, top }}
        className={`${PANEL} pointer-events-auto absolute w-68`}
      >
        <div className="flex h-8 items-center justify-between gap-2 border-b border-line pr-1 pl-3">
          <h2 className="flex min-w-0 items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.14em]">
            {color !== null && (
              <span aria-hidden="true" style={{ backgroundColor: color }} className="inline-block size-2 shrink-0" />
            )}
            <span className="truncate">{focus.name ?? pointLabel(focus.colorIndex)}</span>
          </h2>
          <button type="button" onClick={clearSelection} aria-label={S.close} className={ICON_BUTTON}>
            <span aria-hidden="true">{'✕'}</span>
          </button>
        </div>
        <div className="p-3">
          {focusOrigin === 'nearest-site' && focus.name !== null && <NearestSiteNote name={focus.name} />}
          <dl className={`grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs ${focusOrigin === 'nearest-site' ? 'mt-2' : ''}`}>
            <dt className="text-ink-subtle">{S.latitude}</dt>
            <dd className={MONO_NUM}>{formatLat(focus.latDeg)}</dd>
            <dt className="text-ink-subtle">{S.longitude}</dt>
            <dd className={MONO_NUM}>{formatLon(focus.lonDeg)}</dd>
          </dl>
          <div className="mt-3 border-t border-line pt-2">
            <p className={LABEL}>{S.suitabilityIndex}</p>
            {data !== null ? (
              <p className="mt-1 flex flex-wrap items-center gap-2">
                <span className={`text-2xl font-bold leading-7 text-ink ${MONO_NUM}`}>{data.suitability_index}</span>
                <span className="font-mono text-[11px] text-primary">/100</span>
                <TrafficLightBadge light={data.traffic_light} />
              </p>
            ) : failed ? (
              <p role="alert" className="mt-1 text-xs text-ink">
                {noData ? S.noWindowData : S.error}
              </p>
            ) : (
              <p role="status" className="mt-1 text-xs text-ink-muted">
                {S.loading}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={inCompare ? openSidebar : addToCompare}
            disabled={full}
            className={`mt-3 w-full ${inCompare ? BUTTON_SECONDARY : BUTTON_PRIMARY}`}
          >
            {full ? S.comparisonFull : inCompare ? S.viewComparison : S.compare}
          </button>
        </div>
      </div>
    </div>
  )
}
