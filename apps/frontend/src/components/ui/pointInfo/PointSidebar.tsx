import { useEffect, useMemo, useRef, useState } from 'react'
import { FOCUS_RING, ICON_BUTTON, MONO_NUM, SECTION_TITLE } from '@/components/ui/common/styles'
import { DAY_MS, MISSION_BOUNDS, shiftIsoByDays } from '@/lib/mission'
import { formatUtc } from '@/lib/time'
import { MAX_COMPARED, useAppStore } from '@/store'
import CompareCard from './CompareCard'
import { POINT_INFO_STRINGS as S } from './strings'
import { useCompareResults } from './useCompareResults'
import type { EvaluationWindow } from './useCompareResults'
import WindowOffsetControl from './WindowOffsetControl'

export default function PointSidebar() {
  const open = useAppStore((s) => s.sidebarOpen)
  const compared = useAppStore((s) => s.compared)
  const closeSidebar = useAppStore((s) => s.closeSidebar)
  const focusLocation = useAppStore((s) => s.focusLocation)
  const setMode = useAppStore((s) => s.setMode)
  const t0 = useAppStore((s) => s.mission.t0)
  const tf = useAppStore((s) => s.mission.tf)
  // Local UI state: only this sidebar reads the delay, so it does not belong in the store.
  const [offsetDays, setOffsetDays] = useState(0)
  const ref = useRef<HTMLElement>(null)

  const baseWindow = useMemo<EvaluationWindow | null>(
    () => (t0 === null || tf === null ? null : { t0, tf }),
    [t0, tf],
  )
  const maxOffset =
    tf === null ? 0 : Math.max(0, Math.floor((Date.parse(MISSION_BOUNDS.endUtc) - Date.parse(tf)) / DAY_MS))
  const days = Math.min(offsetDays, maxOffset)
  const shiftedWindow = useMemo<EvaluationWindow | null>(
    () =>
      baseWindow === null || days === 0
        ? null
        : { t0: shiftIsoByDays(baseWindow.t0, days), tf: shiftIsoByDays(baseWindow.tf, days) },
    [baseWindow, days],
  )

  const results = useCompareResults(compared, baseWindow)
  const shiftedResults = useCompareResults(compared, shiftedWindow)

  // Best to worst base Suitability Index; ties keep insertion order; unloaded items last.
  const sorted = useMemo(() => {
    const score = (id: string) => results[id]?.data?.suitability_index ?? null
    return compared
      .map((loc, order) => ({ loc, order, score: score(loc.id) }))
      .sort((a, b) => {
        if (a.score === null || b.score === null) {
          if (a.score === b.score) return a.order - b.order
          return a.score === null ? 1 : -1
        }
        return b.score - a.score || a.order - b.order
      })
  }, [compared, results])

  useEffect(() => {
    if (open) ref.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSidebar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, closeSidebar])

  if (!open) return null

  return (
    <aside
      ref={ref}
      tabIndex={-1}
      aria-label={S.sidebarLabel}
      className={`pointer-events-auto absolute top-28 right-0 bottom-0 z-20 flex w-96 max-w-full flex-col border-l border-line bg-chassis text-ink focus:outline-none ${FOCUS_RING}`}
    >
      <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-line pr-2 pl-4">
        <h2 className={SECTION_TITLE}>
          {S.compareTitle}{' '}
          <span className={`text-primary ${MONO_NUM}`}>
            ({compared.length}/{MAX_COMPARED})
          </span>
        </h2>
        <button type="button" onClick={closeSidebar} aria-label={S.sidebarClose} className={ICON_BUTTON}>
          <span aria-hidden="true">{'✕'}</span>
        </button>
      </div>

      <div className="shrink-0 space-y-2 border-b border-line px-4 py-3">
        <WindowOffsetControl days={days} maxDays={maxOffset} onChange={setOffsetDays} />
        {baseWindow !== null && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[11px]">
            <dt className="text-ink-subtle">{S.base}</dt>
            <dd className={`text-ink-muted ${MONO_NUM}`}>
              {formatUtc(baseWindow.t0)} {'→'} {formatUtc(baseWindow.tf)}
            </dd>
            {shiftedWindow !== null && (
              <>
                <dt className="text-ink-subtle">
                  {S.shifted} +{days} {S.days}
                </dt>
                <dd className={`text-ink-muted ${MONO_NUM}`}>
                  {formatUtc(shiftedWindow.t0)} {'→'} {formatUtc(shiftedWindow.tf)}
                </dd>
              </>
            )}
          </dl>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {compared.length === 0 ? (
          <p className="text-sm text-ink-muted">{S.compareEmpty}</p>
        ) : (
          <div className="space-y-3">
            {sorted.map(({ loc, score }, i) => (
              <CompareCard
                key={loc.id}
                location={loc}
                result={results[loc.id]}
                shift={shiftedWindow === null ? null : { days, result: shiftedResults[loc.id] }}
                rank={score === null ? null : i + 1}
                onOpenLanding={(loc) => {
                  focusLocation(loc)
                  setMode('2d')
                }}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
