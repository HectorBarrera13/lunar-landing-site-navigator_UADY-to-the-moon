/**
 * Demo mission window matching the precomputed artifacts (pipeline `EphemerisConfig`).
 * Not a mission decision: the FR-03 calendar will replace it with the user-entered window.
 */
export const DEFAULT_MISSION_WINDOW = {
  startUtc: '2027-03-15T00:00:00Z',
  endUtc: '2027-03-29T00:00:00Z',
} as const
