import type { DirectionMe, HorizonSource } from './contracts'

/**
 * UI row model built once from the columnar `SiteSeriesResponse` (lib/api). Not a contract
 * type: the `*_visible` booleans are derived with the contract 1.1 rules (R3-2).
 */
export interface SeriesPoint {
  time_utc: string
  sun_azimuth_deg: number
  sun_elevation_deg: number
  sun_visible_fraction: number
  /** Sun counts as visible when any part of the disc is above the horizon (fraction > 0). */
  sun_visible: boolean
  sun_distance_km: number
  /** Null when the backend is serving a legacy artifact without angular radii. */
  sun_angular_radius_deg: number | null
  sun_dir_me: DirectionMe
  earth_azimuth_deg: number
  earth_elevation_deg: number
  earth_visible_fraction: number
  /** Earth counts as visible when its center is above the horizon (fraction >= 0.5). */
  earth_visible: boolean
  earth_distance_km: number
  /** Null when the backend is serving a legacy artifact without angular radii. */
  earth_angular_radius_deg: number | null
  earth_dir_me: DirectionMe
}

export interface SiteTimeSeries {
  site_id: string
  name: string
  lat_deg: number
  lon_deg: number
  horizon_source: HorizonSource
  horizon_profile_deg: number[]
  max_radius_m: number
  near_field_m: number
  observer_height_m: number
  assumptions: string[]
  time_step_minutes: number
  series: SeriesPoint[]
}
