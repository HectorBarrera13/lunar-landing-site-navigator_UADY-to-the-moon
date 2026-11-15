import type { EvaluateRequest, EvaluateResponse, SeriesPoint, SiteListItem, SiteTimeSeries } from '@/types'

export const MOCK_NOTICE = 'MOCK DATA: not computed by the backend; coordinates and values are not real.'

/** Placeholder coordinates, NOT real site locations (PD-01 pending). */
export const MOCK_SITES: SiteListItem[] = [
  { id: 'mock-site-a', name: 'Mock Site A', group: 'mock', lat: -89.0, lon: 0.0 },
  { id: 'mock-site-b', name: 'Mock Site B', group: 'mock', lat: -88.0, lon: 45.0 },
  { id: 'mock-site-c', name: 'Mock Site C', group: 'mock', lat: -87.0, lon: -90.0 },
]

function hashString(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function mockIndexFromKey(key: string): number {
  return Math.floor(hashString(key) % 101)
}

/** MOCK Suitability Index: deterministic per rounded location, NOT computed by any model. */
export function getMockSuitabilityIndex(latDeg: number, lonDeg: number): number {
  return mockIndexFromKey(`${latDeg.toFixed(3)},${lonDeg.toFixed(3)}`)
}

/**
 * MOCK-ONLY thresholds. They are NOT the REQUIREMENTS.md traffic-light thresholds
 * (those are still pending); they only keep the mock internally consistent.
 */
function mockTrafficLight(index: number): EvaluateResponse['traffic_light'] {
  if (index >= 70) return 'green'
  if (index >= 40) return 'orange'
  return 'red'
}

function mockIndexForRequest(req: EvaluateRequest): number {
  if (req.lat_deg !== null && req.lon_deg !== null) return getMockSuitabilityIndex(req.lat_deg, req.lon_deg)
  const site = MOCK_SITES.find((s) => s.id === req.site_id)
  if (site) return getMockSuitabilityIndex(site.lat, site.lon)
  return mockIndexFromKey(`site:${req.site_id ?? ''}`)
}

export function buildMockEvaluation(req: EvaluateRequest): EvaluateResponse {
  const isSite = req.site_id !== null
  const index = mockIndexForRequest(req)
  const light = mockTrafficLight(index)
  const earthVisible = light === 'red' ? 12 : 40 + Math.round(index / 4)
  const warnings = [MOCK_NOTICE]
  if (light === 'orange') warnings.push('Caution: some criteria are marginal. [mock]')
  return {
    suitability_index: index,
    traffic_light: light,
    precision: isSite ? 'date_specific' : 'average',
    vetoes:
      light === 'red'
        ? [
            {
              code: 'earth_visibility_low',
              message: 'Earth visible only 12% of the mission window (minimum 25%). [mock]',
            },
          ]
        : [],
    criteria: [
      { code: 'power', label: 'Solar power', normalized: index / 100, weight: 0.3, contribution: Math.round(index * 0.3), detail: 'Mock detail.' },
      { code: 'communications', label: 'Earth communications', normalized: earthVisible / 100, weight: 0.3, contribution: Math.round(earthVisible * 0.3), detail: 'Mock detail.' },
    ],
    metrics: {
      sunlight_percent: Math.min(100, 30 + index * 0.7),
      earth_visible_percent: earthVisible,
      longest_darkness_hours: Math.round(120 - index),
      next_sunset_utc: req.start_utc,
      next_earthset_utc: null,
    },
    warnings,
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
