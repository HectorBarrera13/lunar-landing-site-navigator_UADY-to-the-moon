import { create } from 'zustand'
import type { ActiveLayer, CameraView, MoonMapView, Selection, ViewMode } from '@/store/types'
import { getSites } from '@/lib/api'
import { centralAngleDegrees } from '@/lib/geo'
import { DEFAULT_MISSION_WINDOW } from '@/lib/mission'
import { bodiesForSeries } from '@/lib/orientation'
import type { FocusedLocation, ScreenAnchor, SiteListItem, SiteTimeSeries } from '@/types'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

export const MAX_COMPARED = 4

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
  /** Preset site catalog from `GET /api/sites`. */
  sites: SiteListItem[]
  sitesStatus: LoadStatus
  /** Precomputed series for the focused site (or a default site); null until loaded. */
  siteSeries: SiteTimeSeries | null
  seriesStatus: LoadStatus
  selection: Selection
  mode: ViewMode
  /** Camera framing: Moon close-up or wide Perspective (Sun, Earth and Moon). */
  cameraView: CameraView
  activeLayer: ActiveLayer
  /** Texture displayed on the Moon globe. */
  moonMapView: MoonMapView
  /** Location shown in the info card/sidebar. Written by 2D and 3D, read by both. */
  focus: FocusedLocation | null
  /** Screen position of `focus`, written by the 3D layer every frame it changes. */
  anchor: ScreenAnchor | null
  sidebarOpen: boolean
  /** Pinned locations shown in the compare sidebar (max 4, stored as copies). */
  compared: FocusedLocation[]
  setMissionWindow: (t0: string, tf: string) => void
  setTimeCursor: (timeUtc: string) => void
  loadSites: () => Promise<void>
  focusNearestSite: (latDeg: number, lonDeg: number) => void
  setSiteSeries: (series: SiteTimeSeries | null) => void
  setSeriesStatus: (status: LoadStatus) => void
  selectSite: (siteId: string) => void
  selectPoint: (latDeg: number, lonDeg: number) => void
  clearSelection: () => void
  focusSite: (site: SiteListItem) => void
  setAnchor: (anchor: ScreenAnchor | null) => void
  addToCompare: () => void
  removeFromCompare: (id: string) => void
  openSidebar: () => void
  closeSidebar: () => void
  setBodyDirections: (sunDir: Vec3, earthDir: Vec3) => void
  setMode: (mode: ViewMode) => void
  setCameraView: (view: CameraView) => void
  setActiveLayer: (layer: ActiveLayer) => void
  setMoonMapView: (view: MoonMapView) => void
}

function clampCursor(cursor: string | null, t0: string, tf: string): string {
  const t = cursor === null ? NaN : Date.parse(cursor)
  if (Number.isNaN(t) || t < Date.parse(t0) || t > Date.parse(tf)) return t0
  return cursor as string
}

type LocatedSite = SiteListItem & { lat: number; lon: number }

function hasCoordinates(site: SiteListItem): site is LocatedSite {
  return site.lat !== null && site.lon !== null
}

export const useAppStore = create<AppState>()((set, get) => ({
  // Demo window until the FR-03 calendar exists; it matches the precomputed artifacts.
  mission: {
    t0: DEFAULT_MISSION_WINDOW.startUtc,
    tf: DEFAULT_MISSION_WINDOW.endUtc,
    timeCursor: DEFAULT_MISSION_WINDOW.startUtc,
  },
  // Placeholder directions until the site series loads; not computed from ephemerides.
  bodies: { sunDir: [-0.88, 0.28, 0.38], earthDir: [0.9, -0.12, -0.42] },
  sites: [],
  sitesStatus: 'idle',
  siteSeries: null,
  seriesStatus: 'idle',
  selection: { kind: 'none' },
  mode: '3d',
  cameraView: 'moon',
  activeLayer: 'illumination',
  moonMapView: 'albedo',
  focus: null,
  anchor: null,
  sidebarOpen: false,
  compared: [],
  setMissionWindow: (t0, tf) =>
    set((s) => ({ mission: { t0, tf, timeCursor: clampCursor(s.mission.timeCursor, t0, tf) } })),
  setTimeCursor: (timeUtc) =>
    set((s) => ({
      mission: { ...s.mission, timeCursor: timeUtc },
      bodies: s.siteSeries === null ? s.bodies : (bodiesForSeries(s.siteSeries, timeUtc) ?? s.bodies),
    })),
  loadSites: async () => {
    if (get().sitesStatus !== 'idle') return
    set({ sitesStatus: 'loading' })
    try {
      const sites = await getSites()
      set({ sites, sitesStatus: 'ready' })
    } catch {
      set({ sitesStatus: 'error' })
    }
  },
  focusNearestSite: (latDeg, lonDeg) => {
    // R-10/R-11: the far side has no direct-to-Earth communication.
    if (latDeg > -80 && Math.abs(lonDeg) > 90) return
    const candidates = get().sites.filter(hasCoordinates)
    let nearest: LocatedSite | null = null
    let nearestAngle = Number.POSITIVE_INFINITY
    for (const site of candidates) {
      const angle = centralAngleDegrees(latDeg, lonDeg, site.lat, site.lon)
      if (angle < nearestAngle) {
        nearest = site
        nearestAngle = angle
      }
    }
    if (nearest !== null) get().focusSite(nearest)
  },
  setSiteSeries: (series) =>
    set((s) => ({
      siteSeries: series,
      seriesStatus: series === null ? 'idle' : 'ready',
      bodies:
        series === null ? s.bodies : (bodiesForSeries(series, s.mission.timeCursor) ?? s.bodies),
    })),
  setSeriesStatus: (seriesStatus) => set({ seriesStatus }),
  selectSite: (siteId) => set({ selection: { kind: 'site', siteId } }),
  selectPoint: (latDeg, lonDeg) => set({ selection: { kind: 'point', latDeg, lonDeg } }),
  clearSelection: () =>
    set({ selection: { kind: 'none' }, focus: null, anchor: null, sidebarOpen: false }),
  focusSite: (site) =>
    set(() => {
      if (site.lat === null || site.lon === null) return {}
      return {
        focus: { kind: 'site', id: site.id, name: site.name, latDeg: site.lat, lonDeg: site.lon },
        anchor: null,
        cameraView: 'moon',
        selection: { kind: 'site', siteId: site.id },
      }
    }),
  setAnchor: (anchor) => set({ anchor }),
  addToCompare: () =>
    set((s) => {
      if (s.focus === null) return {}
      const id = s.focus.id
      if (s.compared.length >= MAX_COMPARED || s.compared.some((c) => c.id === id)) return {}
      return { compared: [...s.compared, { ...s.focus }], focus: s.focus, sidebarOpen: true }
    }),
  removeFromCompare: (id) =>
    set((s) => ({ compared: s.compared.filter((c) => c.id !== id) })),
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  setBodyDirections: (sunDir, earthDir) => set({ bodies: { sunDir, earthDir } }),
  setMode: (mode) => set({ mode }),
  setCameraView: (cameraView) => set({ cameraView }),
  setActiveLayer: (activeLayer) => set({ activeLayer }),
  setMoonMapView: (moonMapView) => set({ moonMapView }),
}))
