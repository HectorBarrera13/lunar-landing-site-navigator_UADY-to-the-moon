import type { SiteListItem } from '@/types'

/**
 * MOCK DATA, NOT REAL LOCATIONS. The catalog still has no verified coordinates for these sites
 * (PD-01). These synthetic positions only exist so the globe markers, the zoom and the colors can
 * be simulated. Delete this file when QA verifies the real coordinates in `data/catalog/sites.json`.
 */
const MOCK_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'peak-near-cabeus-b': { lat: -84.2, lon: -150 },
  haworth: { lat: -85.3, lon: -110 },
  'mons-mouton-plateau': { lat: -87.4, lon: -60 },
  'mons-mouton': { lat: -88.1, lon: 20 },
  'nobile-rim-1': { lat: -84.8, lon: 70 },
  'nobile-rim-2': { lat: -86.6, lon: 115 },
  'de-gerlache-rim-2': { lat: -83.5, lon: 160 },
  'slater-plain': { lat: -89.0, lon: -170 },
  'apollo-11': { lat: 5, lon: 70 },
  'apollo-17': { lat: -10, lon: -70 },
  'change-3': { lat: 35, lon: -45 },
  'chandrayaan-3': { lat: -30, lon: 50 },
}

/** Fills only null coordinates; sites with verified coordinates from the back-end are untouched. */
export function withMockCoordinates(sites: SiteListItem[]): SiteListItem[] {
  return sites.map((site) => {
    const mock = MOCK_COORDINATES[site.id]
    if (site.lat !== null && site.lon !== null) return site
    return mock === undefined ? site : { ...site, lat: mock.lat, lon: mock.lon }
  })
}
