import type { SeriesPoint, SiteSeriesResponse, SiteTimeSeries } from '@/types'

/** Contract 1.1: Earth is visible when its center is above the horizon, i.e. fraction >= 0.5. */
const EARTH_VISIBLE_MIN_FRACTION = 0.5

function optionalColumnValue(column: number[] | null | undefined, index: number, name: string): number | null {
  if (column == null) return null
  if (index >= column.length) {
    throw new Error(`Series column ${name} is shorter than time_utc.`)
  }
  return column[index]
}

/** Columnar series (contract 1.1) to UI rows, deriving the visibility booleans once. */
export function toSiteTimeSeries(response: SiteSeriesResponse): SiteTimeSeries {
  const series: SeriesPoint[] = response.time_utc.map((time_utc, i) => {
    const sunFraction = response.sun_visible_fraction[i]
    const earthFraction = response.earth_visible_fraction[i]
    return {
      time_utc,
      sun_azimuth_deg: response.sun_azimuth_deg[i],
      sun_elevation_deg: response.sun_elevation_deg[i],
      sun_visible_fraction: sunFraction,
      sun_visible: sunFraction > 0,
      sun_distance_km: response.sun_distance_km[i],
      sun_angular_radius_deg: optionalColumnValue(response.sun_angular_radius_deg, i, 'sun_angular_radius_deg'),
      sun_dir_me: response.sun_dir_me[i],
      earth_azimuth_deg: response.earth_azimuth_deg[i],
      earth_elevation_deg: response.earth_elevation_deg[i],
      earth_visible_fraction: earthFraction,
      earth_visible: earthFraction >= EARTH_VISIBLE_MIN_FRACTION,
      earth_distance_km: response.earth_distance_km[i],
      earth_angular_radius_deg: optionalColumnValue(
        response.earth_angular_radius_deg,
        i,
        'earth_angular_radius_deg',
      ),
      earth_dir_me: response.earth_dir_me[i],
    }
  })
  return {
    site_id: response.site_id,
    name: response.name,
    lat_deg: response.lat_deg,
    lon_deg: response.lon_deg,
    horizon_source: response.horizon_source,
    horizon_profile_deg: response.horizon_profile_deg,
    max_radius_m: response.max_radius_m,
    near_field_m: response.near_field_m,
    observer_height_m: response.observer_height_m,
    assumptions: response.assumptions,
    time_step_minutes: response.time_step_minutes,
    series,
  }
}
