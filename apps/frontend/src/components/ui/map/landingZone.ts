/**
 * PROVISIONAL landing zone geometry (REQUIREMENTS R-22 / PD-02, status Proposed):
 * "Landing zone 200 m diameter + 100 m error margin, as a documented assumption".
 * Reading used here: the zone is a circle of 200 m diameter (100 m radius) around the proposed
 * landing point, and the 100 m error margin is added radially, so the margin ring reaches
 * 100 + 100 = 200 m from the center. Replace both values when PD-02 is decided.
 */
export const ZONE_RADIUS_M = 100
export const MARGIN_M = 100
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

const TILE = 256

/** Deterministic PRNG (mulberry32) so the placeholder looks the same on every load. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t)
}

/**
 * Builds a seamless tile of subtle gray value noise (placeholder only, not terrain data).
 * Called once; the result is reused as a repeating pattern on every redraw.
 */
export function createPlaceholderTile(): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas')
  canvas.width = TILE
  canvas.height = TILE
  const ctx = canvas.getContext('2d')
  if (ctx === null) return null
  const random = mulberry32(0x5a17e)
  const octaves = [
    { cells: 8, amp: 0.55 },
    { cells: 16, amp: 0.3 },
    { cells: 64, amp: 0.15 },
  ].map((o) => ({ ...o, lattice: Array.from({ length: o.cells * o.cells }, random) }))

  const image = ctx.createImageData(TILE, TILE)
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      let v = 0
      for (const { cells, amp, lattice } of octaves) {
        const fx = (x / TILE) * cells
        const fy = (y / TILE) * cells
        const x0 = Math.floor(fx)
        const y0 = Math.floor(fy)
        const x1 = (x0 + 1) % cells
        const y1 = (y0 + 1) % cells
        const sx = smooth(fx - x0)
        const sy = smooth(fy - y0)
        const top = lattice[y0 * cells + x0] * (1 - sx) + lattice[y0 * cells + x1] * sx
        const bottom = lattice[y1 * cells + x0] * (1 - sx) + lattice[y1 * cells + x1] * sx
        v += amp * (top * (1 - sy) + bottom * sy)
      }
      const gray = Math.round(34 + v * 26)
      const i = (y * TILE + x) * 4
      image.data[i] = gray
      image.data[i + 1] = gray
      image.data[i + 2] = gray + 3
      image.data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}
