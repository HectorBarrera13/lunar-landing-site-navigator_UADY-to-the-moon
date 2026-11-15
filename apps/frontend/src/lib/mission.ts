/**
 * Initial mission window, inside the precomputed artifacts (pipeline `EphemerisConfig`):
 * starts on the date chosen by the owner (27 Aug 2026) and keeps the previous 14-day length.
 * It is only the starting value; the FR-03 picker replaces it with the user-entered window.
 */
export const DEFAULT_MISSION_WINDOW = {
  startUtc: '2026-08-27T00:00:00Z',
  endUtc: '2026-09-10T00:00:00Z',
} as const

/** FR-03 / SRS RF-04: the mission window is bounded to 2025–2035 at whole UTC hours. */
export const MISSION_BOUNDS = {
  startUtc: '2025-01-01T00:00:00Z',
  endUtc: '2035-12-31T23:00:00Z',
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
