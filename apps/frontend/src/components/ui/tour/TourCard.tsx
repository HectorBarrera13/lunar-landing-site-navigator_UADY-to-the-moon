import { useId, useLayoutEffect, useState } from 'react'
import type { RefObject } from 'react'
import { BUTTON_PRIMARY, BUTTON_SECONDARY, SECTION_TITLE } from '@/components/ui/common/styles'
import { TOUR_STRINGS as S } from './strings'
import type { TourRect } from './useTargetRect'

const GAP = 12
const MARGIN = 12
const WIDTH = 320

interface Position {
  left: number
  top: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

/** Side of the target with room for the card; centered on screen when none fits or there is no target. */
function place(rect: TourRect | null, w: number, h: number): Position {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const center = { left: (vw - w) / 2, top: (vh - h) / 2 }
  if (rect === null) return center
  const midX = clamp(rect.left + rect.width / 2 - w / 2, MARGIN, vw - w - MARGIN)
  const midY = clamp(rect.top + rect.height / 2 - h / 2, MARGIN, vh - h - MARGIN)
  const below = { left: midX, top: rect.top + rect.height + GAP }
  const above = { left: midX, top: rect.top - GAP - h }
  const right = { left: rect.left + rect.width + GAP, top: midY }
  const left = { left: rect.left - GAP - w, top: midY }
  const fits = (p: Position) => p.left >= MARGIN && p.top >= MARGIN && p.left + w <= vw - MARGIN && p.top + h <= vh - MARGIN
  const order = rect.width > vw * 0.45 ? [below, above, right, left] : [right, left, below, above]
  return order.find(fits) ?? center
}

interface TourCardProps {
  title: string
  text: string
  index: number
  total: number
  rect: TourRect | null
  last: boolean
  continueRef: RefObject<HTMLButtonElement | null>
  onContinue: () => void
  onSkip: () => void
}

export default function TourCard({ title, text, index, total, rect, last, continueRef, onContinue, onSkip }: TourCardProps) {
  const titleId = useId()
  const textId = useId()
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ w: WIDTH, h: 190 })

  useLayoutEffect(() => {
    if (node) setSize({ w: node.offsetWidth, h: node.offsetHeight })
  }, [node, title, text])

  const { left, top } = place(rect, size.w, size.h)

  return (
    <div
      ref={setNode}
      role="dialog"
      aria-label={S.dialogLabel}
      aria-labelledby={titleId}
      aria-describedby={textId}
      style={{ left, top, width: WIDTH }}
      className="pointer-events-auto fixed z-50 max-w-[calc(100%-1.5rem)] border border-line-strong bg-panel p-4 text-ink shadow-lg"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-subtle">{S.stepOf(index + 1, total)}</p>
      <h2 id={titleId} className={`${SECTION_TITLE} mt-1`}>
        {title}
      </h2>
      <p id={textId} className="mt-2 text-sm text-ink-muted">
        {text}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <button type="button" onClick={onSkip} className={BUTTON_SECONDARY}>
          {S.skipAll}
        </button>
        <button ref={continueRef} type="button" onClick={onContinue} className={BUTTON_PRIMARY}>
          {last ? S.finish : S.continue}
        </button>
      </div>
    </div>
  )
}
