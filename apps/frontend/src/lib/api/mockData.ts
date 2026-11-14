import type { EvaluateRequest, EvaluateResponse, SeriesPoint, SiteListItem, SiteTimeSeries } from '@/types'

export const MOCK_NOTICE = 'MOCK DATA: not computed by the backend; coordinates and values are not real.'

/** Placeholder coordinates, NOT real site locations (PD-01 pending). */
export const MOCK_SITES: SiteListItem[] = [
  { id: 'mock-site-a', name: 'Mock Site A', group: 'mock', lat: -89.0, lon: 0.0 },
  { id: 'mock-site-b', name: 'Mock Site B', group: 'mock', lat: -88.0, lon: 45.0 },
  { id: 'mock-site-c', name: 'Mock Site C', group: 'mock', lat: -87.0, lon: -90.0 },
]

export function buildMockEvaluation(req: EvaluateRequest): EvaluateResponse {
  const isSite = req.site_id !== null
  return {
    suitability_index: 72,
    traffic_light: 'orange',
    precision: isSite ? 'date_specific' : 'average',
    vetoes: [
      {
        code: 'earth_visibility_low',
        message: 'Earth visible only 12% of the mission window (minimum 25%). [mock]',
      },
    ],
    criteria: [
      { code: 'power', label: 'Solar power', normalized: 0.8, weight: 0.3, contribution: 24, detail: 'Mock detail.' },
      { code: 'communications', label: 'Earth communications', normalized: 0.5, weight: 0.3, contribution: 15, detail: 'Mock detail.' },
    ],
    metrics: {
      sunlight_percent: 78.5,
      earth_visible_percent: 12,
      longest_darkness_hours: 36,
      next_sunset_utc: req.start_utc,
      next_earthset_utc: null,
    },
    warnings: [MOCK_NOTICE],
  }
}

/** MOCK test window used by the fake series; not a real mission window. */
export const MOCK_WINDOW = { start_utc: '2027-03-15T00:00:00Z', end_utc: '2027-03-29T00:00:00Z' } as const

const MOCK_STEP_MINUTES = 60

/** MOCK horizon: smooth synthetic ridges, not real terrain. */
function buildMockHorizon(): number[] {
  return Array.from({ length: 360 }, (_, az) => {
    const rad = (az * Math.PI) / 180
    const v = 2.5 + 1.8 * Math.sin(3 * rad + 0.5) + 1.2 * Math.sin(7 * rad) + 0.8 * Math.cos(11 * rad)
    return Math.round(Math.max(0, v) * 100) / 100
  })
}

/** MOCK Sun and Earth positions; synthetic motion, not an ephemeris. */
export function buildMockSiteSeries(
  siteId: string,
  startUtc: string = MOCK_WINDOW.start_utc,
  endUtc: string = MOCK_WINDOW.end_utc,
): SiteTimeSeries {
  const site = MOCK_SITES.find((s) => s.id === siteId) ?? MOCK_SITES[0]
  const horizon = buildMockHorizon()
  const t0 = Date.parse(startUtc)
  const tf = Date.parse(endUtc)
  const stepMs = MOCK_STEP_MINUTES * 60_000
  const series: SeriesPoint[] = []
  for (let t = t0; t <= tf; t += stepMs) {
    const days = (t - t0) / 86_400_000
    const sunAz = (((days / 29.53) * 360) % 360 + 360) % 360
    const sunEl = 4 * Math.sin((2 * Math.PI * days) / 29.53 + 1)
    const earthAz = (200 + 25 * Math.sin((2 * Math.PI * days) / 27.3)) % 360
    const earthEl = 6 + 3 * Math.cos((2 * Math.PI * days) / 27.3)
    series.push({
      time_utc: new Date(t).toISOString().replace('.000Z', 'Z'),
      sun_azimuth_deg: Math.round(sunAz * 100) / 100,
      sun_elevation_deg: Math.round(sunEl * 100) / 100,
      sun_visible: sunEl > horizon[Math.round(sunAz) % 360],
      earth_azimuth_deg: Math.round(earthAz * 100) / 100,
      earth_elevation_deg: Math.round(earthEl * 100) / 100,
      earth_visible: earthEl > horizon[Math.round(earthAz) % 360],
    })
  }
  return {
    site_id: site.id,
    name: site.name,
    lat_deg: site.lat,
    lon_deg: site.lon,
    horizon_source: 'sphere',
    horizon_profile_deg: horizon,
    time_step_minutes: MOCK_STEP_MINUTES,
    series,
  }
}
