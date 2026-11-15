import { create } from 'zustand'
import type { ActiveLayer, CameraView, MoonMapView, Selection, ViewMode } from '@/store/types'
import { ApiError, evaluate, getSites } from '@/lib/api'
import { isSunlitSurfacePoint } from '@/lib/geo'
import { DEFAULT_MISSION_WINDOW } from '@/lib/mission'
import { NOTICE_STRINGS } from '@/lib/notices'
import { bodiesForSeries } from '@/lib/orientation'
import type {
  ComparedLocation,
  FocusedLocation,
  FocusOrigin,
  ScreenAnchor,
  SiteListItem,
  SiteTimeSeries,
} from '@/types'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

/** FR-14 / SRS RF-20: compare up to 3 site x window scenarios. */
export const MAX_COMPARED = 3

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
  /** How `focus` was chosen; null when nothing is focused. */
  focusOrigin: FocusOrigin | null
  /** Screen position of `focus`, written by the 3D layer every frame it changes. */
  anchor: ScreenAnchor | null
  sidebarOpen: boolean
  /** Pinned locations shown in the compare sidebar (max `MAX_COMPARED`, stored as copies). */
  compared: ComparedLocation[]
  /** Educational message for a blocked selection (e.g. far side, R-10); null when none. */
  blockedNotice: string | null
  /** True while the intro screen (title + large Moon) is shown; the Moon click ends it. */
  introActive: boolean
  setMissionWindow: (t0: string, tf: string) => void
  setTimeCursor: (timeUtc: string) => void
  loadSites: () => Promise<void>
  focusNearestSite: (latDeg: number, lonDeg: number) => Promise<void>
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
  setBlockedNotice: (notice: string | null) => void
  startSimulation: () => void
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

function focusStateFor(site: LocatedSite, origin: FocusOrigin): Partial<AppState> {
  return {
    focus: { kind: 'site', id: site.id, name: site.name, latDeg: site.lat, lonDeg: site.lon },
    focusOrigin: origin,
    anchor: null,
    cameraView: 'moon',
    selection: { kind: 'site', siteId: site.id },
  }
}

export const useAppStore = create<AppState>()((set, get) => ({
  // Initial value only; the FR-03 mission window picker calls `setMissionWindow`.
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
  focusOrigin: null,
  anchor: null,
  sidebarOpen: false,
  compared: [],
  blockedNotice: null,
  introActive: true,
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
  focusNearestSite: async (latDeg, lonDeg) => {
    // R-10 (updated 2026-11-15): the face receiving no sunlight is blocked; R-11 keeps the south pole selectable.
    if (latDeg > -80 && !isSunlitSurfacePoint(latDeg, lonDeg, get().bodies.sunDir)) {
      set({ blockedNotice: NOTICE_STRINGS.farSide })
      return
    }
    const { t0, tf } = get().mission
    if (t0 === null || tf === null) {
      set({ blockedNotice: NOTICE_STRINGS.nearestSiteUnavailable })
      return
    }
    try {
      const evaluation = await evaluate({
        site_id: null,
        lat_deg: latDeg,
        lon_deg: lonDeg,
        start_utc: t0,
        end_utc: tf,
      })
      const resolved = get().sites.find((site) => site.id === evaluation.resolved_site_id)
      if (resolved === undefined || !hasCoordinates(resolved)) {
        set({ blockedNotice: NOTICE_STRINGS.nearestSiteUnavailable })
        return
      }
      set({ ...focusStateFor(resolved, 'nearest-site'), blockedNotice: null })
    } catch (error: unknown) {
      const message = error instanceof ApiError ? error.message : NOTICE_STRINGS.nearestSiteUnavailable
      set({ blockedNotice: message })
    }
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
    set({
      selection: { kind: 'none' },
      focus: null,
      focusOrigin: null,
      anchor: null,
      sidebarOpen: false,
    }),
  focusSite: (site) =>
    set(() => (hasCoordinates(site) ? focusStateFor(site, 'marker') : {})),
  setAnchor: (anchor) => set({ anchor }),
  addToCompare: () =>
    set((s) => {
      if (s.focus === null) return {}
      const id = s.focus.id
      if (s.compared.length >= MAX_COMPARED || s.compared.some((c) => c.id === id)) return {}
      const pinned: ComparedLocation = { ...s.focus, origin: s.focusOrigin ?? 'marker' }
      return { compared: [...s.compared, pinned], sidebarOpen: true }
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
  setBlockedNotice: (blockedNotice) => set({ blockedNotice }),
  startSimulation: () => set({ introActive: false }),
}))
