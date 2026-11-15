/**
 * Initial mission window: the demo range matching the precomputed artifacts (pipeline `EphemerisConfig`).
 * It is only the starting value; the FR-03 picker replaces it with the user-entered window.
 * At Malapert Massif this range is polar night, so the honest result is red (Index 21).
 */
export const DEFAULT_MISSION_WINDOW = {
  startUtc: '2027-03-15T00:00:00Z',
  endUtc: '2027-03-29T00:00:00Z',
} as const

/** FR-03 / SRS RF-04: the mission window is bounded to 2025–2035 at whole UTC hours. */
export const MISSION_BOUNDS = {
  startUtc: '2025-01-01T00:00:00Z',
  endUtc: '2035-12-31T23:00:00Z',
} as const

/**
 * PROVISIONAL (round 3 owner-approved proposal, leader decisions PR not merged):
 * a short window with sunlight at Malapert Massif in the current artifact (AI_LOG 2026-11-14).
 */
export const SUNLIT_EXAMPLE_WINDOW = {
  startUtc: '2027-03-31T00:00:00Z',
  endUtc: '2027-04-03T00:00:00Z',
} as const

export const HOUR_MS = 3_600_000
export const DAY_MS = 86_400_000

/** ISO 8601 UTC without milliseconds, e.g. `2027-03-31T00:00:00Z`. */
export function toIsoUtc(ms: number): string {
  return new Date(ms).toISOString().replace('.000Z', 'Z')
}

export function clampMs(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Shifts a UTC ISO time by whole days. */
export function shiftIsoByDays(isoUtc: string, days: number): string {
  return toIsoUtc(Date.parse(isoUtc) + days * DAY_MS)
}
