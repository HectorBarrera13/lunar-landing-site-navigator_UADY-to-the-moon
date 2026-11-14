import { create } from 'zustand'
import type { ActiveLayer, Selection, ViewMode } from '@/store/types'

export interface MissionState {
  t0: string | null
  tf: string | null
  /** Time cursor in UTC ISO 8601, expected within [t0, tf]. */
  timeCursor: string | null
}

export interface AppState {
  mission: MissionState
  selection: Selection
  mode: ViewMode
  activeLayer: ActiveLayer
  setMissionWindow: (t0: string, tf: string) => void
  setTimeCursor: (timeUtc: string) => void
  selectSite: (siteId: string) => void
  selectPoint: (latDeg: number, lonDeg: number) => void
  clearSelection: () => void
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
  selection: { kind: 'none' },
  mode: '3d',
  activeLayer: 'illumination',
  setMissionWindow: (t0, tf) =>
    set((s) => ({ mission: { t0, tf, timeCursor: clampCursor(s.mission.timeCursor, t0, tf) } })),
  setTimeCursor: (timeUtc) => set((s) => ({ mission: { ...s.mission, timeCursor: timeUtc } })),
  selectSite: (siteId) => set({ selection: { kind: 'site', siteId } }),
  selectPoint: (latDeg, lonDeg) => set({ selection: { kind: 'point', latDeg, lonDeg } }),
  clearSelection: () => set({ selection: { kind: 'none' } }),
  setMode: (mode) => set({ mode }),
  setActiveLayer: (activeLayer) => set({ activeLayer }),
}))
