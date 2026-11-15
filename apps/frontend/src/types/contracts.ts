// Mirrors docs/contracts/README.md (approved 2026-11-14; section 1.1 version 1.1 and API 2.0, 2026-11-15). Do not diverge.

export type HorizonSource = 'lola' | 'sphere'

export type TrafficLight = 'green' | 'orange' | 'red'

export type Precision = 'date_specific' | 'average'

/** GET /api/sites item. The group field format is not specified by the contract. */
export interface SiteListItem {
  id: string
  name: string
  group: string
  /** Null until QA verifies the coordinate (PD-01); consumers must skip such sites on the globe. */
  lat: number | null
  /** Null until QA verifies the coordinate (PD-01); consumers must skip such sites on the globe. */
  lon: number | null
}

/** Unit vector from the Moon center to the body, in `MOON_ME`. */
export type DirectionMe = [number, number, number]

/**
 * GET /api/sites/{site_id}/series (contract 2.0, version 1.1): `horizon.json` fields,
 * `time_step_minutes`, and the year-file columns sliced to the window. Every column has
 * the same length as `time_utc`.
 */
export interface SiteSeriesResponse {
  site_id: string
  name: string
  lat_deg: number
  lon_deg: number
  horizon_source: HorizonSource
  /** 360 values, index = azimuth in whole degrees (0 = north, clockwise), lunar curvature included. */
  horizon_profile_deg: number[]
  max_radius_m: number
  near_field_m: number
  observer_height_m: number
  assumptions: string[]
  time_step_minutes: number
  time_utc: string[]
  sun_azimuth_deg: number[]
  sun_elevation_deg: number[]
  /** Fraction (0-1) of the solar disc above the horizon (R3-2). */
  sun_visible_fraction: number[]
  sun_distance_km: number[]
  /** Optional while legacy processed artifacts are being regenerated. */
  sun_angular_radius_deg?: number[]
  sun_dir_me: DirectionMe[]
  earth_azimuth_deg: number[]
  earth_elevation_deg: number[]
  /** Fraction (0-1) of the Earth disc above the horizon (R3-2). */
  earth_visible_fraction: number[]
  earth_distance_km: number[]
  /** Optional while legacy processed artifacts are being regenerated. */
  earth_angular_radius_deg?: number[]
  earth_dir_me: DirectionMe[]
}

/** terrain/<site_id>.json */
export interface TerrainEvaluation {
  site_id: string
  safety_radius_meters: number
  center_elevation_meters: number
  max_slope_degrees: number
  mean_slope_degrees: number
  p95_slope_degrees: number
  is_slope_safe: boolean
  /** Optional until the product exists (REQUIREMENTS 5.5). */
  terrain_roughness_index?: number | null
  /** Optional until the product exists (REQUIREMENTS 5.5). */
  nearest_ice_deposit_meters?: number | null
}

/** POST /api/evaluate request. Either site_id or both lat_deg/lon_deg. */
export interface EvaluateRequest {
  site_id: string | null
  lat_deg: number | null
  lon_deg: number | null
  start_utc: string
  end_utc: string
}

export interface Veto {
  code: string
  message: string
}

export interface Criterion {
  code: string
  label: string
  normalized: number
  weight: number
  contribution: number
  detail: string
}

export interface EvaluationMetrics {
  sunlight_percent: number
  earth_visible_percent: number
  longest_darkness_hours: number
  next_sunset_utc: string | null
  next_sunrise_utc: string | null
  next_earthset_utc: string | null
  next_earthrise_utc: string | null
}

export interface EvaluateResponse {
  suitability_index: number
  traffic_light: TrafficLight
  precision: Precision
  vetoes: Veto[]
  criteria: Criterion[]
  metrics: EvaluationMetrics
  warnings: string[]
}
