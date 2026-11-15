import type { SeriesPoint, SiteTimeSeries } from '@/types'


export type DirectionVec = [number, number, number]

export interface BodyDirections {
  sunDir: DirectionVec
  earthDir: DirectionVec
}

const RAD = Math.PI / 180

/** Sample `index` of the columnar series; Sun visible when fraction > 0, Earth when center is above the horizon (fraction >= 0.5). */
export function seriesPointAtIndex(series: SiteTimeSeries, index: number): SeriesPoint {
  const sunFraction = series.sun_visible_fraction[index]
  const earthFraction = series.earth_visible_fraction[index]
  return {
    time_utc: series.time_utc[index],
    sun_azimuth_deg: series.sun_azimuth_deg[index],
    sun_elevation_deg: series.sun_elevation_deg[index],
    sun_visible_fraction: sunFraction,
    sun_visible: sunFraction > 0,
    earth_azimuth_deg: series.earth_azimuth_deg[index],
    earth_elevation_deg: series.earth_elevation_deg[index],
    earth_visible_fraction: earthFraction,
    earth_visible: earthFraction >= 0.5,
  }
}

/** Series point closest to `timeUtc`; the first point when the cursor is missing. */
export function seriesPointAt(series: SiteTimeSeries, timeUtc: string | null): SeriesPoint | null {
  if (series.time_utc.length === 0) return null
  if (timeUtc === null) return seriesPointAtIndex(series, 0)
  const target = Date.parse(timeUtc)
  if (Number.isNaN(target)) return seriesPointAtIndex(series, 0)
  let bestIndex = 0
  let bestDelta = Math.abs(Date.parse(series.time_utc[0]) - target)
  for (let i = 1; i < series.time_utc.length; i += 1) {
    const delta = Math.abs(Date.parse(series.time_utc[i]) - target)
    if (delta < bestDelta) {
      bestIndex = i
      bestDelta = delta
    }
  }
  return seriesPointAtIndex(series, bestIndex)
}

/**
 * Local azimuth/elevation to scene axes. Matches `canvas/surface.ts`:
 * +Y is the north pole, longitude 0 on +X, east toward -Z.
 */
function bodyDirection(
  latDeg: number,
  lonDeg: number,
  azimuthDeg: number,
  elevationDeg: number,
): DirectionVec {
  const lat = latDeg * RAD
  const lon = lonDeg * RAD
  const az = azimuthDeg * RAD
  const el = elevationDeg * RAD

  const up: DirectionVec = [Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon)]
  const north: DirectionVec = [-Math.sin(lat) * Math.cos(lon), Math.cos(lat), Math.sin(lat) * Math.sin(lon)]
  const east: DirectionVec = [-Math.sin(lon), 0, -Math.cos(lon)]

  const cosEl = Math.cos(el)
  const sinEl = Math.sin(el)
  const cosAz = Math.cos(az)
  const sinAz = Math.sin(az)
  const dir: DirectionVec = [
    cosEl * (cosAz * north[0] + sinAz * east[0]) + sinEl * up[0],
    cosEl * (cosAz * north[1] + sinAz * east[1]) + sinEl * up[1],
    cosEl * (cosAz * north[2] + sinAz * east[2]) + sinEl * up[2],
  ]
  const length = Math.hypot(...dir) || 1
  return [dir[0] / length, dir[1] / length, dir[2] / length]
}

export function bodiesForSeries(
  series: SiteTimeSeries,
  timeUtc: string | null,
): BodyDirections | null {
  const point = seriesPointAt(series, timeUtc)
  if (point === null) return null
  return {
    sunDir: bodyDirection(
      series.lat_deg,
      series.lon_deg,
      point.sun_azimuth_deg,
      point.sun_elevation_deg,
    ),
    earthDir: bodyDirection(
      series.lat_deg,
      series.lon_deg,
      point.earth_azimuth_deg,
      point.earth_elevation_deg,
    ),
  }
}
