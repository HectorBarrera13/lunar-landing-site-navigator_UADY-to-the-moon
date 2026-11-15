import { useLayoutEffect, useRef, useState } from 'react'
import { pointColor, pointLabel } from '@/lib/pointColors'
import { MAX_COMPARED, useAppStore } from '@/store'
import { formatLat, formatLon } from './formatCoords'
import { POINT_INFO_STRINGS as S } from './strings'
import { LIGHT_ICON } from './trafficLight'
import { useFocusEvaluation } from './useFocusEvaluation'

const OFFSET = 14
const MARGIN = 8

export default function PointInfoCard() {
  const focus = useAppStore((s) => s.focus)
  const anchor = useAppStore((s) => s.anchor)
  const openSidebar = useAppStore((s) => s.openSidebar)
  const compared = useAppStore((s) => s.compared)
  const addToCompare = useAppStore((s) => s.addToCompare)
  const clearSelection = useAppStore((s) => s.clearSelection)
  const { data, failed } = useFocusEvaluation(focus)
  const cardRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 256, h: 160 })

  const show = focus !== null && anchor !== null && anchor.visible

  useLayoutEffect(() => {
    const el = cardRef.current
    if (el) setSize({ w: el.offsetWidth, h: el.offsetHeight })
  }, [show, focus?.id])

  if (!show) return null

  const color = pointColor(focus.colorIndex)
  const inCompare = compared.some((c) => c.id === focus.id)
  const full = !inCompare && compared.length >= MAX_COMPARED

  const vw = window.innerWidth
  const vh = window.innerHeight
  const flipX = anchor.x + OFFSET + size.w > vw - MARGIN
  const flipY = anchor.y + OFFSET + size.h > vh - MARGIN
  const left = Math.max(MARGIN, flipX ? anchor.x - OFFSET - size.w : anchor.x + OFFSET)
  const top = Math.max(MARGIN, flipY ? anchor.y - OFFSET - size.h : anchor.y + OFFSET)

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      <div
        ref={cardRef}
        role="region"
        aria-label={S.cardLabel}
        style={{ left, top }}
        className="pointer-events-auto absolute w-64 rounded-lg border border-star-100/15 bg-space-900/90 p-3 text-star-100 shadow-lg backdrop-blur"
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            {color !== null && (
              <span
                aria-hidden="true"
                style={{ backgroundColor: color }}
                className="inline-block size-3 rounded-full ring-1 ring-star-100/60"
              />
            )}
            {focus.name ?? pointLabel(focus.colorIndex)}
          </h2>
          <button
            type="button"
            onClick={clearSelection}
            aria-label={S.close}
            className="-m-1 rounded p-1 hover:bg-star-100/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
          >
            <span aria-hidden="true">&#x2715;</span>
          </button>
        </div>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          <dt className="text-star-100/70">{S.latitude}</dt>
          <dd>{formatLat(focus.latDeg)}</dd>
          <dt className="text-star-100/70">{S.longitude}</dt>
          <dd>{formatLon(focus.lonDeg)}</dd>
        </dl>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-star-100/70">{S.suitabilityIndex}</span>
          {data !== null ? (
            <>
              <span className="text-lg font-semibold">{data.suitability_index}</span>
              <span className="inline-flex items-center gap-1 rounded border border-star-100/40 px-1.5 py-0.5 text-xs">
                <span aria-hidden="true">{LIGHT_ICON[data.traffic_light]}</span>
                {S.trafficLight[data.traffic_light]}
              </span>
            </>
          ) : failed ? (
            <span role="alert">{S.error}</span>
          ) : (
            <span role="status">{S.loading}</span>
          )}
        </p>
        <button
          type="button"
          onClick={inCompare ? openSidebar : addToCompare}
          disabled={full}
          className="mt-3 w-full rounded bg-accent-400/20 px-3 py-1.5 text-xs font-semibold ring-1 ring-accent-400 hover:bg-accent-400/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-accent-400/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
        >
          {full ? S.comparisonFull : inCompare ? S.viewComparison : S.compare}
        </button>
      </div>
    </div>
  )
}
