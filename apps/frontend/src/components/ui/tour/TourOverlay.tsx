import type { TourRect } from './useTargetRect'

const DIM = 'pointer-events-auto absolute bg-black/70'

/**
 * Dims the whole page except the highlighted rectangle: four panels around it block clicks, while
 * the cutout stays interactive. Without a target a single panel covers everything.
 */
export default function TourOverlay({ rect }: { rect: TourRect | null }) {
  if (rect === null) {
    return <div aria-hidden="true" className="pointer-events-auto fixed inset-0 z-40 bg-black/70" />
  }
  const top = Math.max(0, rect.top)
  const left = Math.max(0, rect.left)
  const bottom = Math.max(0, rect.top + rect.height)
  const right = Math.max(0, rect.left + rect.width)
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40">
      <div className={DIM} style={{ top: 0, left: 0, right: 0, height: top }} />
      <div className={DIM} style={{ top: bottom, left: 0, right: 0, bottom: 0 }} />
      <div className={DIM} style={{ top, left: 0, width: left, height: bottom - top }} />
      <div className={DIM} style={{ top, left: right, right: 0, height: bottom - top }} />
      <div
        className="pointer-events-none absolute rounded border border-primary"
        style={{ top, left, width: right - left, height: bottom - top }}
      />
    </div>
  )
}
