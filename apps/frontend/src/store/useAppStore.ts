import { create } from 'zustand'
import type { ActiveLayer, Selection, ViewMode } from '@/store/types'

export interface MissionState {
  t0: string | null
  tf: string | null
  /** Time cursor in UTC ISO 8601, expected within [t0, tf]. */
  timeCursor: string | null
}

export type Vec3 = [number, number, number]

export interface BodyDirections {
  /** Unit vectors from the Moon center toward the Sun / Earth, in scene axes. */
  sunDir: Vec3
  earthDir: Vec3
}

export interface AppState {
  mission: MissionState
  bodies: BodyDirections
  selection: Selection
  mode: ViewMode
  activeLayer: ActiveLayer
  setMissionWindow: (t0: string, tf: string) => void
  setTimeCursor: (timeUtc: string) => void
  selectSite: (siteId: string) => void
  selectPoint: (latDeg: number, lonDeg: number) => void
  clearSelection: () => void
  setBodyDirections: (sunDir: Vec3, earthDir: Vec3) => void
  setMode: (mode: ViewMode) => void
  setActiveLayer: (layer: ActiveLayer) => void
}

function clampCursor(cursor: string | null, t0: string, tf: string): string {
  const t = cursor === null ? NaN : Date.parse(cursor)
  if (Number.isNaN(t) || t < Date.parse(t0) || t > Date.parse(tf)) return t0
  return cursor as string
}

export const useAppStore = create<AppState>()((set) => ({
  mission: { t0: null, tf: null, timeCursor: null },
  // MOCK defaults: not computed from ephemerides.
  bodies: { sunDir: [0.78, 0.31, 0.54], earthDir: [0, 0.2, 0.98] },
  selection: { kind: 'none' },
  mode: '3d',
  activeLayer: 'illumination',
  setMissionWindow: (t0, tf) =>
    set((s) => ({ mission: { t0, tf, timeCursor: clampCursor(s.mission.timeCursor, t0, tf) } })),
  setTimeCursor: (timeUtc) => set((s) => ({ mission: { ...s.mission, timeCursor: timeUtc } })),
  selectSite: (siteId) => set({ selection: { kind: 'site', siteId } }),
  selectPoint: (latDeg, lonDeg) => set({ selection: { kind: 'point', latDeg, lonDeg } }),
  clearSelection: () => set({ selection: { kind: 'none' } }),
  setBodyDirections: (sunDir, earthDir) => set({ bodies: { sunDir, earthDir } }),
  setMode: (mode) => set({ mode }),
  setActiveLayer: (activeLayer) => set({ activeLayer }),
}))
