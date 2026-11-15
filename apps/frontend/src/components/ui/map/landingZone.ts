/**
 * Landing zone geometry (REQUIREMENTS R-22 / PD-02, Agreed 2026-11-15): the zone is a circle of
 * 200 m diameter (100 m radius) around the proposed landing point; the 100 m error margin is
 * spread across the diameter, so the margin ring is 300 m in diameter, i.e. 50 m wide radially
 * and 150 m from the center.
 */
export const ZONE_RADIUS_M = 100
/** Radial width of the error margin ring (100 m across the diameter). */
export const MARGIN_M = 50
export const MARGIN_RADIUS_M = ZONE_RADIUS_M + MARGIN_M

/** Fraction of the smaller canvas side used by the margin ring radius. */
const MARGIN_RING_FRACTION = 0.36
const NICE_LENGTHS_M = [10, 20, 25, 50, 100, 200, 250, 500, 1000] as const
const SCALE_BAR_MAX_PX = 160

/** CSS px per meter so the whole margin ring fits the drawing area with room around it. */
export function pixelsPerMeter(widthPx: number, heightPx: number): number {
  const side = Math.max(0, Math.min(widthPx, heightPx))
  return (side * MARGIN_RING_FRACTION) / MARGIN_RADIUS_M
}

/** Largest round length (m) whose bar stays within `SCALE_BAR_MAX_PX`. */
export function scaleBarMeters(pxPerM: number): number {
  let best: number = NICE_LENGTHS_M[0]
  for (const length of NICE_LENGTHS_M) {
    if (length * pxPerM <= SCALE_BAR_MAX_PX) best = length
  }
  return best
}
