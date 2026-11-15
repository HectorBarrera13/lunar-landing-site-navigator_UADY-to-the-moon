/**
 * Cross-layer UI types (not part of docs/contracts/). The 3D layer picks a
 * location and projects its anchor to screen space; the 2D layer renders the card.
 */
export interface FocusedLocation {
  kind: 'site' | 'point'
  id: string
  name: string | null
  latDeg: number
  lonDeg: number
  /** Palette slot 0-3, or 4 (neutral) for a temporary preview (user-picked points only). */
  colorIndex?: number
}

/** Screen-space position (CSS px, viewport origin) of the focused location. */
export interface ScreenAnchor {
  x: number
  y: number
  /** False when the location is occluded or off-screen. */
  visible: boolean
}
