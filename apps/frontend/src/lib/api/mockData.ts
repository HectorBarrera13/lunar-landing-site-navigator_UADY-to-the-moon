import type { EvaluateRequest, EvaluateResponse, SiteListItem } from '@/types'

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
