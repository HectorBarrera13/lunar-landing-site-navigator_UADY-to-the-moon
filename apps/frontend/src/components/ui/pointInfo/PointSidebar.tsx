import { useEffect, useMemo, useRef } from 'react'
import { MAX_COMPARED, useAppStore } from '@/store'
import CompareCard from './CompareCard'
import { POINT_INFO_STRINGS as S } from './strings'
import { useCompareResults } from './useCompareResults'

export default function PointSidebar() {
  const open = useAppStore((s) => s.sidebarOpen)
  const compared = useAppStore((s) => s.compared)
  const closeSidebar = useAppStore((s) => s.closeSidebar)
  const ref = useRef<HTMLElement>(null)
  const results = useCompareResults(compared)

  // Best to worst Suitability Index; ties keep insertion order; unloaded items last.
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
      className="pointer-events-auto absolute right-0 bottom-0 top-20 z-20 w-80 max-w-full overflow-y-auto border-l border-star-100/15 bg-space-900/95 p-4 text-star-100 backdrop-blur focus:outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-400"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-semibold">
          {S.compareTitle} ({compared.length}/{MAX_COMPARED})
        </h2>
        <button
          type="button"
          onClick={closeSidebar}
          aria-label={S.sidebarClose}
          className="-m-1 rounded p-1 hover:bg-star-100/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
        >
          <span aria-hidden="true">&#x2715;</span>
        </button>
      </div>
      {compared.length === 0 ? (
        <p className="mt-4 text-sm text-star-100/70">{S.compareEmpty}</p>
      ) : (
        <div className="mt-3 space-y-3">
          {sorted.map(({ loc, score }, i) => (
            <CompareCard key={loc.id} location={loc} result={results[loc.id]} rank={score === null ? null : i + 1} />
          ))}
        </div>
      )}
    </aside>
  )
}
