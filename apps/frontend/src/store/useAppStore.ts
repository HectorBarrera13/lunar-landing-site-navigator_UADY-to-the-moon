import { create } from 'zustand'
import type { ActiveLayer, CameraView, Selection, ViewMode } from '@/store/types'
import { PREVIEW_COLOR_INDEX } from '@/lib/pointColors'
import type { FocusedLocation, ScreenAnchor, SiteListItem } from '@/types'

export const MAX_COMPARED = 4
/** Compared points plus one temporary preview. */
export const MAX_PICKED_POINTS = MAX_COMPARED + 1
let pointCounter = 0

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
  /** Camera framing: Moon close-up or wide Perspective (Sun, Earth and Moon). */
  cameraView: CameraView
  activeLayer: ActiveLayer
  /** Compared points plus at most one temporary preview (the latest pick if not compared). */
  pickedPoints: FocusedLocation[]
  /** Location shown in the info card/sidebar. Written by 2D and 3D, read by both. */
  focus: FocusedLocation | null
  /** Screen position of `focus`, written by the 3D layer every frame it changes. */
  anchor: ScreenAnchor | null
  sidebarOpen: boolean
  /** Pinned locations shown in the compare sidebar (max 4, stored as copies). */
  compared: FocusedLocation[]
  setMissionWindow: (t0: string, tf: string) => void
  setTimeCursor: (timeUtc: string) => void
  selectSite: (siteId: string) => void
  selectPoint: (latDeg: number, lonDeg: number) => void
  clearSelection: () => void
  pickPoint: (latDeg: number, lonDeg: number) => void
  focusSite: (site: SiteListItem) => void
  focusPoint: (id: string) => void
  setAnchor: (anchor: ScreenAnchor | null) => void
  addToCompare: () => void
  removeFromCompare: (id: string) => void
  openSidebar: () => void
  closeSidebar: () => void
  setBodyDirections: (sunDir: Vec3, earthDir: Vec3) => void
  setMode: (mode: ViewMode) => void
  setCameraView: (view: CameraView) => void
  setActiveLayer: (layer: ActiveLayer) => void
}

function clampCursor(cursor: string | null, t0: string, tf: string): string {
  const t = cursor === null ? NaN : Date.parse(cursor)
  if (Number.isNaN(t) || t < Date.parse(t0) || t > Date.parse(tf)) return t0
  return cursor as string
}

/** Lowest free palette slot among the 4 real colors; the neutral preview slot when all are used. */
function lowestFreeColor(points: FocusedLocation[]): number {
  const used = new Set(points.map((p) => p.colorIndex))
  let i = 0
  while (used.has(i) && i < PREVIEW_COLOR_INDEX) i += 1
  return i
}

/** pickedPoints without the previously focused point when it is not compared. */
function dropUncompared(s: AppState, prev: FocusedLocation | null): FocusedLocation[] {
  if (prev === null || s.compared.some((c) => c.id === prev.id)) return s.pickedPoints
  return s.pickedPoints.filter((p) => p.id !== prev.id)
}

export const useAppStore = create<AppState>()((set) => ({
  mission: { t0: null, tf: null, timeCursor: null },
  // MOCK defaults: not computed from ephemerides.
  bodies: { sunDir: [-0.88, 0.28, 0.38], earthDir: [0.9, -0.12, -0.42] },
  selection: { kind: 'none' },
  mode: '3d',
  cameraView: 'moon',
  activeLayer: 'illumination',
  pickedPoints: [],
  focus: null,
  anchor: null,
  sidebarOpen: false,
  compared: [],
  setMissionWindow: (t0, tf) =>
    set((s) => ({ mission: { t0, tf, timeCursor: clampCursor(s.mission.timeCursor, t0, tf) } })),
  setTimeCursor: (timeUtc) => set((s) => ({ mission: { ...s.mission, timeCursor: timeUtc } })),
  selectSite: (siteId) => set({ selection: { kind: 'site', siteId } }),
  selectPoint: (latDeg, lonDeg) => set({ selection: { kind: 'point', latDeg, lonDeg } }),
  clearSelection: () =>
    set({ selection: { kind: 'none' }, focus: null, anchor: null, sidebarOpen: false }),
  pickPoint: (latDeg, lonDeg) =>
    set((s) => {
      pointCounter += 1
      const comparedIds = new Set(s.compared.map((c) => c.id))
      const kept = s.pickedPoints.filter((p) => comparedIds.has(p.id))
      const focus: FocusedLocation = {
        kind: 'point',
        id: `point-${pointCounter}`,
        name: null,
        latDeg,
        lonDeg,
        colorIndex: lowestFreeColor(kept),
      }
      return {
        pickedPoints: [...kept, focus],
        focus,
        anchor: null,
        cameraView: 'moon',
        selection: { kind: 'point', latDeg, lonDeg },
      }
    }),
  focusSite: (site) =>
    set((s) => ({
      focus: { kind: 'site', id: site.id, name: site.name, latDeg: site.lat, lonDeg: site.lon },
      pickedPoints: s.focus?.id === site.id ? s.pickedPoints : dropUncompared(s, s.focus),
      anchor: null,
      cameraView: 'moon',
      selection: { kind: 'site', siteId: site.id },
    })),
  focusPoint: (id) =>
    set((s) => {
      const p = s.pickedPoints.find((q) => q.id === id)
      if (!p) return {}
      const pickedPoints = s.focus?.id === id ? s.pickedPoints : dropUncompared(s, s.focus)
      return {
        focus: p,
        pickedPoints,
        anchor: null,
        cameraView: 'moon',
        selection: { kind: 'point', latDeg: p.latDeg, lonDeg: p.lonDeg },
      }
    }),
  setAnchor: (anchor) => set({ anchor }),
  addToCompare: () =>
    set((s) => {
      if (s.focus === null) return {}
      const id = s.focus.id
      if (s.compared.length >= MAX_COMPARED || s.compared.some((c) => c.id === id)) return {}
      let pinned: FocusedLocation = { ...s.focus }
      let pickedPoints = s.pickedPoints
      if (pinned.kind === 'point' && pinned.colorIndex === PREVIEW_COLOR_INDEX) {
        const others = s.pickedPoints.filter((p) => p.id !== id)
        pinned = { ...pinned, colorIndex: lowestFreeColor(others) }
        pickedPoints = s.pickedPoints.map((p) => (p.id === id ? pinned : p))
      }
      return { compared: [...s.compared, pinned], pickedPoints, focus: pinned, sidebarOpen: true }
    }),
  removeFromCompare: (id) =>
    set((s) => ({
      compared: s.compared.filter((c) => c.id !== id),
      pickedPoints: s.focus?.id === id ? s.pickedPoints : s.pickedPoints.filter((p) => p.id !== id),
    })),
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  setBodyDirections: (sunDir, earthDir) => set({ bodies: { sunDir, earthDir } }),
  setMode: (mode) => set({ mode }),
  setCameraView: (cameraView) => set({ cameraView }),
  setActiveLayer: (activeLayer) => set({ activeLayer }),
}))
